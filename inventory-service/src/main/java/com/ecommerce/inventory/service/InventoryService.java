package com.ecommerce.inventory.service;

import com.ecommerce.inventory.dto.InventoryDTO;
import com.ecommerce.inventory.entity.Inventory;
import com.ecommerce.inventory.exception.InsufficientInventoryException;
import com.ecommerce.inventory.exception.ResourceNotFoundException;
import com.ecommerce.inventory.kafka.InventoryEventProducer;
import com.ecommerce.inventory.repository.InventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final InventoryEventProducer eventProducer;

    public InventoryService(InventoryRepository inventoryRepository, InventoryEventProducer eventProducer) {
        this.inventoryRepository = inventoryRepository;
        this.eventProducer = eventProducer;
    }

    public InventoryDTO getInventoryByProductId(Long productId) {
        return aggregate(productId, getSources(productId));
    }

    public List<InventoryDTO> getInventorySources(Long productId) {
        return getSources(productId).stream().map(this::mapToDTO).toList();
    }

    public List<InventoryDTO> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<InventoryDTO> getLowStockItems() {
        return inventoryRepository.findLowStockItems().stream()
                .map(this::mapToDTO)
                .toList();
    }

    public InventoryDTO createInventory(InventoryDTO.CreateRequest request) {
        if (inventoryRepository.existsByProductIdAndSourceCodeIgnoreCase(
                request.getProductId(), request.getSourceCode())) {
            throw new InsufficientInventoryException(
                    "This inventory source already exists for the product", "DUPLICATE_INVENTORY_SOURCE");
        }

        Inventory inventory = new Inventory();
        inventory.setProductId(request.getProductId());
        inventory.setSourceCode(request.getSourceCode().trim().toUpperCase());
        inventory.setSku(request.getSku());
        inventory.setAvailableQuantity(request.getAvailableQuantity());
        inventory.setReorderLevel(request.getReorderLevel());
        inventory.setWarehouseLocation(request.getWarehouseLocation());

        inventory = inventoryRepository.save(inventory);
        logger.info("Inventory created for product: {} with quantity: {}", request.getProductId(), request.getAvailableQuantity());
        return mapToDTO(inventory);
    }

    public InventoryDTO updateInventory(Long id, InventoryDTO.UpdateRequest request) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory source not found: " + id));

        if (request.getAvailableQuantity() != null) inventory.setAvailableQuantity(request.getAvailableQuantity());
        if (request.getReorderLevel() != null) inventory.setReorderLevel(request.getReorderLevel());
        if (request.getWarehouseLocation() != null) inventory.setWarehouseLocation(request.getWarehouseLocation());

        inventory = inventoryRepository.save(inventory);
        logger.info("Inventory source updated: {}", id);
        return mapToDTO(inventory);
    }

    public void deleteInventory(Long id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory source not found: " + id));
        if (inventory.getReservedQuantity() > 0) {
            throw new InsufficientInventoryException("Cannot delete inventory while stock is reserved", "INVENTORY_RESERVED");
        }
        inventoryRepository.delete(inventory);
        logger.info("Inventory source deleted: {}", id);
    }

    @Transactional
    public InventoryDTO reserveInventory(Long productId, Integer quantity) {
        List<Inventory> sources = getSources(productId);
        int available = sources.stream().mapToInt(Inventory::getAvailableQuantity).sum();
        if (available < quantity) {
            throw new InsufficientInventoryException(
                String.format("Insufficient stock. Available: %d, Requested: %d",
                    available, quantity));
        }
        moveAvailableToReserved(sources, quantity);
        inventoryRepository.saveAll(sources);

        logger.info("Inventory reserved for product: {} - Quantity: {}", productId, quantity);
        return aggregate(productId, sources);
    }

    @Transactional
    public void releaseInventory(Long productId, Integer quantity) {
        List<Inventory> sources = getSources(productId);
        moveReserved(sources, quantity, true);
        inventoryRepository.saveAll(sources);

        logger.info("Inventory released for product: {} - Quantity: {}", productId, quantity);
    }

    @Transactional
    public void deductInventory(Long productId, Integer quantity) {
        List<Inventory> sources = getSources(productId);
        moveReserved(sources, quantity, false);
        inventoryRepository.saveAll(sources);

        logger.info("Inventory deducted for product: {} - Quantity: {}", productId, quantity);
    }

    public boolean checkAvailability(Long productId, Integer quantity) {
        return inventoryRepository.findAllByProductIdOrderByIdAsc(productId).stream()
                .mapToInt(Inventory::getAvailableQuantity).sum() >= quantity;
    }

    private InventoryDTO mapToDTO(Inventory inventory) {
        InventoryDTO dto = new InventoryDTO();
        dto.setId(inventory.getId());
        dto.setProductId(inventory.getProductId());
        dto.setSourceCode(inventory.getSourceCode());
        dto.setSku(inventory.getSku());
        dto.setAvailableQuantity(inventory.getAvailableQuantity());
        dto.setReservedQuantity(inventory.getReservedQuantity());
        dto.setReorderLevel(inventory.getReorderLevel());
        dto.setWarehouseLocation(inventory.getWarehouseLocation());
        dto.setUpdatedAt(inventory.getUpdatedAt());

        if (inventory.getAvailableQuantity() == 0) {
            dto.setStockStatus("OUT_OF_STOCK");
        } else if (inventory.getAvailableQuantity() <= inventory.getReorderLevel()) {
            dto.setStockStatus("LOW_STOCK");
        } else {
            dto.setStockStatus("IN_STOCK");
        }

        return dto;
    }

    private List<Inventory> getSources(Long productId) {
        List<Inventory> sources = inventoryRepository.findAllByProductIdOrderByIdAsc(productId);
        if (sources.isEmpty()) {
            throw new ResourceNotFoundException("Inventory not found for product: " + productId);
        }
        return sources;
    }

    private void moveAvailableToReserved(List<Inventory> sources, int quantity) {
        int remaining = quantity;
        for (Inventory source : sources) {
            int moved = Math.min(source.getAvailableQuantity(), remaining);
            source.setAvailableQuantity(source.getAvailableQuantity() - moved);
            source.setReservedQuantity(source.getReservedQuantity() + moved);
            remaining -= moved;
            if (remaining == 0) return;
        }
    }

    private void moveReserved(List<Inventory> sources, int quantity, boolean restoreAvailable) {
        int reserved = sources.stream().mapToInt(Inventory::getReservedQuantity).sum();
        if (reserved < quantity) {
            throw new InsufficientInventoryException("Reserved quantity is lower than requested quantity");
        }
        int remaining = quantity;
        for (Inventory source : sources) {
            int moved = Math.min(source.getReservedQuantity(), remaining);
            source.setReservedQuantity(source.getReservedQuantity() - moved);
            if (restoreAvailable) source.setAvailableQuantity(source.getAvailableQuantity() + moved);
            remaining -= moved;
            if (remaining == 0) return;
        }
    }

    private InventoryDTO aggregate(Long productId, List<Inventory> sources) {
        InventoryDTO dto = new InventoryDTO();
        dto.setProductId(productId);
        dto.setSku(sources.get(0).getSku());
        dto.setSourceCode(sources.size() == 1 ? sources.get(0).getSourceCode() : "MULTIPLE");
        dto.setAvailableQuantity(sources.stream().mapToInt(Inventory::getAvailableQuantity).sum());
        dto.setReservedQuantity(sources.stream().mapToInt(Inventory::getReservedQuantity).sum());
        dto.setReorderLevel(sources.stream().mapToInt(Inventory::getReorderLevel).sum());
        dto.setWarehouseLocation(sources.size() == 1 ? sources.get(0).getWarehouseLocation() : "Multiple sources");
        dto.setStockStatus(dto.getAvailableQuantity() == 0 ? "OUT_OF_STOCK"
                : dto.getAvailableQuantity() <= dto.getReorderLevel() ? "LOW_STOCK" : "IN_STOCK");
        return dto;
    }
}

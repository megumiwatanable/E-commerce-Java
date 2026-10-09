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
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));
        return mapToDTO(inventory);
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
        if (inventoryRepository.existsByProductId(request.getProductId())) {
            throw new InsufficientInventoryException("Inventory already exists for this product", "DUPLICATE_INVENTORY");
        }

        Inventory inventory = new Inventory();
        inventory.setProductId(request.getProductId());
        inventory.setSku(request.getSku());
        inventory.setAvailableQuantity(request.getAvailableQuantity());
        inventory.setReorderLevel(request.getReorderLevel());
        inventory.setWarehouseLocation(request.getWarehouseLocation());

        inventory = inventoryRepository.save(inventory);
        logger.info("Inventory created for product: {} with quantity: {}", request.getProductId(), request.getAvailableQuantity());
        return mapToDTO(inventory);
    }

    public InventoryDTO updateInventory(Long productId, InventoryDTO.UpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));

        if (request.getAvailableQuantity() != null) inventory.setAvailableQuantity(request.getAvailableQuantity());
        if (request.getReorderLevel() != null) inventory.setReorderLevel(request.getReorderLevel());
        if (request.getWarehouseLocation() != null) inventory.setWarehouseLocation(request.getWarehouseLocation());

        inventory = inventoryRepository.save(inventory);
        logger.info("Inventory updated for product: {}", productId);
        return mapToDTO(inventory);
    }

    public void deleteInventory(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));
        if (inventory.getReservedQuantity() > 0) {
            throw new InsufficientInventoryException("Cannot delete inventory while stock is reserved", "INVENTORY_RESERVED");
        }
        inventoryRepository.delete(inventory);
        logger.info("Inventory deleted for product: {}", productId);
    }

    @Transactional
    public InventoryDTO reserveInventory(Long productId, Integer quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));

        if (inventory.getAvailableQuantity() < quantity) {
            throw new InsufficientInventoryException(
                String.format("Insufficient stock. Available: %d, Requested: %d",
                    inventory.getAvailableQuantity(), quantity));
        }

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventory = inventoryRepository.save(inventory);

        logger.info("Inventory reserved for product: {} - Quantity: {}", productId, quantity);
        return mapToDTO(inventory);
    }

    @Transactional
    public void releaseInventory(Long productId, Integer quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));

        inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
        inventoryRepository.save(inventory);

        logger.info("Inventory released for product: {} - Quantity: {}", productId, quantity);
    }

    @Transactional
    public void deductInventory(Long productId, Integer quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product: " + productId));

        inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
        inventoryRepository.save(inventory);

        logger.info("Inventory deducted for product: {} - Quantity: {}", productId, quantity);
    }

    public boolean checkAvailability(Long productId, Integer quantity) {
        return inventoryRepository.findByProductId(productId)
                .map(inv -> inv.getAvailableQuantity() >= quantity)
                .orElse(false);
    }

    private InventoryDTO mapToDTO(Inventory inventory) {
        InventoryDTO dto = new InventoryDTO();
        dto.setId(inventory.getId());
        dto.setProductId(inventory.getProductId());
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
}

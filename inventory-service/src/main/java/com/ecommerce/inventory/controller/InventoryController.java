package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.dto.ApiResponse;
import com.ecommerce.inventory.dto.InventoryDTO;
import com.ecommerce.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryDTO>>> getAllInventory() {
        List<InventoryDTO> inventory = inventoryService.getAllInventory();
        return ResponseEntity.ok(ApiResponse.success("Inventory retrieved", inventory));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<InventoryDTO>> getInventoryByProductId(@PathVariable Long productId) {
        InventoryDTO inventory = inventoryService.getInventoryByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success("Inventory retrieved", inventory));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<InventoryDTO>>> getInventorySources(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success("Inventory sources retrieved",
                inventoryService.getInventorySources(productId)));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<InventoryDTO>>> getLowStockItems() {
        List<InventoryDTO> inventory = inventoryService.getLowStockItems();
        return ResponseEntity.ok(ApiResponse.success("Low stock items retrieved", inventory));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InventoryDTO>> createInventory(
            @Valid @RequestBody InventoryDTO.CreateRequest request) {
        InventoryDTO inventory = inventoryService.createInventory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inventory created", inventory));
    }

    @PutMapping("/records/{id}")
    public ResponseEntity<ApiResponse<InventoryDTO>> updateInventory(
            @PathVariable Long id,
            @RequestBody InventoryDTO.UpdateRequest request) {
        InventoryDTO inventory = inventoryService.updateInventory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Inventory updated", inventory));
    }

    @DeleteMapping("/records/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteInventory(@PathVariable Long id) {
        inventoryService.deleteInventory(id);
        return ResponseEntity.ok(ApiResponse.success("Inventory deleted"));
    }

    @PostMapping("/reserve")
    public ResponseEntity<ApiResponse<InventoryDTO>> reserveInventory(
            @Valid @RequestBody InventoryDTO.ReserveRequest request) {
        InventoryDTO inventory = inventoryService.reserveInventory(request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Inventory reserved", inventory));
    }

    @PostMapping("/release")
    public ResponseEntity<ApiResponse<Void>> releaseInventory(
            @Valid @RequestBody InventoryDTO.ReserveRequest request) {
        inventoryService.releaseInventory(request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Inventory released"));
    }

    @PostMapping("/deduct")
    public ResponseEntity<ApiResponse<Void>> deductInventory(
            @Valid @RequestBody InventoryDTO.ReserveRequest request) {
        inventoryService.deductInventory(request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Inventory deducted"));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> checkAvailability(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        boolean available = inventoryService.checkAvailability(productId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Availability check", available));
    }
}

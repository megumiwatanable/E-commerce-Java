package com.ecommerce.inventory.repository;

import com.ecommerce.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findAllByProductIdOrderByIdAsc(Long productId);
    boolean existsByProductIdAndSourceCodeIgnoreCase(Long productId, String sourceCode);

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity <= i.reorderLevel AND i.availableQuantity > 0")
    List<Inventory> findLowStockItems();

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity = 0")
    List<Inventory> findOutOfStockItems();
}

package com.ecommerce.product.repository;

import com.ecommerce.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    @Query("SELECT DISTINCT p FROM Product p JOIN p.categories c WHERE c.id = :categoryId")
    Page<Product> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    Page<Product> findByStatus(Product.ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = com.ecommerce.product.entity.Product$ProductStatus.ACTIVE AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = com.ecommerce.product.entity.Product$ProductStatus.ACTIVE AND " +
           "(:categoryId IS NULL OR EXISTS (SELECT c.id FROM p.categories c WHERE c.id = :categoryId)) AND " +
           "(:brand IS NULL OR LOWER(p.brand) = LOWER(:brand)) AND " +
           "(:minPrice IS NULL OR p.finalPrice >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.finalPrice <= :maxPrice)")
    Page<Product> findFilteredProducts(
            @Param("categoryId") Long categoryId,
            @Param("brand") String brand,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = com.ecommerce.product.entity.Product$ProductStatus.ACTIVE ORDER BY p.rating DESC")
    List<Product> findTopRatedProducts(Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p JOIN p.categories c WHERE c.id = :categoryId AND p.status = :status")
    List<Product> findByCategoryIdAndStatus(@Param("categoryId") Long categoryId,
                                            @Param("status") Product.ProductStatus status);
}

package com.ecommerce.product.service;

import com.ecommerce.product.dto.CategoryDTO;
import com.ecommerce.product.dto.ProductDTO;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.exception.DuplicateResourceException;
import com.ecommerce.product.exception.ResourceNotFoundException;
import com.ecommerce.product.repository.CategoryRepository;
import com.ecommerce.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Unit Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = new Category("Electronics", "Electronic devices");
        testCategory.setId(1L);

        testProduct = new Product("ELEC-001", "Test Product", "Description", 1L,
                "Brand", BigDecimal.valueOf(100), BigDecimal.TEN, "http://image.jpg");
        testProduct.setId(1L);
        testProduct.setRating(BigDecimal.valueOf(4.5));
        testProduct.setStatus(Product.ProductStatus.ACTIVE);
    }

    // ===== GET PRODUCT TESTS =====

    @Test
    @DisplayName("Get Product By ID - Success")
    void getProductById_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        ProductDTO result = productService.getProductById(1L);

        assertNotNull(result);
        assertEquals("ELEC-001", result.getSku());
        assertEquals("Test Product", result.getName());
        assertEquals("Brand", result.getBrand());
        assertEquals("Electronics", result.getCategoryName());
        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    @DisplayName("Get Product By ID - Not Found Throws Exception")
    void getProductById_NotFound_ThrowsException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> productService.getProductById(99L)
        );

        assertTrue(exception.getMessage().contains("99"));
    }

    @Test
    @DisplayName("Get All Products - Success")
    void getAllProducts_Success() {
        Page<Product> productPage = new PageImpl<>(List.of(testProduct));
        when(productRepository.findByStatus(eq(Product.ProductStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(productPage);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        Page<ProductDTO> result = productService.getAllProducts(0, 10, "createdAt", "desc");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Test Product", result.getContent().get(0).getName());
    }

    // ===== CREATE PRODUCT TESTS =====

    @Test
    @DisplayName("Create Product - Success")
    void createProduct_Success() {
        ProductDTO.CreateRequest request = new ProductDTO.CreateRequest();
        request.setSku("NEW-001");
        request.setName("New Product");
        request.setCategoryId(1L);
        request.setPrice(BigDecimal.valueOf(50));
        request.setDiscountPercentage(BigDecimal.ZERO);

        when(productRepository.existsBySku("NEW-001")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        ProductDTO result = productService.createProduct(request);

        assertNotNull(result);
        assertEquals("NEW-001", result.getSku());
        assertEquals("New Product", result.getName());
        assertEquals(BigDecimal.valueOf(50), result.getPrice());

        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Create Product - Duplicate SKU Throws Exception")
    void createProduct_DuplicateSku_ThrowsException() {
        ProductDTO.CreateRequest request = new ProductDTO.CreateRequest();
        request.setSku("ELEC-001");
        request.setName("Duplicate");
        request.setCategoryId(1L);
        request.setPrice(BigDecimal.valueOf(50));

        when(productRepository.existsBySku("ELEC-001")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> productService.createProduct(request)
        );

        assertEquals("DUPLICATE_SKU", exception.getErrorCode());
        verify(productRepository, never()).save(any());
    }

    // ===== UPDATE PRODUCT TESTS =====

    @Test
    @DisplayName("Update Product - Success")
    void updateProduct_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        ProductDTO.UpdateRequest request = new ProductDTO.UpdateRequest();
        request.setName("Updated Product");
        request.setPrice(BigDecimal.valueOf(150));

        ProductDTO result = productService.updateProduct(1L, request);

        assertNotNull(result);
        assertEquals("Updated Product", result.getName());
        assertEquals(BigDecimal.valueOf(150), result.getPrice());
    }

    @Test
    @DisplayName("Update Product - Not Found Throws Exception")
    void updateProduct_NotFound_ThrowsException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        ProductDTO.UpdateRequest request = new ProductDTO.UpdateRequest();
        request.setName("Updated");

        assertThrows(ResourceNotFoundException.class,
                () -> productService.updateProduct(99L, request));
    }

    // ===== DELETE PRODUCT TESTS =====

    @Test
    @DisplayName("Delete Product - Success (Soft Delete)")
    void deleteProduct_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.deleteProduct(1L);

        assertEquals(Product.ProductStatus.INACTIVE, testProduct.getStatus());
        verify(productRepository).save(testProduct);
    }

    @Test
    @DisplayName("Delete Product - Not Found Throws Exception")
    void deleteProduct_NotFound_ThrowsException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> productService.deleteProduct(99L));
    }

    // ===== CATEGORY TESTS =====

    @Test
    @DisplayName("Get All Categories - Success")
    void getAllCategories_Success() {
        when(categoryRepository.findByStatus(Category.CategoryStatus.ACTIVE))
                .thenReturn(List.of(testCategory));

        List<CategoryDTO> result = productService.getAllCategories();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Electronics", result.get(0).getName());
    }

    @Test
    @DisplayName("Create Category - Success")
    void createCategory_Success() {
        CategoryDTO.CreateRequest request = new CategoryDTO.CreateRequest();
        request.setName("Clothing");
        request.setDescription("Fashion items");

        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category c = invocation.getArgument(0);
            c.setId(2L);
            return c;
        });

        CategoryDTO result = productService.createCategory(request);

        assertNotNull(result);
        assertEquals("Clothing", result.getName());
    }

    @Test
    @DisplayName("Delete Category - Success (Soft Delete)")
    void deleteCategory_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.deleteCategory(1L);

        assertEquals(Category.CategoryStatus.INACTIVE, testCategory.getStatus());
    }

    @Test
    @DisplayName("Delete Category - Not Found Throws Exception")
    void deleteCategory_NotFound_ThrowsException() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> productService.deleteCategory(99L));
    }
}

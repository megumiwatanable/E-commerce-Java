package com.ecommerce.product.service;

import com.ecommerce.product.dto.CategoryDTO;
import com.ecommerce.product.dto.ProductDTO;
import com.ecommerce.product.entity.Category;
import com.ecommerce.product.entity.Product;
import com.ecommerce.product.exception.DuplicateResourceException;
import com.ecommerce.product.exception.ResourceNotFoundException;
import com.ecommerce.product.repository.CategoryRepository;
import com.ecommerce.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.LinkedHashSet;

@Service
@Transactional
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public Page<ProductDTO> getAllProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findByStatus(Product.ProductStatus.ACTIVE, pageable)
                .map(this::mapToDTO);
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToDTO(product);
    }

    public Page<ProductDTO> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.searchProducts(keyword, pageable)
                .map(this::mapToDTO);
    }

    public Page<ProductDTO> getProductsByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByCategoryId(categoryId, pageable)
                .map(this::mapToDTO);
    }

    public Page<ProductDTO> getFilteredProducts(Long categoryId, String brand,
                                                 BigDecimal minPrice, BigDecimal maxPrice,
                                                 int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findFilteredProducts(categoryId, brand, minPrice, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    public List<ProductDTO> getTopRatedProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return productRepository.findTopRatedProducts(pageable)
                .stream().map(this::mapToDTO).toList();
    }

    public ProductDTO createProduct(ProductDTO.CreateRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Product with SKU already exists", "DUPLICATE_SKU");
        }

        Product product = new Product();
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategories(resolveCategories(normalizeCategoryIds(request.getCategoryIds(), request.getCategoryId())));
        product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        product.setDiscountPercentage(request.getDiscountPercentage() != null ?
                request.getDiscountPercentage() : BigDecimal.ZERO);
        product.setImageUrl(request.getImageUrl());
        product.setStatus(Product.ProductStatus.ACTIVE);

        product = productRepository.save(product);
        logger.info("Product created: {} with SKU: {}", product.getName(), product.getSku());
        return mapToDTO(product);
    }

    public ProductDTO updateProduct(Long id, ProductDTO.UpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getCategoryIds() != null || request.getCategoryId() != null) {
            product.setCategories(resolveCategories(normalizeCategoryIds(request.getCategoryIds(), request.getCategoryId())));
        }
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getDiscountPercentage() != null) product.setDiscountPercentage(request.getDiscountPercentage());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) {
            product.setStatus(Product.ProductStatus.valueOf(request.getStatus()));
        }

        product = productRepository.save(product);
        logger.info("Product updated: {}", product.getName());
        return mapToDTO(product);
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        product.setStatus(Product.ProductStatus.INACTIVE);
        productRepository.save(product);
        logger.info("Product deactivated: {}", product.getName());
    }

    // Category methods
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByStatus(Category.CategoryStatus.ACTIVE)
                .stream().map(this::mapCategoryToDTO).toList();
    }

    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapCategoryToDTO(category);
    }

    public CategoryDTO createCategory(CategoryDTO.CreateRequest request) {
        Category category = new Category(request.getName(), request.getDescription());
        category = categoryRepository.save(category);
        logger.info("Category created: {}", category.getName());
        return mapCategoryToDTO(category);
    }

    public CategoryDTO updateCategory(Long id, CategoryDTO.CreateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        category = categoryRepository.save(category);
        return mapCategoryToDTO(category);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setStatus(Category.CategoryStatus.INACTIVE);
        categoryRepository.save(category);
    }

    private ProductDTO mapToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setSku(product.getSku());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        List<Category> categories = product.getCategories().stream().toList();
        dto.setCategoryIds(categories.stream().map(Category::getId).toList());
        dto.setCategoryNames(categories.stream().map(Category::getName).toList());
        if (!categories.isEmpty()) {
            dto.setCategoryId(categories.get(0).getId());
            dto.setCategoryName(categories.get(0).getName());
        } else if (product.getCategoryId() != null) {
            dto.setCategoryId(product.getCategoryId());
            categoryRepository.findById(product.getCategoryId()).ifPresent(category -> {
                dto.setCategoryName(category.getName());
                dto.setCategoryIds(List.of(category.getId()));
                dto.setCategoryNames(List.of(category.getName()));
            });
        }
        dto.setBrand(product.getBrand());
        dto.setPrice(product.getPrice());
        dto.setDiscountPercentage(product.getDiscountPercentage());
        dto.setFinalPrice(product.getFinalPrice());
        dto.setImageUrl(product.getImageUrl());
        dto.setRating(product.getRating());
        dto.setStatus(product.getStatus().name());
        dto.setCreatedAt(product.getCreatedAt());

        return dto;
    }

    private LinkedHashSet<Category> resolveCategories(List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new ResourceNotFoundException("At least one category is required");
        }
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.isEmpty()) {
            categories = categoryIds.stream()
                    .map(categoryRepository::findById)
                    .flatMap(java.util.Optional::stream)
                    .toList();
        }
        if (categories.size() != categoryIds.stream().distinct().count()) {
            throw new ResourceNotFoundException("One or more categories do not exist");
        }
        return new LinkedHashSet<>(categories);
    }

    private List<Long> normalizeCategoryIds(List<Long> categoryIds, Long legacyCategoryId) {
        return categoryIds != null && !categoryIds.isEmpty()
                ? categoryIds
                : legacyCategoryId == null ? List.of() : List.of(legacyCategoryId);
    }

    private CategoryDTO mapCategoryToDTO(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setStatus(category.getStatus().name());
        dto.setCreatedAt(category.getCreatedAt());
        return dto;
    }
}

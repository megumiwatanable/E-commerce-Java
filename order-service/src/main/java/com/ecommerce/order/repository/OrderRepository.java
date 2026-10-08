package com.ecommerce.order.repository;

import com.ecommerce.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByCheckoutToken(String checkoutToken);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByOrderStatus(Order.OrderStatus status, Pageable pageable);
    long countByOrderStatus(Order.OrderStatus status);
}

package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentDTO;
import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.exception.PaymentFailedException;
import com.ecommerce.payment.exception.ResourceNotFoundException;
import com.ecommerce.payment.kafka.PaymentEventProducer;
import com.ecommerce.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final PaymentEventProducer eventProducer;

    public PaymentService(PaymentRepository paymentRepository, PaymentEventProducer eventProducer) {
        this.paymentRepository = paymentRepository;
        this.eventProducer = eventProducer;
    }

    public PaymentDTO processPayment(PaymentDTO.ProcessPaymentRequest request, Long customerId) {
        // Check if payment already exists for this order
        if (paymentRepository.findByOrderId(request.getOrderId()).isPresent()) {
            Payment existing = paymentRepository.findByOrderId(request.getOrderId()).get();
            if (existing.getStatus() == Payment.PaymentStatus.COMPLETED) {
                throw new PaymentFailedException("Payment already completed for this order");
            }
        }

        Payment payment = new Payment();
        payment.setPaymentReference(generatePaymentReference());
        payment.setOrderId(request.getOrderId());
        payment.setCustomerId(customerId);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(Payment.PaymentMethod.valueOf(request.getPaymentMethod()));
        payment.setStatus(Payment.PaymentStatus.PENDING);

        payment = paymentRepository.save(payment);
        logger.info("Payment initiated: {} for order: {}", payment.getPaymentReference(), request.getOrderId());

        // Simulate payment processing
        boolean paymentSuccessful = simulatePayment(request.getPaymentMethod(), request.getAmount());

        if (paymentSuccessful) {
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            payment.setTransactionDate(LocalDateTime.now());
            payment = paymentRepository.save(payment);
            logger.info("Payment completed: {} for order: {}", payment.getPaymentReference(), request.getOrderId());
            eventProducer.publishPaymentCompletedEvent(request.getOrderId(), customerId,
                    payment.getPaymentReference(), request.getAmount());
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Simulated payment failure - please try again");
            payment.setTransactionDate(LocalDateTime.now());
            payment = paymentRepository.save(payment);
            logger.warn("Payment failed: {} for order: {}", payment.getPaymentReference(), request.getOrderId());
            eventProducer.publishPaymentFailedEvent(request.getOrderId(), customerId,
                    payment.getPaymentReference(), payment.getFailureReason());
        }

        return mapToDTO(payment);
    }

    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return mapToDTO(payment);
    }

    public PaymentDTO getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
        return mapToDTO(payment);
    }

    public List<PaymentDTO> getPaymentsByCustomerId(Long customerId) {
        return paymentRepository.findByCustomerId(customerId).stream()
                .map(this::mapToDTO).toList();
    }

    public Page<PaymentDTO> getAllPayments(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return paymentRepository.findAll(pageable).map(this::mapToDTO);
    }

    public Page<PaymentDTO> getPaymentsByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Payment.PaymentStatus paymentStatus = Payment.PaymentStatus.valueOf(status);
        return paymentRepository.findByStatus(paymentStatus, pageable).map(this::mapToDTO);
    }

    public Map<String, Object> getPaymentStats() {
        return Map.of(
                "totalPayments", paymentRepository.count(),
                "successfulPayments", paymentRepository.countByStatus(Payment.PaymentStatus.COMPLETED),
                "failedPayments", paymentRepository.countByStatus(Payment.PaymentStatus.FAILED),
                "pendingPayments", paymentRepository.countByStatus(Payment.PaymentStatus.PENDING)
        );
    }

    // Simulate payment - returns true ~85% of the time for CARD/UPI/NET_BANKING
    // Always succeeds for CASH_ON_DELIVERY
    private boolean simulatePayment(String paymentMethod, java.math.BigDecimal amount) {
        if ("CASH_ON_DELIVERY".equals(paymentMethod)) {
            return true;
        }

        // Simulate: 85% success rate for electronic payments
        return ThreadLocalRandom.current().nextDouble() < 0.85;
    }

    private String generatePaymentReference() {
        return "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private PaymentDTO mapToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setPaymentReference(payment.getPaymentReference());
        dto.setOrderId(payment.getOrderId());
        dto.setCustomerId(payment.getCustomerId());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod().name());
        dto.setStatus(payment.getStatus().name());
        dto.setTransactionDate(payment.getTransactionDate());
        dto.setFailureReason(payment.getFailureReason());
        dto.setCreatedAt(payment.getCreatedAt());
        return dto;
    }
}

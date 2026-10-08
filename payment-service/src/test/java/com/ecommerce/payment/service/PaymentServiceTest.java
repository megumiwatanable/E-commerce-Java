package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentDTO;
import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.exception.PaymentFailedException;
import com.ecommerce.payment.exception.ResourceNotFoundException;
import com.ecommerce.payment.kafka.PaymentEventProducer;
import com.ecommerce.payment.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Unit Tests")
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    private PaymentService paymentService;

    private Payment testPayment;

    @BeforeEach
    void setUp() {
        // Create real producer with null KafkaTemplate (avoids Java 24 Mockito restrictions)
        PaymentEventProducer eventProducer = new PaymentEventProducer(null, new ObjectMapper());
        paymentService = new PaymentService(paymentRepository, eventProducer);

        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setPaymentReference("PAY-ABC12345");
        testPayment.setOrderId(1L);
        testPayment.setCustomerId(1L);
        testPayment.setAmount(BigDecimal.valueOf(236));
        testPayment.setPaymentMethod(Payment.PaymentMethod.CARD);
        testPayment.setStatus(Payment.PaymentStatus.COMPLETED);
        testPayment.setTransactionDate(LocalDateTime.now());
    }

    // ===== GET PAYMENT TESTS =====

    @Test
    @DisplayName("Get Payment By ID - Success")
    void getPaymentById_Success() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        PaymentDTO result = paymentService.getPaymentById(1L);
        assertNotNull(result);
        assertEquals("PAY-ABC12345", result.getPaymentReference());
        assertEquals("COMPLETED", result.getStatus());
        assertEquals("CARD", result.getPaymentMethod());
    }

    @Test
    @DisplayName("Get Payment By ID - Not Found")
    void getPaymentById_NotFound_Throws() {
        when(paymentRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> paymentService.getPaymentById(99L));
    }

    @Test
    @DisplayName("Get Payment By Order ID - Success")
    void getPaymentByOrderId_Success() {
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(testPayment));
        PaymentDTO result = paymentService.getPaymentByOrderId(1L);
        assertEquals(1L, result.getOrderId());
    }

    @Test
    @DisplayName("Get Payment By Order ID - Not Found")
    void getPaymentByOrderId_NotFound_Throws() {
        when(paymentRepository.findByOrderId(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> paymentService.getPaymentByOrderId(99L));
    }

    @Test
    @DisplayName("Get Payments By Customer ID")
    void getPaymentsByCustomerId_Success() {
        when(paymentRepository.findByCustomerId(1L)).thenReturn(List.of(testPayment));
        List<PaymentDTO> result = paymentService.getPaymentsByCustomerId(1L);
        assertEquals(1, result.size());
        assertEquals("PAY-ABC12345", result.get(0).getPaymentReference());
    }

    @Test
    @DisplayName("Get All Payments - Paginated")
    void getAllPayments_Success() {
        Page<Payment> page = new PageImpl<>(List.of(testPayment));
        when(paymentRepository.findAll(any(Pageable.class))).thenReturn(page);
        Page<PaymentDTO> result = paymentService.getAllPayments(0, 10);
        assertEquals(1, result.getContent().size());
    }

    // ===== PROCESS PAYMENT TESTS =====

    @Test
    @DisplayName("Process Payment - CASH_ON_DELIVERY Always Succeeds")
    void processPayment_CashOnDelivery_AlwaysSuccess() {
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0); p.setId(2L); return p;
        });
        PaymentDTO.ProcessPaymentRequest req = new PaymentDTO.ProcessPaymentRequest();
        req.setOrderId(1L);
        req.setAmount(BigDecimal.valueOf(236));
        req.setPaymentMethod("CASH_ON_DELIVERY");
        PaymentDTO result = paymentService.processPayment(req, 1L);
        assertEquals("COMPLETED", result.getStatus());
        assertNotNull(result.getPaymentReference());
    }

    @Test
    @DisplayName("Process Payment - Already Completed Throws")
    void processPayment_AlreadyCompleted_Throws() {
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(testPayment));
        PaymentDTO.ProcessPaymentRequest req = new PaymentDTO.ProcessPaymentRequest();
        req.setOrderId(1L);
        req.setAmount(BigDecimal.valueOf(236));
        req.setPaymentMethod("CARD");
        assertThrows(PaymentFailedException.class, () -> paymentService.processPayment(req, 1L));
    }

    @Test
    @DisplayName("Process Payment - Electronic Payment Simulates Success/Failure")
    void processPayment_Electronic_Simulates() {
        when(paymentRepository.findByOrderId(2L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0); p.setId(3L); return p;
        });
        PaymentDTO.ProcessPaymentRequest req = new PaymentDTO.ProcessPaymentRequest();
        req.setOrderId(2L);
        req.setAmount(BigDecimal.valueOf(100));
        req.setPaymentMethod("UPI");
        PaymentDTO result = paymentService.processPayment(req, 1L);
        // Either COMPLETED or FAILED (85% success rate simulation)
        assertTrue("COMPLETED".equals(result.getStatus()) || "FAILED".equals(result.getStatus()));
    }

    // ===== PAYMENT STATS =====

    @Test
    @DisplayName("Get Payment Stats - Returns Counts")
    void getPaymentStats_Success() {
        when(paymentRepository.count()).thenReturn(100L);
        when(paymentRepository.countByStatus(Payment.PaymentStatus.COMPLETED)).thenReturn(85L);
        when(paymentRepository.countByStatus(Payment.PaymentStatus.FAILED)).thenReturn(10L);
        when(paymentRepository.countByStatus(Payment.PaymentStatus.PENDING)).thenReturn(5L);
        var stats = paymentService.getPaymentStats();
        assertEquals(100L, stats.get("totalPayments"));
        assertEquals(85L, stats.get("successfulPayments"));
        assertEquals(10L, stats.get("failedPayments"));
        assertEquals(5L, stats.get("pendingPayments"));
    }

    @Test
    @DisplayName("Get Payments By Status - Filtered")
    void getPaymentsByStatus_Success() {
        Payment failed = new Payment();
        failed.setId(2L);
        failed.setStatus(Payment.PaymentStatus.FAILED);
        failed.setPaymentMethod(Payment.PaymentMethod.CARD);
        failed.setPaymentReference("PAY-FAILED1");
        Page<Payment> page = new PageImpl<>(List.of(failed));
        when(paymentRepository.findByStatus(eq(Payment.PaymentStatus.FAILED), any(Pageable.class))).thenReturn(page);
        Page<PaymentDTO> result = paymentService.getPaymentsByStatus("FAILED", 0, 10);
        assertEquals(1, result.getContent().size());
        assertEquals("FAILED", result.getContent().get(0).getStatus());
    }
}

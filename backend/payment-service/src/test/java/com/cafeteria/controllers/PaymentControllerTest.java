package com.cafeteria.controllers;

import com.cafeteria.dto.PaymentRequest;
import com.cafeteria.entities.Payment;
import com.cafeteria.repositories.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class PaymentControllerTest {

    static {
        System.setProperty("net.bytebuddy.experimental", "true");
    }

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private PaymentController paymentController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(paymentController, "orderServiceUrl", "http://localhost:8083");
    }

    @Test
    public void testProcessPayment_NewPayment_Success() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(101L);
        request.setAmount(new BigDecimal("150.00"));
        request.setPaymentMethod("UPI");

        when(paymentRepository.findByOrderId(101L)).thenReturn(new ArrayList<>());
        when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer mock-token");

        Payment savedPayment = new Payment();
        savedPayment.setPaymentId(1L);
        savedPayment.setOrderId(101L);
        savedPayment.setAmount(new BigDecimal("150.00"));
        savedPayment.setPaymentMethod("UPI");
        savedPayment.setTransactionStatus("SUCCESS");
        savedPayment.setTransactionDate(LocalDateTime.now());

        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

        ResponseEntity<Void> restResponse = new ResponseEntity<>(HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(restResponse);

        ResponseEntity<Payment> response = paymentController.processPayment(request, httpServletRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("SUCCESS", response.getBody().getTransactionStatus());
        verify(paymentRepository, times(1)).save(any(Payment.class));
        verify(restTemplate, times(1)).exchange(anyString(), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    public void testProcessPayment_DuplicatePayment_IdempotencySuccess() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(101L);
        request.setAmount(new BigDecimal("150.00"));
        request.setPaymentMethod("UPI");

        Payment existingPayment = new Payment();
        existingPayment.setPaymentId(1L);
        existingPayment.setOrderId(101L);
        existingPayment.setAmount(new BigDecimal("150.00"));
        existingPayment.setPaymentMethod("UPI");
        existingPayment.setTransactionStatus("SUCCESS");
        existingPayment.setTransactionDate(LocalDateTime.now());

        when(paymentRepository.findByOrderId(101L)).thenReturn(Collections.singletonList(existingPayment));

        ResponseEntity<Payment> response = paymentController.processPayment(request, httpServletRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("SUCCESS", response.getBody().getTransactionStatus());
        assertEquals(1L, response.getBody().getPaymentId());

        // Verify that NO new payment was saved, and NO call was made to order-service
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(restTemplate, never()).exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(Void.class));
    }
}

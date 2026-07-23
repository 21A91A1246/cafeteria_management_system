package com.cafeteria.controllers;

import com.cafeteria.dto.PaymentRequest;
import com.cafeteria.entities.Payment;
import com.cafeteria.entities.PaymentConfig;
import com.cafeteria.repositories.PaymentRepository;
import com.cafeteria.repositories.PaymentConfigRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentConfigRepository paymentConfigRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.order-service.url}")
    private String orderServiceUrl;

    @GetMapping("/config")
    public ResponseEntity<PaymentConfig> getPaymentConfig() {
        PaymentConfig config = paymentConfigRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    PaymentConfig c = new PaymentConfig();
                    c.setUpiId("canteen@upi");
                    c.setPayeeName("Office Cafeteria");
                    return c;
                });
        return ResponseEntity.ok(config);
    }

    @PostMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentConfig> savePaymentConfig(@Valid @RequestBody PaymentConfig configDetails) {
        PaymentConfig config = paymentConfigRepository.findAll().stream().findFirst()
                .orElse(new PaymentConfig());
        config.setUpiId(configDetails.getUpiId());
        config.setPayeeName(configDetails.getPayeeName());
        return ResponseEntity.ok(paymentConfigRepository.save(config));
    }

    @PostMapping
    public ResponseEntity<Payment> processPayment(
            @Valid @RequestBody PaymentRequest request,
            HttpServletRequest currentRequest
    ) {
        // Idempotency check: check if a payment for this order ID has already succeeded
        java.util.List<Payment> existingPayments = paymentRepository.findByOrderId(request.getOrderId());
        java.util.Optional<Payment> successfulPayment = existingPayments.stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getTransactionStatus()))
                .findFirst();

        if (successfulPayment.isPresent()) {
            System.out.println("Duplicate payment request detected for order ID: " + request.getOrderId() + ". Returning existing transaction receipt.");
            return ResponseEntity.ok(successfulPayment.get());
        }

        // 1. Log payment transaction details
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionStatus("SUCCESS"); // Simulated success
        payment.setTransactionDate(LocalDateTime.now());
        
        Payment savedPayment = paymentRepository.save(payment);

        // 2. Propagate token to order-service to mark order as paid
        HttpHeaders headers = new HttpHeaders();
        String authHeader = currentRequest.getHeader("Authorization");
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            String url = orderServiceUrl + "/api/orders/" + request.getOrderId() + "/pay";
            restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);
        } catch (Exception e) {
            throw new RuntimeException("Payment succeeded but failed to notify order service: " + e.getMessage(), e);
        }

        return ResponseEntity.ok(savedPayment);
    }
}

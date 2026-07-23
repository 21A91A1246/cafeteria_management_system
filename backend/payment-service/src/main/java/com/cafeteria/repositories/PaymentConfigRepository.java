package com.cafeteria.repositories;

import com.cafeteria.entities.PaymentConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentConfigRepository extends JpaRepository<PaymentConfig, Long> {
}

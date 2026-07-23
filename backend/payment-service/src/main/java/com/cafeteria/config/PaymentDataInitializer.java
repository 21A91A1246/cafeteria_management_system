package com.cafeteria.config;

import com.cafeteria.entities.PaymentConfig;
import com.cafeteria.repositories.PaymentConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PaymentDataInitializer implements CommandLineRunner {

    @Autowired
    private PaymentConfigRepository paymentConfigRepository;

    @Override
    public void run(String... args) throws Exception {
        if (paymentConfigRepository.count() == 0) {
            PaymentConfig config = new PaymentConfig();
            config.setUpiId("canteen@upi");
            config.setPayeeName("Office Cafeteria");
            paymentConfigRepository.save(config);
            System.out.println("Seeded default payment configurations successfully!");
        }
    }
}

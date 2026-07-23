package com.cafeteria.config;

import com.cafeteria.entities.Employee;
import com.cafeteria.repositories.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (employeeRepository.findByEmail("admin@cafeteria.com").isEmpty()) {
            Employee admin = new Employee();
            admin.setName("Cafeteria Admin");
            admin.setEmail("admin@cafeteria.com");
            admin.setDepartment("Administration");
            admin.setRole("ROLE_ADMIN");
            admin.setPassword(passwordEncoder.encode("admin123"));
            employeeRepository.save(admin);
            System.out.println("Seeded admin account: admin@cafeteria.com / admin123");
        }

        if (employeeRepository.findByEmail("employee@cafeteria.com").isEmpty()) {
            Employee employee = new Employee();
            employee.setName("John Doe");
            employee.setEmail("employee@cafeteria.com");
            employee.setDepartment("Engineering");
            employee.setRole("ROLE_EMPLOYEE");
            employee.setPassword(passwordEncoder.encode("employee123"));
            employeeRepository.save(employee);
            System.out.println("Seeded employee account: employee@cafeteria.com / employee123");
        }
    }
}

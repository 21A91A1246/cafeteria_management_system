package com.cafeteria.services;

import com.cafeteria.dto.AuthResponse;
import com.cafeteria.dto.LoginRequest;
import com.cafeteria.dto.RegisterRequest;
import com.cafeteria.entities.Employee;
import com.cafeteria.repositories.EmployeeRepository;
import com.cafeteria.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (employeeRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Employee employee = new Employee();
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setDepartment(request.getDepartment());
        // Default role is ROLE_EMPLOYEE unless specified as ROLE_ADMIN
        String role = request.getRole();
        if (role == null || role.trim().isEmpty()) {
            role = "ROLE_EMPLOYEE";
        } else if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase();
        }
        employee.setRole(role);
        employee.setPassword(passwordEncoder.encode(request.getPassword()));

        Employee saved = employeeRepository.save(employee);
        String token = jwtService.generateToken(saved.getEmail(), saved.getEmployeeId(), saved.getRole());

        return new AuthResponse(
                token,
                saved.getEmployeeId(),
                saved.getName(),
                saved.getEmail(),
                saved.getDepartment(),
                saved.getRole()
        );
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        Employee employee = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        String token = jwtService.generateToken(employee.getEmail(), employee.getEmployeeId(), employee.getRole());

        return new AuthResponse(
                token,
                employee.getEmployeeId(),
                employee.getName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getRole()
        );
    }
}

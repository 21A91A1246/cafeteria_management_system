package com.cafeteria.security;

import java.security.Principal;

public class UserPrincipal implements Principal {
    private final String email;
    private final Long employeeId;

    public UserPrincipal(String email, Long employeeId) {
        this.email = email;
        this.employeeId = employeeId;
    }

    public String getEmail() {
        return email;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    @Override
    public String getName() {
        return email;
    }
}

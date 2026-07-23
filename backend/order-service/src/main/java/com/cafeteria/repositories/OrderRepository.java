package com.cafeteria.repositories;

import com.cafeteria.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByEmployeeIdOrderByOrderDateDesc(Long employeeId);
    
    List<Order> findByEmployeeIdAndOrderDateBetweenOrderByOrderDateDesc(
            Long employeeId, LocalDateTime start, LocalDateTime end);
            
    List<Order> findAllByOrderByOrderDateDesc();
    
    List<Order> findByOrderDateBetweenOrderByOrderDateDesc(
            LocalDateTime start, LocalDateTime end);
}

package com.cafeteria.services;

import com.cafeteria.dto.MenuItemDto;
import com.cafeteria.dto.OrderItemRequest;
import com.cafeteria.dto.OrderRequest;
import com.cafeteria.entities.Order;
import com.cafeteria.entities.OrderItem;
import com.cafeteria.repositories.OrderRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MenuServiceClient menuServiceClient;

    public Order placeOrder(Long employeeId, OrderRequest request) {
        Order order = new Order();
        order.setEmployeeId(employeeId);
        order.setEmployeeName(request.getEmployeeName());
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus("Pending Payment");
        order.setPaymentStatus("Pending"); // default

        BigDecimal total = BigDecimal.ZERO;

        // Propagate JWT token to menu-service
        HttpHeaders headers = new HttpHeaders();
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest currentRequest = attributes.getRequest();
            String authHeader = currentRequest.getHeader("Authorization");
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
        }
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        for (OrderItemRequest itemReq : request.getItems()) {
            try {
                // Call menu-service wrapped in Circuit Breaker and Retry
                MenuItemDto itemDto = menuServiceClient.fetchMenuItem(itemReq.getMenuItemId(), entity);
                
                if (!itemDto.isAvailability()) {
                    throw new RuntimeException("Item '" + itemDto.getItemName() + "' is currently unavailable.");
                }

                OrderItem orderItem = new OrderItem();
                orderItem.setMenuItemId(itemDto.getItemId());
                orderItem.setItemName(itemDto.getItemName());
                orderItem.setPrice(itemDto.getPrice());
                orderItem.setQuantity(itemReq.getQuantity());
                
                order.addOrderItem(orderItem);

                BigDecimal itemTotal = itemDto.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
                total = total.add(itemTotal);
            } catch (Exception e) {
                throw new RuntimeException("Failed to validate menu item: " + e.getMessage(), e);
            }
        }

        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    public List<Order> getEmployeeOrderHistory(Long employeeId) {
        return orderRepository.findByEmployeeIdOrderByOrderDateDesc(employeeId);
    }

    public List<Order> getEmployeeOrderHistoryFiltered(Long employeeId, LocalDateTime start, LocalDateTime end) {
        return orderRepository.findByEmployeeIdAndOrderDateBetweenOrderByOrderDateDesc(employeeId, start, end);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    public List<Order> getAllOrdersFiltered(LocalDateTime start, LocalDateTime end) {
        return orderRepository.findByOrderDateBetweenOrderByOrderDateDesc(start, end);
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Order order = getOrderById(orderId);
        order.setOrderStatus(status);
        if ("Completed".equalsIgnoreCase(status)) {
            order.setPaymentStatus("Paid"); // assume paid once completed
        }
        return orderRepository.save(order);
    }

    public Order markOrderAsPaid(Long orderId) {
        Order order = getOrderById(orderId);
        order.setPaymentStatus("Paid");
        order.setOrderStatus("Placed");
        return orderRepository.save(order);
    }
}

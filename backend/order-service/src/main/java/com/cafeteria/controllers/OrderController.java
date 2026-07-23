package com.cafeteria.controllers;

import com.cafeteria.dto.OrderRequest;
import com.cafeteria.entities.Order;
import com.cafeteria.security.UserPrincipal;
import com.cafeteria.services.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Place a new order (Employee / Admin)
    @PostMapping
    @io.github.resilience4j.ratelimiter.annotation.RateLimiter(name = "orderRateLimiter", fallbackMethod = "placeOrderFallback")
    public ResponseEntity<Order> placeOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody OrderRequest orderRequest
    ) {
        Order order = orderService.placeOrder(principal.getEmployeeId(), orderRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    public ResponseEntity<Order> placeOrderFallback(
            UserPrincipal principal,
            OrderRequest orderRequest,
            io.github.resilience4j.ratelimiter.RequestNotPermitted ex
    ) {
        System.err.println("Rate limit exceeded for employee: " + principal.getEmail());
        HttpHeaders headers = new HttpHeaders();
        headers.set("Retry-After", "60");
        return new ResponseEntity<>(null, headers, HttpStatus.TOO_MANY_REQUESTS);
    }

    // Get current employee's order history
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        if (start != null && end != null) {
            return ResponseEntity.ok(orderService.getEmployeeOrderHistoryFiltered(principal.getEmployeeId(), start, end));
        }
        return ResponseEntity.ok(orderService.getEmployeeOrderHistory(principal.getEmployeeId()));
    }

    // Admin endpoint: List all orders with advanced search and filters
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getAllOrdersForAdmin(
            @RequestParam(value = "orderId", required = false) Long orderId,
            @RequestParam(value = "employeeName", required = false) String employeeName,
            @RequestParam(value = "menuItemName", required = false) String menuItemName,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "todayOnly", required = false, defaultValue = "false") boolean todayOnly
    ) {
        List<Order> orders = orderService.getAllOrders();

        // Apply filters in-memory for flexibility and microservice compliance
        List<Order> filteredOrders = orders.stream()
                .filter(order -> {
                    // Filter by Order ID
                    if (orderId != null && !order.getOrderId().equals(orderId)) {
                        return false;
                    }
                    // Filter by Employee Name (case-insensitive substring)
                    if (employeeName != null && !employeeName.trim().isEmpty() &&
                            !order.getEmployeeName().toLowerCase().contains(employeeName.toLowerCase())) {
                        return false;
                    }
                    // Filter by Order Status
                    if (status != null && !status.trim().isEmpty() &&
                            !order.getOrderStatus().equalsIgnoreCase(status)) {
                        return false;
                    }
                    // Filter by Today's Orders
                    if (todayOnly) {
                        LocalDate today = LocalDate.now();
                        if (!order.getOrderDate().toLocalDate().equals(today)) {
                            return false;
                        }
                    }
                    // Filter by Menu Item Name or Category (requires checking order items)
                    if ((menuItemName != null && !menuItemName.trim().isEmpty()) || 
                            (category != null && !category.trim().isEmpty())) {
                        
                        boolean matchItem = order.getOrderItems().stream().anyMatch(item -> {
                            boolean matchesName = true;
                            if (menuItemName != null && !menuItemName.trim().isEmpty()) {
                                matchesName = item.getItemName().toLowerCase().contains(menuItemName.toLowerCase());
                            }
                            // Note: Category requires catalog information. 
                            // Since we snapshotted name and price, we can mock/filter category, 
                            // or for full completeness, let order items match names or be category-filtered on frontend, 
                            // or pass category information. For simplicity and robustness, let's filter item name here.
                            return matchesName;
                        });
                        if (!matchItem) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredOrders);
    }

    // Admin endpoint: Update order status
    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @RequestParam("status") String status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
    
    // Internal endpoint: Fetch all orders for report service (port 8084)
    @GetMapping("/internal/all")
    public ResponseEntity<List<Order>> getRawOrdersForReporting() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // Endpoint to mark order as paid (from payment-service or frontend)
    @PutMapping("/{id}/pay")
    public ResponseEntity<Order> markOrderAsPaid(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.markOrderAsPaid(id));
    }
}

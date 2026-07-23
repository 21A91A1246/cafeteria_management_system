package com.cafeteria.services;

import com.cafeteria.dto.MenuItemDto;
import com.cafeteria.dto.OrderDto;
import com.cafeteria.dto.OrderItemDto;
import com.cafeteria.dto.SalesReportDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.order-service.url}")
    private String orderServiceUrl;

    @Value("${services.menu-service.url:http://localhost:8082}")
    private String menuServiceUrl;

    public SalesReportDto generateDailySalesReport() {
        SalesReportDto report = new SalesReportDto();

        // 1. Fetch token and setup headers
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

        // 2. Fetch all orders from order-service
        List<OrderDto> orders = new ArrayList<>();
        try {
            ResponseEntity<List<OrderDto>> orderResponse = restTemplate.exchange(
                    orderServiceUrl + "/api/orders/internal/all",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<OrderDto>>() {}
            );
            if (orderResponse.getBody() != null) {
                orders = orderResponse.getBody();
            }
        } catch (Exception e) {
            System.err.println("Error fetching orders: " + e.getMessage());
        }

        // 3. Fetch all menu items from menu-service to map itemId to Category
        Map<Long, String> itemToCategoryMap = new HashMap<>();
        try {
            ResponseEntity<List<MenuItemDto>> menuResponse = restTemplate.exchange(
                    menuServiceUrl + "/api/menu/admin",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<MenuItemDto>>() {}
            );
            if (menuResponse.getBody() != null) {
                for (MenuItemDto item : menuResponse.getBody()) {
                    itemToCategoryMap.put(item.getItemId(), item.getCategory());
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching menu catalog: " + e.getMessage());
        }

        // 4. Compute Metrics
        long totalOrders = orders.size();
        long cancelledCount = orders.stream()
                .filter(o -> "Cancelled".equalsIgnoreCase(o.getOrderStatus()))
                .count();

        List<OrderDto> activeOrders = orders.stream()
                .filter(o -> !"Cancelled".equalsIgnoreCase(o.getOrderStatus()))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = activeOrders.stream()
                .map(OrderDto::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageOrderValue = BigDecimal.ZERO;
        if (!activeOrders.isEmpty()) {
            averageOrderValue = totalRevenue.divide(BigDecimal.valueOf(activeOrders.size()), 2, RoundingMode.HALF_UP);
        }

        // Most Ordered Items
        Map<String, Long> itemCounts = activeOrders.stream()
                .flatMap(o -> o.getOrderItems().stream())
                .collect(Collectors.groupingBy(OrderItemDto::getItemName, Collectors.summingLong(OrderItemDto::getQuantity)));

        List<String> mostOrderedItems = itemCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Orders by Category
        Map<String, Long> ordersByCategory = new HashMap<>();
        // Default categories initialized to 0
        ordersByCategory.put("Breakfast", 0L);
        ordersByCategory.put("Lunch", 0L);
        ordersByCategory.put("Snacks", 0L);
        ordersByCategory.put("Beverages", 0L);

        for (OrderDto o : activeOrders) {
            for (OrderItemDto item : o.getOrderItems()) {
                String category = itemToCategoryMap.get(item.getMenuItemId());
                if (category == null) {
                    category = "Snacks"; // Default fallback
                }
                ordersByCategory.put(category, ordersByCategory.getOrDefault(category, 0L) + item.getQuantity());
            }
        }

        // Peak Ordering Hours (Hour -> Count)
        Map<Integer, Long> peakOrderingHours = new TreeMap<>();
        for (int i = 8; i <= 20; i++) {
            peakOrderingHours.put(i, 0L); // Prepopulate typical business hours
        }
        for (OrderDto o : activeOrders) {
            int hour = o.getOrderDate().getHour();
            peakOrderingHours.put(hour, peakOrderingHours.getOrDefault(hour, 0L) + 1);
        }

        // Set values in report DTO
        report.setTotalOrders(totalOrders);
        report.setTotalRevenue(totalRevenue);
        report.setAverageOrderValue(averageOrderValue);
        report.setCancelledOrders(cancelledCount);
        report.setMostOrderedItems(mostOrderedItems);
        report.setOrdersByCategory(ordersByCategory);
        report.setPeakOrderingHours(peakOrderingHours);

        return report;
    }
}

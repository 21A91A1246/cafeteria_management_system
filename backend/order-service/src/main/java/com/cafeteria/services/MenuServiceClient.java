package com.cafeteria.services;

import com.cafeteria.dto.MenuItemDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MenuServiceClient {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.menu-service.url}")
    private String menuServiceUrl;

    @CircuitBreaker(name = "menuServiceCB", fallbackMethod = "fetchMenuItemFallback")
    @Retry(name = "menuServiceRetry")
    public MenuItemDto fetchMenuItem(Long menuItemId, HttpEntity<Void> entity) {
        String url = menuServiceUrl + "/api/menu/" + menuItemId;
        ResponseEntity<MenuItemDto> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, MenuItemDto.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return response.getBody();
        }
        throw new RuntimeException("Menu item with ID " + menuItemId + " not found.");
    }

    public MenuItemDto fetchMenuItemFallback(Long menuItemId, HttpEntity<Void> entity, Throwable throwable) {
        System.err.println("Circuit Breaker triggered fallback for menu-service. Reason: " + throwable.getMessage());
        MenuItemDto fallbackItem = new MenuItemDto();
        fallbackItem.setItemId(menuItemId);
        fallbackItem.setItemName("Service Temp Unavailable (Fallback)");
        fallbackItem.setPrice(java.math.BigDecimal.ZERO);
        fallbackItem.setAvailability(false);
        return fallbackItem;
    }
}

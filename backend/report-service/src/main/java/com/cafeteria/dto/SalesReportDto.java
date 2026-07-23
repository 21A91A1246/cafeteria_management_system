package com.cafeteria.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class SalesReportDto {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal averageOrderValue;
    private long cancelledOrders;
    private List<String> mostOrderedItems;
    private Map<String, Long> ordersByCategory;
    private Map<Integer, Long> peakOrderingHours; // Hour (0-23) -> Order count

    // Getters and Setters
    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public List<String> getMostOrderedItems() {
        return mostOrderedItems;
    }

    public void setMostOrderedItems(List<String> mostOrderedItems) {
        this.mostOrderedItems = mostOrderedItems;
    }

    public Map<String, Long> getOrdersByCategory() {
        return ordersByCategory;
    }

    public void setOrdersByCategory(Map<String, Long> ordersByCategory) {
        this.ordersByCategory = ordersByCategory;
    }

    public Map<Integer, Long> getPeakOrderingHours() {
        return peakOrderingHours;
    }

    public void setPeakOrderingHours(Map<Integer, Long> peakOrderingHours) {
        this.peakOrderingHours = peakOrderingHours;
    }
}

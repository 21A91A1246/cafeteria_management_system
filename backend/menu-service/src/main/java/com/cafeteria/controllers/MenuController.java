package com.cafeteria.controllers;

import com.cafeteria.entities.MenuItem;
import com.cafeteria.repositories.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    // View available menu items (for Employees)
    @GetMapping
    @Cacheable(value = "menuItems", key = "'available'")
    public ResponseEntity<List<MenuItem>> getAvailableMenu() {
        return ResponseEntity.ok(menuItemRepository.findByAvailability(true));
    }

    // View all menu items (for Admin dashboard)
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MenuItem>> getAllMenuForAdmin() {
        return ResponseEntity.ok(menuItemRepository.findAll());
    }

    // Get specific item detail
    @GetMapping("/{id}")
    @Cacheable(value = "menuItems", key = "#id")
    public ResponseEntity<MenuItem> getMenuItemById(@PathVariable Long id) {
        return menuItemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Add new menu item (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @CacheEvict(value = "menuItems", allEntries = true)
    public ResponseEntity<MenuItem> createMenuItem(@RequestBody MenuItem menuItem) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemRepository.save(menuItem));
    }

    // Update existing menu item (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @CacheEvict(value = "menuItems", allEntries = true)
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem menuItemDetails) {
        return menuItemRepository.findById(id)
                .map(item -> {
                    item.setItemName(menuItemDetails.getItemName());
                    item.setCategory(menuItemDetails.getCategory());
                    item.setDescription(menuItemDetails.getDescription());
                    item.setPrice(menuItemDetails.getPrice());
                    item.setAvailability(menuItemDetails.isAvailability());
                    item.setImageUrl(menuItemDetails.getImageUrl());
                    item.setVeg(menuItemDetails.isVeg());
                    return ResponseEntity.ok(menuItemRepository.save(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete menu item (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @CacheEvict(value = "menuItems", allEntries = true)
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        return menuItemRepository.findById(id)
                .map(item -> {
                    menuItemRepository.delete(item);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

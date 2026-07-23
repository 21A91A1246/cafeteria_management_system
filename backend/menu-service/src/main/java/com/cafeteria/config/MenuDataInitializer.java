package com.cafeteria.config;

import com.cafeteria.entities.MenuItem;
import com.cafeteria.repositories.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class MenuDataInitializer implements CommandLineRunner {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Override
    public void run(String... args) throws Exception {
        if (menuItemRepository.count() == 0) {
            createItem("Classic Pancakes", "Breakfast", "Fluffy pancakes served with warm maple syrup and butter.", new BigDecimal("5.99"), true, "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500", true);
            createItem("Egg Benedict", "Breakfast", "Poached eggs and Canadian bacon on English muffins with hollandaise sauce.", new BigDecimal("8.49"), true, "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500", false);
            
            createItem("Grilled Chicken Caesar Salad", "Lunch", "Crisp romaine, grilled chicken breast, croutons, and Parmesan tossed in Caesar dressing.", new BigDecimal("9.99"), true, "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500", false);
            createItem("Bacon Cheeseburger", "Lunch", "Juicy beef patty with smoked bacon, cheddar cheese, lettuce, tomato, and house sauce.", new BigDecimal("10.99"), true, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500", false);
            
            createItem("Mozzarella Sticks", "Snacks", "Golden-fried mozzarella cheese sticks served with marinara sauce.", new BigDecimal("4.99"), true, "https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?w=500", true);
            createItem("Nachos Supreme", "Snacks", "Tortilla chips loaded with melted cheese, jalapenos, sour cream, and salsa.", new BigDecimal("6.99"), true, "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500", true);
            
            createItem("Cappuccino", "Beverages", "Espresso with steamed milk and a thick layer of foam.", new BigDecimal("3.49"), true, "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500", true);
            createItem("Iced Peach Tea", "Beverages", "Refreshing brewed black tea infused with sweet peach syrup.", new BigDecimal("2.99"), true, "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500", true);
            
            System.out.println("Seeded menu items successfully!");
        }
    }

    private void createItem(String name, String category, String description, BigDecimal price, boolean availability, String imageUrl, boolean veg) {
        MenuItem item = new MenuItem();
        item.setItemName(name);
        item.setCategory(category);
        item.setDescription(description);
        item.setPrice(price);
        item.setAvailability(availability);
        item.setImageUrl(imageUrl);
        item.setVeg(veg);
        menuItemRepository.save(item);
    }
}

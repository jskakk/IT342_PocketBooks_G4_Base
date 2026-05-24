package com.pocketbooks.backend.category.application;

import com.pocketbooks.backend.category.domain.Category;
import com.pocketbooks.backend.category.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
    }

    public Category createCategory(String name, String icon) {
        if (categoryRepository.existsByName(name)) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }
        Category category = new Category(name, icon);
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, String name, String icon) {
        Category category = getCategoryById(id);

        if (!category.getName().equals(name) && categoryRepository.existsByName(name)) {
            throw new RuntimeException("Category with name '" + name + "' already exists");
        }

        category.setName(name);
        category.setIcon(icon);
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with ID: " + id);
        }
        categoryRepository.deleteById(id);
    }

    public boolean categoryExists(String name) {
        return categoryRepository.existsByName(name);
    }
}

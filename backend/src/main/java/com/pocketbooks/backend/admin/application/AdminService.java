package com.pocketbooks.backend.admin.application;

import com.pocketbooks.backend.admin.dto.AdminStatsDTO;
import com.pocketbooks.backend.admin.dto.TopSpenderDTO;
import com.pocketbooks.backend.admin.dto.RecentSignupDTO;
import com.pocketbooks.backend.admin.dto.UserDTO;
import com.pocketbooks.backend.auth.domain.User;
import com.pocketbooks.backend.auth.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;

    @Autowired
    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AdminStatsDTO getSystemStats() {
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();

        long totalExpenses = 0;
        double totalFunded = allUsers.stream().mapToDouble(User::getBalance).sum();

        List<TopSpenderDTO> topSpenders = allUsers.stream()
                .filter(u -> u.getBalance() > 0)
                .sorted((a, b) -> Double.compare(b.getBalance(), a.getBalance()))
                .limit(5)
                .map(u -> new TopSpenderDTO(u.getFullName(), u.getEmail(), u.getBalance()))
                .collect(Collectors.toList());

        List<RecentSignupDTO> recentSignups = allUsers.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .map(u -> new RecentSignupDTO(u.getFullName(), u.getEmail(), u.getCreatedAt().toString()))
                .collect(Collectors.toList());

        return new AdminStatsDTO(totalUsers, totalExpenses, totalFunded, 0, topSpenders, recentSignups);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserDTO(u.getId(), u.getFullName(), u.getEmail(),
                        u.getRole().name(), u.getBalance(), u.getCreatedAt().toString()))
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        return new UserDTO(user.getId(), user.getFullName(), user.getEmail(),
                user.getRole().name(), user.getBalance(), user.getCreatedAt().toString());
    }

    public void updateUserRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        try {
            User.Role role = User.Role.valueOf(newRole);
            user.setRole(role);
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + newRole);
        }
    }
}

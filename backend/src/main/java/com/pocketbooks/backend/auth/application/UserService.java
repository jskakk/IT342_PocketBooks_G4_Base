package com.pocketbooks.backend.auth.application;

import com.pocketbooks.backend.auth.application.dto.*;
import com.pocketbooks.backend.auth.domain.User;
import com.pocketbooks.backend.auth.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMonthlyBudget(),
                user.getInstitution(),
                user.getDisplayCurrency(),
                user.getBalance()
        );
    }

    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getMonthlyBudget() != null) {
            user.setMonthlyBudget(request.getMonthlyBudget());
        }
        if (request.getInstitution() != null) {
            user.setInstitution(request.getInstitution());
        }

        userRepository.save(user);

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMonthlyBudget(),
                user.getInstitution(),
                user.getDisplayCurrency(),
                user.getBalance()
        );
    }

    public NotificationPreferencesResponse getNotificationPreferences(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new NotificationPreferencesResponse(
                user.getEmailReceipts(),
                user.getExpenseAlerts(),
                user.getWeeklySummary(),
                user.getLoginAlerts()
        );
    }

    public NotificationPreferencesResponse updateNotificationPreferences(String email, UpdateNotificationsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmailReceipts() != null) {
            user.setEmailReceipts(request.getEmailReceipts());
        }
        if (request.getExpenseAlerts() != null) {
            user.setExpenseAlerts(request.getExpenseAlerts());
        }
        if (request.getWeeklySummary() != null) {
            user.setWeeklySummary(request.getWeeklySummary());
        }
        if (request.getLoginAlerts() != null) {
            user.setLoginAlerts(request.getLoginAlerts());
        }

        userRepository.save(user);

        return new NotificationPreferencesResponse(
                user.getEmailReceipts(),
                user.getExpenseAlerts(),
                user.getWeeklySummary(),
                user.getLoginAlerts()
        );
    }

    public void updateDisplayCurrency(String email, String currency) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDisplayCurrency(currency);
        userRepository.save(user);
    }

    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
    }
}

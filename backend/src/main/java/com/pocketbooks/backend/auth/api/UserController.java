package com.pocketbooks.backend.auth.api;

import com.pocketbooks.backend.auth.application.UserService;
import com.pocketbooks.backend.auth.application.dto.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Not authenticated\"}");
        }
        try {
            UserProfileResponse profile = userService.getUserProfile(authentication.getName());
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Not authenticated\"}");
        }
        try {
            UserProfileResponse profile = userService.updateProfile(authentication.getName(), request);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Not authenticated\"}");
        }
        try {
            NotificationPreferencesResponse prefs = userService.getNotificationPreferences(authentication.getName());
            return ResponseEntity.ok(prefs);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/notifications")
    public ResponseEntity<?> updateNotifications(
            @Valid @RequestBody UpdateNotificationsRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Not authenticated\"}");
        }
        try {
            NotificationPreferencesResponse prefs = userService.updateNotificationPreferences(authentication.getName(), request);
            return ResponseEntity.ok(prefs);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/currency/{currency}")
    public ResponseEntity<?> updateCurrency(
            @PathVariable String currency,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Not authenticated\"}");
        }
        try {
            userService.updateDisplayCurrency(authentication.getName(), currency);
            return ResponseEntity.ok("{\"message\": \"Currency updated successfully\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Not authenticated\"}");
        }
        try {
            userService.deleteAccount(authentication.getName());
            return ResponseEntity.ok("{\"message\": \"Account deleted successfully\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}

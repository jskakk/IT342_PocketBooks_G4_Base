package com.pocketbooks.backend.auth.application;

import com.pocketbooks.backend.auth.application.dto.LoginRequest;
import com.pocketbooks.backend.auth.application.dto.RegisterRequest;
import com.pocketbooks.backend.auth.domain.User;
import com.pocketbooks.backend.auth.domain.UserRepository;
import com.pocketbooks.backend.auth.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerCreatesStudentAccountAndToken() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test Student");
        request.setEmail("student@example.com");
        request.setPassword("secret123");

        when(userRepository.existsByEmail("student@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed-secret");
        when(jwtUtil.generateToken("student@example.com")).thenReturn("token-123");

        var response = authService.register(request);

        assertEquals("student@example.com", response.getEmail());
        assertEquals("Test Student", response.getFullName());
        assertEquals("ROLE_STUDENT", response.getRole());
        assertEquals("token-123", response.getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test Student");
        request.setEmail("student@example.com");
        request.setPassword("secret123");

        when(userRepository.existsByEmail("student@example.com")).thenReturn(true);

        RuntimeException error = assertThrows(RuntimeException.class, () -> authService.register(request));

        assertTrue(error.getMessage().contains("already registered"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginReturnsTokenForValidPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@example.com");
        request.setPassword("secret123");

        User user = new User("Test Student", "student@example.com", "hashed-secret", User.Role.ROLE_STUDENT);
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed-secret")).thenReturn(true);
        when(jwtUtil.generateToken("student@example.com")).thenReturn("token-123");

        var response = authService.login(request);

        assertEquals("student@example.com", response.getEmail());
        assertEquals("token-123", response.getToken());
        assertEquals("ROLE_STUDENT", response.getRole());
    }
}
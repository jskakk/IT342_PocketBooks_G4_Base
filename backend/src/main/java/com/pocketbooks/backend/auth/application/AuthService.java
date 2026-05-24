package com.pocketbooks.backend.auth.application;

import com.pocketbooks.backend.auth.application.dto.*;
import com.pocketbooks.backend.auth.domain.User;
import com.pocketbooks.backend.auth.domain.UserRepository;
import com.pocketbooks.backend.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Autowired
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered. Please use a different email.");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getFullName(),
                request.getEmail(),
                hashedPassword,
                User.Role.ROLE_STUDENT
        );

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getFullName(),
                user.getRole().name(), "Registration successful! Welcome to PocketBooks.");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!passwordMatches) {
            throw new RuntimeException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getFullName(),
                user.getRole().name(), "Login successful!");
    }

    public AuthResponse googleLogin(String googleToken) {
        Map<String, Object> googleUser = verifyGoogleToken(googleToken);

        String email = (String) googleUser.get("email");
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Invalid Google token.");
        }

        String fullName = (String) googleUser.getOrDefault("name", email.split("@")[0]);
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User(
                            fullName,
                            email,
                            passwordEncoder.encode(UUID.randomUUID().toString()),
                            User.Role.ROLE_STUDENT
                    );
                    return userRepository.save(newUser);
                });

        String token = jwtUtil.generateToken(user.getEmail());

        Map<String, Object> userPayload = Map.of(
                "id", user.getEmail(),
                "name", user.getFullName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        );

        return new AuthResponse(token, userPayload, "Google login successful!");
    }

    private Map<String, Object> verifyGoogleToken(String googleToken) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleToken;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            String body = response.body();
            if (response.statusCode() != 200) {
                throw new RuntimeException("Invalid Google token. tokeninfo response: " + response.statusCode() + " - " + body);
            }

            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = mapper.readValue(body, Map.class);

            if (googleClientId != null && !googleClientId.isBlank()) {
                Object audience = payload.get("aud");
                if (audience == null || !googleClientId.equals(audience.toString())) {
                    throw new RuntimeException("Google token audience mismatch. expected=" + googleClientId + " got=" + audience);
                }
            }

            return payload;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Google login: " + e.getMessage());
        }
    }
}
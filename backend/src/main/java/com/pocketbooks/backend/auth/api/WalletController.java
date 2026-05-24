package com.pocketbooks.backend.auth.api;

import com.pocketbooks.backend.auth.domain.User;
import com.pocketbooks.backend.auth.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final UserRepository userRepository;

    @Autowired
    public WalletController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getWallet(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized request."));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }

        double balance = user.getBalance() == null ? 0.0 : user.getBalance();
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @PostMapping("/topup")
    public ResponseEntity<?> topUp(@RequestBody Map<String, Object> body, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized request."));
        }

        double amount = 0.0;
        Object amountValue = body.get("amount");
        if (amountValue instanceof Number number) {
            amount = number.doubleValue();
        } else if (amountValue != null) {
            try {
                amount = Double.parseDouble(amountValue.toString());
            } catch (NumberFormatException ignored) {
                amount = 0.0;
            }
        }

        if (amount <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Top-up amount must be greater than zero."));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }

        double balance = user.getBalance() == null ? 0.0 : user.getBalance();
        user.setBalance(balance + amount);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("balance", user.getBalance()));
    }
}

package com.pocketbooks.backend.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by email (used for login and duplicate check)
    Optional<User> findByEmail(String email);

    // Check if email already exists (used to prevent duplicate registration)
    boolean existsByEmail(String email);
}
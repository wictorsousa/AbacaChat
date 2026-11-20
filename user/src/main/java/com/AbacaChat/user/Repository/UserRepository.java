package com.AbacaChat.user.Repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.AbacaChat.user.Domain.Entity.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByHandle(String handle);

    Optional<User> findBySlug(String slug);

    boolean existsByEmailOrHandle(String email, String handle);
}
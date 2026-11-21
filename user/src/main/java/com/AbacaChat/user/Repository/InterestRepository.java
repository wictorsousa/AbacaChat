package com.AbacaChat.user.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.AbacaChat.user.Domain.Entity.Interest;

public interface InterestRepository extends JpaRepository<Interest, UUID> {
    List<Interest> findAllByUserId(UUID userId);

    Optional<Interest> findByUserIdAndTopicId(UUID userId, UUID topicId);

    boolean existsByUserIdAndTopicId(UUID userId, UUID topicId);
}
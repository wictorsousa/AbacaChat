package com.AbacaChat.user.DTO;

import java.time.LocalDateTime;
import java.util.UUID;

import com.AbacaChat.user.Domain.Entity.Interest;

public record InterestResponse(
        UUID id,
        UUID userId,
        UUID topicId,
        LocalDateTime createdAt) {
    public static InterestResponse fromEntity(Interest interest) {
        return new InterestResponse(
                interest.getId(),
                interest.getUser().getId(),
                interest.getTopicId(),
                interest.getCreatedAt());
    }
}
package com.AbacaChat.user.DTO;


import java.time.LocalDateTime;
import java.util.UUID;

import com.AbacaChat.user.Domain.Entity.User;
import com.AbacaChat.user.Domain.Enums.Gender;
import com.AbacaChat.user.Domain.Enums.Pronoun;

public record UserResponse(
        UUID id,
        String nickname,
        String handle,
        String email,
        String description,
        Gender gender,
        Pronoun pronouns,
        String slug,
        String profileUrl,
        String bannerUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getNickname(),
                user.getHandle(),
                user.getEmail(),
                user.getDescription(),
                user.getGender(),
                user.getPronouns(),
                user.getSlug(),
                "/api/users/" + user.getId() + "/profile",
                "/api/users/" + user.getId() + "/banner",
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
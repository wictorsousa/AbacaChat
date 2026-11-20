package com.AbacaChat.user.DTO;

import com.AbacaChat.user.Domain.Enums.Gender;
import com.AbacaChat.user.Domain.Enums.Pronoun;

public record UserUpdateRequest(
        String nickname,
        String description,
        Gender gender,
        Pronoun pronouns) {
}
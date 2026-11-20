package com.AbacaChat.user.DTO;

import com.AbacaChat.user.Domain.Enums.Gender;
import com.AbacaChat.user.Domain.Enums.Pronoun;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank String nickname,
        @NotBlank @Size(min = 3, max = 30) String handle,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        String description,
        Gender gender,
        Pronoun pronouns) {
}
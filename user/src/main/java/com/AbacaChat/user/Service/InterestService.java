package com.AbacaChat.user.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.AbacaChat.user.DTO.InterestResponse;
import com.AbacaChat.user.Domain.Entity.Interest;
import com.AbacaChat.user.Domain.Entity.User;
import com.AbacaChat.user.Messaging.AuditEventPublisher;
import com.AbacaChat.user.Repository.InterestRepository;
import com.AbacaChat.user.Repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterestService {

    private final InterestRepository interestRepository;
    private final UserRepository userRepository;
    private final AuditEventPublisher auditPublisher;

    @Transactional
    public InterestResponse addInterest(UUID userId, UUID topicId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + userId));

        if (interestRepository.existsByUserIdAndTopicId(userId, topicId)) {
            throw new IllegalArgumentException("Usuário já possui interesse neste tópico.");
        }

        Interest interest = Interest.builder()
                .user(user)
                .topicId(topicId)
                .build();

        Interest saved = interestRepository.save(interest);

        auditPublisher.publish("INTEREST_ADDED", saved.getId(), userId, Map.of(
                "userId", userId.toString(),
                "topicId", topicId.toString()));

        return InterestResponse.fromEntity(saved);
    }

    @Transactional
    public void removeInterest(UUID userId, UUID topicId) {
        Interest interest = interestRepository.findByUserIdAndTopicId(userId, topicId)
                .orElseThrow(() -> new EntityNotFoundException("Interesse não encontrado para este usuário e tópico."));

        interestRepository.delete(interest); // Dispara @SQLDelete (Soft Delete)

        auditPublisher.publish("INTEREST_REMOVED", interest.getId(), userId, Map.of(
                "userId", userId.toString(),
                "topicId", topicId.toString()));
    }

    @Transactional(readOnly = true)
    public List<InterestResponse> listByUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("Usuário não encontrado: " + userId);
        }

        return interestRepository.findAllByUserId(userId).stream()
                .map(InterestResponse::fromEntity)
                .toList();
    }
}
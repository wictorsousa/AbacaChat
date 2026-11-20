package com.AbacaChat.user.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.AbacaChat.user.DTO.UserCreateRequest;
import com.AbacaChat.user.DTO.UserResponse;
import com.AbacaChat.user.DTO.UserUpdateRequest;
import com.AbacaChat.user.Domain.Entity.Following;
import com.AbacaChat.user.Domain.Entity.User;
import com.AbacaChat.user.Messaging.AuditEventPublisher;
import com.AbacaChat.user.Repository.FollowingRepository;
import com.AbacaChat.user.Repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowingRepository followingRepository;
    private final AuditEventPublisher auditPublisher;

    @Transactional
    public UserResponse create(UserCreateRequest req) {
        if (userRepository.existsByEmailOrHandle(req.email(), req.handle())) {
            throw new IllegalArgumentException("Email ou handle já em uso.");
        }

        String slug = req.handle().toLowerCase().replaceAll("[^a-z0-9]", "-");

        User user = User.builder()
                .nickname(req.nickname())
                .handle(req.handle())
                .email(req.email())
                .password(req.password()) // Em produção, aplicar hash (BCrypt)
                .description(req.description())
                .gender(req.gender())
                .pronouns(req.pronouns())
                .slug(slug)
                .build();

        User saved = userRepository.save(user);

        auditPublisher.publish("USER_CREATED", saved.getId(), saved.getId(), Map.of(
                "handle", saved.getHandle(),
                "email", saved.getEmail()));

        return UserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest req) {
        User user = getEntity(id);

        if (req.nickname() != null)
            user.setNickname(req.nickname());
        if (req.description() != null)
            user.setDescription(req.description());
        if (req.gender() != null)
            user.setGender(req.gender());
        if (req.pronouns() != null)
            user.setPronouns(req.pronouns());

        User updated = userRepository.save(user);

        auditPublisher.publish("USER_UPDATED", updated.getId(), updated.getId(), Map.of(
                "nickname", updated.getNickname()));

        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public void delete(UUID id) {
        User user = getEntity(id);
        userRepository.delete(user); // Dispara o @SQLDelete (Soft Delete)

        auditPublisher.publish("USER_DELETED", id, id, Map.of(
                "handle", user.getHandle()));
    }

    // --- Upload & Download de Imagens (Blob) ---

    @Transactional
    public void updateMedia(UUID id, MultipartFile file, boolean isBanner) throws IOException {
        User user = getEntity(id);
        byte[] bytes = file.getBytes();

        if (isBanner) {
            user.setBanner(bytes);
        } else {
            user.setProfile(bytes);
        }
        userRepository.save(user);

        auditPublisher.publish(isBanner ? "USER_BANNER_UPDATED" : "USER_PROFILE_UPDATED", id, id, Map.of(
                "sizeBytes", bytes.length,
                "contentType", String.valueOf(file.getContentType())));
    }

    @Transactional(readOnly = true)
    public byte[] getMedia(UUID id, boolean isBanner) {
        User user = getEntity(id);
        byte[] data = isBanner ? user.getBanner() : user.getProfile();
        if (data == null || data.length == 0) {
            throw new EntityNotFoundException("Mídia não encontrada para este usuário.");
        }
        return data;
    }

    // --- Fluxo de Following ---

    @Transactional
    public void follow(UUID followerId, UUID followingId, boolean notify) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Um usuário não pode seguir a si mesmo.");
        }

        if (followingRepository.findByFollowerIdAndFollowingId(followerId, followingId).isPresent()) {
            return; // Já segue
        }

        User follower = getEntity(followerId);
        User following = getEntity(followingId);

        Following relation = Following.builder()
                .follower(follower)
                .following(following)
                .notify(notify)
                .build();

        followingRepository.save(relation);

        auditPublisher.publish("USER_FOLLOWED", followingId, followerId, Map.of(
                "followerHandle", follower.getHandle(),
                "followingHandle", following.getHandle(),
                "notify", notify));
    }

    @Transactional
    public void unfollow(UUID followerId, UUID followingId) {
        Following relation = followingRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .orElseThrow(() -> new EntityNotFoundException("Relação de follow não encontrada."));

        followingRepository.delete(relation);

        auditPublisher.publish("USER_UNFOLLOWED", followingId, followerId, Map.of(
                "followerId", followerId.toString(),
                "followingId", followingId.toString()));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listFollowers(UUID userId) {
        return followingRepository.findAllByFollowingId(userId).stream()
                .map(f -> UserResponse.fromEntity(f.getFollower()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listFollowing(UUID userId) {
        return followingRepository.findAllByFollowerId(userId).stream()
                .map(f -> UserResponse.fromEntity(f.getFollowing()))
                .toList();
    }

    private User getEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + id));
    }
}
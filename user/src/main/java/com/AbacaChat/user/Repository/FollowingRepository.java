package com.AbacaChat.user.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.AbacaChat.user.Domain.Entity.Following;

public interface FollowingRepository extends JpaRepository<Following, UUID> {
    Optional<Following> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    List<Following> findAllByFollowerId(UUID followerId);

    List<Following> findAllByFollowingId(UUID followingId);

    long countByFollowingId(UUID followingId);

    long countByFollowerId(UUID followerId);
}
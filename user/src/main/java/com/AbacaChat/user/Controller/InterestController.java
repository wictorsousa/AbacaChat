package com.AbacaChat.user.Controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.AbacaChat.user.DTO.InterestResponse;
import com.AbacaChat.user.Service.InterestService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users/{userId}/interests")
@RequiredArgsConstructor
public class InterestController {

    private final InterestService interestService;

    @PostMapping("/{topicId}")
    public ResponseEntity<InterestResponse> add(
            @PathVariable UUID userId,
            @PathVariable UUID topicId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interestService.addInterest(userId, topicId));
    }

    @DeleteMapping("/{topicId}")
    public ResponseEntity<Void> remove(
            @PathVariable UUID userId,
            @PathVariable UUID topicId) {
        interestService.removeInterest(userId, topicId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<InterestResponse>> list(@PathVariable UUID userId) {
        return ResponseEntity.ok(interestService.listByUser(userId));
    }
}
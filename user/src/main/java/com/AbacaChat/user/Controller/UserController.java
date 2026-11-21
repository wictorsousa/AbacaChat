package com.AbacaChat.user.Controller;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.AbacaChat.user.DTO.UserCreateRequest;
import com.AbacaChat.user.DTO.UserResponse;
import com.AbacaChat.user.DTO.UserUpdateRequest;
import com.AbacaChat.user.Service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable UUID id, @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // --- Endpoints de Imagem (Profile & Banner) ---

    @PatchMapping(value = "/profile/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadProfile(@PathVariable UUID id, @RequestParam("file") MultipartFile file)
            throws IOException {
        userService.updateMedia(id, file, false);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/profile/{id}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getMedia(id, false));
    }

    @PatchMapping(value = "/banner/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadBanner(@PathVariable UUID id, @RequestParam("file") MultipartFile file)
            throws IOException {
        userService.updateMedia(id, file, true);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/banner/{id}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getBanner(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getMedia(id, true));
    }

    // --- Endpoints de Following ---

    @PostMapping("/{followerId}/follow/{followingId}")
    public ResponseEntity<Void> follow(
            @PathVariable UUID followerId,
            @PathVariable UUID followingId,
            @RequestParam(defaultValue = "true") boolean notify) {
        userService.follow(followerId, followingId, notify);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{followerId}/follow/{followingId}")
    public ResponseEntity<Void> unfollow(@PathVariable UUID followerId, @PathVariable UUID followingId) {
        userService.unfollow(followerId, followingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/followers/{id}")
    public ResponseEntity<List<UserResponse>> getFollowers(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.listFollowers(id));
    }

    @GetMapping("/following/{id}")
    public ResponseEntity<List<UserResponse>> getFollowing(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.listFollowing(id));
    }
}
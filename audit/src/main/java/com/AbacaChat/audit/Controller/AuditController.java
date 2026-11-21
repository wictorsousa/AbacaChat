package com.AbacaChat.audit.Controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.AbacaChat.audit.Domain.Entity.AuditLog;
import com.AbacaChat.audit.Service.AuditService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/audits")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<AuditLog>> listAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(auditService.findAll(pageable));
    }

    @GetMapping("/entity/{entityId}")
    public ResponseEntity<Page<AuditLog>> listByEntity(
            @PathVariable String entityId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(auditService.findByEntityId(entityId, pageable));
    }

    @GetMapping("/service/{service}")
    public ResponseEntity<Page<AuditLog>> listByService(
            @PathVariable String service,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(auditService.findByService(service, pageable));
    }
}
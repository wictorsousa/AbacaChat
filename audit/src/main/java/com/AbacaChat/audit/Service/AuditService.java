package com.AbacaChat.audit.Service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.AbacaChat.audit.Domain.Entity.AuditLog;
import com.AbacaChat.audit.Repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    @SuppressWarnings("unchecked")
    public AuditLog processAndBroadcast(Map<String, Object> payload) {
        AuditLog auditLog = AuditLog.builder()
                .service(String.valueOf(payload.get("service")))
                .action(String.valueOf(payload.get("action")))
                .entityType(String.valueOf(payload.get("entityType")))
                .entityId(String.valueOf(payload.get("entityId")))
                .actorId(asString(payload.get("actorId")))
                .metadata((Map<String, Object>) payload.get("metadata"))
                .occurredAt(parseTimestamp(payload.get("timestamp")))
                .build();

        AuditLog saved = repository.save(auditLog);

        messagingTemplate.convertAndSend("/topic/audit", saved);
        log.debug("Auditoria persistida e enviada via WebSocket: id={}", saved.getId());

        return saved;
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> findByEntityId(String entityId, Pageable pageable) {
        return repository.findByEntityIdOrderByOccurredAtDesc(entityId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> findByService(String service, Pageable pageable) {
        return repository.findByServiceOrderByOccurredAtDesc(service, pageable);
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private LocalDateTime parseTimestamp(Object rawTimestamp) {
        if (rawTimestamp == null) {
            return LocalDateTime.now();
        }
        return LocalDateTime.parse(String.valueOf(rawTimestamp));
    }
}
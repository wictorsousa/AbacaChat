package com.AbacaChat.audit.Repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.AbacaChat.audit.Domain.Entity.AuditLog;

public interface AuditLogRepository extends JpaRepository <AuditLog, UUID>{

    Page<AuditLog> findByServiceOrderByOccurredAtDesc(String service, Pageable pageable);

    Page<AuditLog> findByEntityIdOrderByOccurredAtDesc(String entityId, Pageable pageable);

}

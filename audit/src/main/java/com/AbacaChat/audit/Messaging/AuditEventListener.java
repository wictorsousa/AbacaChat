package com.AbacaChat.audit.Messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.AbacaChat.audit.Service.AuditService;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditService auditService;

    @RabbitListener(queues = "${app.rabbitmq.queue}")
    public void handleAuditEvent(Map<String, Object> payload) {
        log.info("Mensagem recebida da fila de auditoria: action={}", payload.get("action"));
        auditService.processAndBroadcast(payload);
    }
}
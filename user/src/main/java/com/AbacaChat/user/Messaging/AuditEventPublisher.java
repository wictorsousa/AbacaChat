package com.AbacaChat.user.Messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    public void publish(String action, UUID entityId, UUID actorId, Map<String, Object> metadata) {
        Map<String, Object> payload = Map.of(
                "service", "user-service",
                "action", action,
                "entityType", "USER",
                "entityId", entityId.toString(),
                "actorId", actorId != null ? actorId.toString() : "SYSTEM",
                "metadata", metadata,
                "timestamp", LocalDateTime.now().toString());
        rabbitTemplate.convertAndSend(exchange, routingKey, payload);
    }
}
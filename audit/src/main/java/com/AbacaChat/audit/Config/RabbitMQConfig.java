package com.AbacaChat.audit.Config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue}")
    private String queueName;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    @Bean
    public TopicExchange auditExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue auditQueue() {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean 
    public Binding auditBinding(Queue auditQueue, TopicExchange auditExchange){
        return BindingBuilder.bind(auditQueue).to(auditExchange).with(routingKey);
    }

    @Bean
    public JacksonJsonMessageConverter messageConverter(){
        return new JacksonJsonMessageConverter();
    }

}

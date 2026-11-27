# Audit Service

Microsserviço de auditoria do AbacaChat. Ele **não recebe eventos por HTTP**: consome mensagens do RabbitMQ, persiste cada evento no PostgreSQL e expõe consultas REST + streaming em tempo real via WebSocket.

## Stack

- **Java 21** + **Spring Boot 4.1.2**
- **Spring AMQP (RabbitMQ)** — ingestão dos eventos
- **Spring Data JPA** + **PostgreSQL** (`jsonb`) — persistência
- **Spring WebSocket/STOMP** (com SockJS) — streaming em tempo real
- **SpringDoc OpenAPI / Swagger UI**
- **Bean Validation** (dependência presente, mas não aplicada ao payload de auditoria)
- **Lombok**
- **Docker** (build multi-stage, runtime não-root)

## Como funciona

```
user-service
   |  RabbitTemplate.convertAndSend("audit.exchange", "audit.user", payload JSON)
   v
audit.exchange (topic)
   |  binding "audit.#"
   v
audit.logs.queue (durável)
   |  @RabbitListener -> AuditEventListener.handleAuditEvent(Map<String,Object>)
   v
AuditService.processAndBroadcast(payload)
   |-- save() ----------> tabela audit_log (PostgreSQL)
   `-- convertAndSend --> /topic/audit (STOMP)
                              |
                              v
                     cliente em /ws-audit
```

1. O produtor (`user-service`) publica um **mapa serializado como JSON** na exchange topic `audit.exchange` com a routing key `audit.user`.
2. O audit declara a fila durável `audit.logs.queue` e a associa à exchange com o binding pattern `audit.#` — ou seja, captura qualquer routing key que comece com `audit.`.
3. O `AuditEventListener` recebe o JSON convertido para `Map<String, Object>` (`JacksonJsonMessageConverter`) e chama `AuditService.processAndBroadcast`.
4. O serviço monta a entidade `AuditLog`, salva no banco e publica a entidade salva no tópico WebSocket `/topic/audit`.
5. Consultas são feitas somente via REST; o WebSocket é **somente leitura** (não existe `@MessageMapping`, nada é enviado por ele para o serviço).

**Importante:** a fila e o binding são declarados pelo audit na inicialização. Se o audit não estiver rodando quando o produtor publicar, a mensagem enviada à exchange é descartada (não há fila ligada a ela).

## Contrato de entrada — o payload esperado

O listener recebe um `Map<String, Object>`. Não existe DTO, `@Valid` ou schema de fila: o contrato é o formato abaixo, e é responsabilidade de quem publicar enviá-lo corretamente.

| Campo | Tipo | Obrigatório? | Como o audit trata | Observação |
|---|---|---|---|---|
| `service` | string | Sim | `String.valueOf(payload.get("service"))` → `NOT NULL` | Ex.: `user-service` |
| `action` | string | Sim | `String.valueOf(...)` → `NOT NULL` | Ex.: `USER_CREATED`; também aparece no log do listener |
| `entityType` | string | Sim | `String.valueOf(...)` → `NOT NULL` | O produtor atual fixa `USER` (inclusive para interesses) |
| `entityId` | string (UUID em texto) | Sim | `String.valueOf(...)` → `NOT NULL` | Coluna é `varchar`, não há FK |
| `actorId` | string ou `null` | Não | `asString()`: `null` permanece `NULL` no banco | O produtor envia `"SYSTEM"` quando não há ator |
| `metadata` | objeto JSON | Não | cast para `Map<String, Object>` → coluna `jsonb` | Se ausente fica `NULL`; se for outro tipo (string, número, array), estoura `ClassCastException` |
| `timestamp` | string ISO **sem timezone** | Não | `LocalDateTime.parse(String.valueOf(...))`; se ausente usa `LocalDateTime.now()` | Formato: `yyyy-MM-dd'T'HH:mm:ss[.SSS]`, ex.: `2026-11-26T20:45:00.123`. `Z`, offset ou epoch geram `DateTimeParseException` e a mensagem falha |

### Exemplo de payload válido

```json
{
  "service": "user-service",
  "action": "USER_CREATED",
  "entityType": "USER",
  "entityId": "7f2a1c34-9b10-4e0f-8a2c-3d5e6f7a8b90",
  "actorId": "7f2a1c34-9b10-4e0f-8a2c-3d5e6f7a8b90",
  "metadata": {
    "handle": "gabriel",
    "email": "gabriel@example.com"
  },
  "timestamp": "2026-11-26T20:45:00.123"
}
```

### Publicando um evento manualmente

Com `rabbitmqadmin` (routing key precisa casar com o binding `audit.#`):

```bash
rabbitmqadmin publish \
  exchange=audit.exchange \
  routing_key=audit.user \
  properties='{"content_type":"application/json"}' \
  payload='{"service":"user-service","action":"USER_CREATED","entityType":"USER","entityId":"7f2a1c34-9b10-4e0f-8a2c-3d5e6f7a8b90","actorId":"SYSTEM","metadata":{"handle":"gabriel"},"timestamp":"2026-11-26T20:45:00.123"}'
```

### Como o produtor monta o payload

Referência: `user/src/main/java/com/AbacaChat/user/Messaging/AuditEventPublisher.java`.

```java
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
```

`LocalDateTime.now().toString()` gera exatamente o formato aceito por `LocalDateTime.parse`. Use o mesmo padrão em qualquer outro produtor.

### Eventos emitidos hoje

Todos com `service = "user-service"` e `entityType = "USER"`.

| `action` | `entityId` | `actorId` | `metadata` |
|---|---|---|---|
| `USER_CREATED` | ID do usuário | ID do usuário | `handle`, `email` |
| `USER_UPDATED` | ID do usuário | ID do usuário | `nickname` |
| `USER_DELETED` | ID do usuário | ID do usuário | `handle` |
| `USER_BANNER_UPDATED` | ID do usuário | ID do usuário | `sizeBytes`, `contentType` |
| `USER_PROFILE_UPDATED` | ID do usuário | ID do usuário | `sizeBytes`, `contentType` |
| `USER_FOLLOWED` | **ID de quem é seguido** | **ID de quem segue** | `followerHandle`, `followingHandle`, `notify` |
| `USER_UNFOLLOWED` | **ID de quem é seguido** | **ID de quem segue** | `followerId`, `followingId` |
| `INTEREST_ADDED` | ID do interesse | ID do usuário | `userId`, `topicId` |
| `INTEREST_REMOVED` | ID do interesse | ID do usuário | `userId`, `topicId` |

## Consultando os eventos

Base: `http://localhost:8082`. Documentação interativa em `/swagger-ui.html`. Não há autenticação.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/audits` | Lista todos, paginado |
| `GET` | `/audits/entity/{entityId}` | Eventos de uma entidade, mais recentes primeiro |
| `GET` | `/audits/service/{service}` | Eventos de um serviço, mais recentes primeiro |

Parâmetros de paginação do Spring Data: `page` (padrão `0`), `size` (padrão `20`), `sort=propriedade,dir` (ex.: `sort=occurredAt,desc`). `entityId` e `service` são `String` — não há validação de UUID nem normalização de case.

```bash
curl 'http://localhost:8082/audits?size=5&sort=occurredAt,desc'
curl 'http://localhost:8082/audits/entity/7f2a1c34-9b10-4e0f-8a2c-3d5e6f7a8b90'
curl 'http://localhost:8082/audits/service/user-service'
```

A resposta é um `Page<AuditLog>` serializado diretamente da entidade (sem DTO):

```json
{
  "content": [
    {
      "id": "0a1b2c3d-4e5f-6789-abcd-ef0123456789",
      "service": "user-service",
      "action": "USER_CREATED",
      "entityType": "USER",
      "entityId": "7f2a1c34-9b10-4e0f-8a2c-3d5e6f7a8b90",
      "actorId": "7f2a1c34-9b10-4e0f-8a2c-3d5e6f7a8b90",
      "metadata": { "handle": "gabriel", "email": "gabriel@example.com" },
      "occurredAt": "2026-11-26T20:45:00.123",
      "createdAt": "2026-11-26T20:45:00.456"
    }
  ],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 1,
  "totalPages": 1,
  "number": 0,
  "size": 20,
  "first": true,
  "last": true,
  "numberOfElements": 1,
  "empty": false
}
```

`occurredAt` vem do `timestamp` do payload (ou `now()` se ausente); `createdAt` é gerado pelo Hibernate na persistência (`@CreationTimestamp`).

### WebSocket / STOMP

- Endpoint de conexão: **`/ws-audit`** (STOMP over WebSocket, fallback SockJS, CORS `*`).
- Tópico: **`/topic/audit`** — recebe o mesmo JSON de um item de `content` acima.
- Prefixo aplicativo `/app` está configurado, mas **não há canais de escrita**.

Exemplo de subscribe (STOMP sobre WebSocket):

```
CONNECT
accept-version:1.2

SUBSCRIBE
id:sub-0
destination:/topic/audit
```

## Persistência

Tabela `audit_log`, criada/atualizada automaticamente por `spring.jpa.hibernate.ddl-auto=update` (não há Flyway/Liquib nem `schema.sql`).

| Coluna | Tipo | Nulo? | Origem |
|---|---|---|---|
| `id` | `uuid` PK | não | `@GeneratedValue(strategy = UUID)` |
| `service` | `varchar` | não | payload `service` |
| `action` | `varchar` | não | payload `action` |
| `entity_type` | `varchar` | não | payload `entityType` |
| `entity_id` | `varchar` | não | payload `entityId` |
| `actor_id` | `varchar` | sim | payload `actorId` |
| `metadata` | `jsonb` | sim | payload `metadata` (`@JdbcTypeCode(SqlTypes.JSON)`) |
| `occurred_at` | `timestamp` | sim | payload `timestamp` ou `now()` |
| `created_at` | `timestamp` | sim | `@CreationTimestamp` |

Não há relacionamentos/FKs com outros serviços, nem índices além da chave primária (as buscas por `entity_id`/`service` ordenadas por `occurred_at` fazem scan).

## Configuração

Arquivo: `audit/src/main/resources/application.yml`.

| Variável | Padrão | Uso |
|---|---|---|
| `SERVER_PORT` | `8082` | Porta HTTP |
| `SPRING_DATASOURCE_URL` (ou `DATABASE_URL`) | `jdbc:postgresql://localhost:5432/abacachat_audit` | JDBC do Postgres |
| `SPRING_DATASOURCE_USERNAME` (ou `DB_USERNAME`) | `postgres` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` (ou `DB_PASSWORD`) | `postgres` | Senha do banco |
| `SPRING_RABBITMQ_HOST` (ou `RABBITMQ_HOST`) | `localhost` | Host AMQP |
| `SPRING_RABBITMQ_PORT` (ou `RABBITMQ_PORT`) | `5672` | Porta AMQP |
| `SPRING_RABBITMQ_USERNAME` (ou `RABBITMQ_DEFAULT_USER`) | `guest` | Usuário AMQP |
| `SPRING_RABBITMQ_PASSWORD` (ou `RABBITMQ_DEFAULT_PASS`) | `guest` | Senha AMQP |
| `APP_RABBITMQ_EXCHANGE` | `audit.exchange` | Exchange topic (deve ser igual à do produtor) |
| `APP_RABBITMQ_QUEUE` | `audit.logs.queue` | Fila consumida pelo audit |
| `APP_RABBITMQ_ROUTING_KEY` | `audit.#` no audit / `audit.user` no produtor | Binding x routing key de publicação |

### Executando

```bash
cd audit
./mvnw spring-boot:run
```

Ou via Docker (a partir da raiz do repositório):

```bash
docker build -t audit-service ./audit
docker run --rm -p 8082:8082 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/abacachat_audit \
  -e SPRING_RABBITMQ_HOST=host.docker.internal \
  audit-service
```

O gateway não possui rota para `/audits`; o acesso às consultas é direto na porta do serviço.

## Armadilhas e limitações atuais

Leia antes de integrar outro produtor:

1. **`timestamp` é a principal fonte de falha.** Use `LocalDateTime.toString()`/`yyyy-MM-dd'T'HH:mm:ss[.SSS]`. Valores com `Z`, offset (`+00:00`) ou epoch causam `DateTimeParseException` na conversão da mensagem.
2. **Campos obrigatórios ausentes não geram erro.** Como o código usa `String.valueOf(payload.get(...))`, um campo `service`/`action`/`entityType`/`entityId` faltando é gravado como a string literal `"null"` no banco (e não como `NULL` SQL). Não há Bean Validation no listener.
3. **`metadata` deve ser um objeto JSON.** Um valor escalar ou array causa `ClassCastException` no cast para `Map<String, Object>`.
4. **Sem retry/DLQ/idempotência.** Uma mensagem que falha na conversão ou persistência não é reprocessada automaticamente; eventos repetidos geram novas linhas.
5. **Publicação dentro da transação do produtor.** O `user-service` publica antes do commit; um rollback posterior pode deixar um evento de auditoria órfão.
6. **Inconsistências do `.env.example` da raiz:** `AUDIT_SERVER_PORT` e `AUDIT_RABBITMQ_ROUTING_KEY` não são lidos pelo código — use `SERVER_PORT` e `APP_RABBITMQ_ROUTING_KEY`. Além disso, `APP_RABBITMQ_ROUTING_KEY=audit.user` é herdado por ambos os serviços se exportado globalmente; para manter o binding amplo do audit, defina `APP_RABBITMQ_ROUTING_KEY=audit.#` **no ambiente do audit**. `POSTGRES_AUDIT_DB`/`POSTGRES_AUDIT_PORT` também não são consumidos diretamente — configure `SPRING_DATASOURCE_URL`.
7. **Sem segurança.** REST e WebSocket estão abertos, RabbitMQ usa credenciais básicas sem TLS, e o WebSocket aceita qualquer origem (`*`).
8. **`entityType` é fixo `"USER"`** no produtor atual, inclusive para `INTEREST_ADDED`/`INTEREST_REMOVED`.
9. **Sem migrations, índices ou testes** no módulo; o schema depende de `ddl-auto=update`.

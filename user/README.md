# User Service

Microsserviço responsável pelo gerenciamento de usuários, relacionamentos de follow e interesses no AbacaChat.

## Stack

- **Java 21** + **Spring Boot 4.1.2**
- **Spring Web MVC**
- **Spring Data JPA** + **PostgreSQL**
- **Bean Validation**
- **RabbitMQ (AMQP)** para publicação de eventos de auditoria
- **SpringDoc OpenAPI / Swagger UI**
- **Lombok**
- **spring-security-crypto (BCrypt)** para hash de senha

## O que este serviço faz

### Usuários
- Cria usuário com validação de dados.
- Busca usuário por ID.
- Atualiza dados do perfil (nickname, descrição, gênero, pronomes).
- Remove usuário com **soft delete** (`deleted_at`).
- Faz upload e download de imagem de **perfil** e **banner** (armazenadas como bytes no banco).

### Senha
- A senha recebida no cadastro é armazenada como **hash BCrypt** (`PasswordEncoder`), não em texto puro.
- O campo `password` não é exposto nas respostas da API (`@JsonIgnore` na entidade e ausente no `UserResponse`).
- Este serviço **não** implementa autenticação/login; apenas gerencia dados de usuário.

### Follow
- Permite um usuário seguir outro.
- Permite deixar de seguir.
- Lista seguidores e seguidos.
- Impede auto-follow.
- Relação `follower_id + following_id` é única.
- Follow também usa **soft delete**.

### Interesses
- Associa um usuário a um `topicId` (referência lógica a outro serviço/domínio).
- Remove interesse do usuário.
- Lista interesses do usuário.
- Impede interesse duplicado para o mesmo `userId + topicId`.
- Interest também usa **soft delete**.

### Auditoria
- Publica eventos no RabbitMQ (exchange/routing key configuráveis) após ações relevantes.
- Payload publicado inclui: `service`, `action`, `entityType`, `entityId`, `actorId`, `metadata`, `timestamp`.

Eventos emitidos:
- `USER_CREATED`
- `USER_UPDATED`
- `USER_DELETED`
- `USER_PROFILE_UPDATED`
- `USER_BANNER_UPDATED`
- `USER_FOLLOWED`
- `USER_UNFOLLOWED`
- `INTEREST_ADDED`
- `INTEREST_REMOVED`

## API

Base path do serviço: conforme deploy; controllers expõem `/users`.

### Usuários

| Método | Rota | Descrição | Status |
|---|---|---|---|
| `POST` | `/users` | Cria usuário | `201` |
| `GET` | `/users/{id}` | Busca usuário por ID | `200` |
| `PUT` | `/users/{id}` | Atualiza usuário | `200` |
| `DELETE` | `/users/{id}` | Remove usuário (soft delete) | `204` |

#### Criar usuário (`POST /users`)

```json
{
  "nickname": "Gabriel",
  "handle": "gabriel",
  "email": "gabriel@example.com",
  "password": "segredo123",
  "description": "Bio opcional",
  "gender": "MALE",
  "pronouns": "HE_HIM"
}
```

Validações principais:
- `nickname`: obrigatório
- `handle`: obrigatório, 3 a 30 caracteres
- `email`: obrigatório, formato de e-mail
- `password`: obrigatório, mínimo 6 caracteres
- `email` ou `handle` já existentes: retorna erro de requisição inválida

#### Atualizar usuário (`PUT /users/{id}`)

```json
{
  "nickname": "Novo nome",
  "description": "Nova bio",
  "gender": "OTHER",
  "pronouns": "ANY"
}
```

Campos são opcionais; os informados são atualizados.

#### Resposta de usuário (`UserResponse`)

```json
{
  "id": "uuid",
  "nickname": "Gabriel",
  "handle": "gabriel",
  "email": "gabriel@example.com",
  "description": "Bio",
  "gender": "MALE",
  "pronouns": "HE_HIM",
  "slug": "gabriel",
  "profileUrl": "/users/{id}/profile",
  "bannerUrl": "/users/{id}/banner",
  "createdAt": "...",
  "updatedAt": "..."
}
```

> A senha nunca é retornada.

### Mídia (perfil/banner)

| Método | Rota | Content-Type | Descrição | Status |
|---|---|---|---|---|
| `PATCH` | `/users/profile/{id}` | `multipart/form-data` | Upload de foto de perfil (`file`) | `204` |
| `GET` | `/users/profile/{id}` | `image/jpeg` | Download da foto de perfil | `200` |
| `PATCH` | `/users/banner/{id}` | `multipart/form-data` | Upload de banner (`file`) | `204` |
| `GET` | `/users/banner/{id}` | `image/jpeg` | Download do banner | `200` |

Se a mídia não existir, retorna `404`.

### Follow

| Método | Rota | Descrição | Status |
|---|---|---|---|
| `POST` | `/users/{followerId}/follow/{followingId}?notify=true` | Seguir usuário | `201` |
| `DELETE` | `/users/{followerId}/follow/{followingId}` | Deixar de seguir | `204` |
| `GET` | `/users/followers/{id}` | Listar seguidores | `200` |
| `GET` | `/users/following/{id}` | Listar quem o usuário segue | `200` |

Regras:
- Não é permitido seguir a si mesmo.
- Se já seguir, a operação de follow é idempotente (não cria duplicata).
- `notify` tem default `true`.

### Interesses

| Método | Rota | Descrição | Status |
|---|---|---|---|
| `POST` | `/users/{userId}/interests/{topicId}` | Adiciona interesse | `201` |
| `DELETE` | `/users/{userId}/interests/{topicId}` | Remove interesse | `204` |
| `GET` | `/users/{userId}/interests` | Lista interesses do usuário | `200` |

`topicId` é um UUID de tópico gerenciado por outro domínio/serviço.

## Modelos

### User
- `id` (UUID)
- `nickname`
- `handle` (único)
- `email` (único)
- `password` (hash BCrypt, ignorado no JSON)
- `description`
- `gender`: `MALE`, `FEMALE`, `NON_BINARY`, `OTHER`, `PREFER_NOT_TO_SAY`
- `pronouns`: `HE_HIM`, `SHE_HER`, `THEY_THEM`, `ANY`, `OTHER`
- `profile` (bytes)
- `banner` (bytes)
- `slug`
- `createdAt`, `updatedAt`, `deletedAt`

### Following
- `id`
- `follower` (User)
- `following` (User)
- `notify`
- `createdAt`, `updatedAt`, `deletedAt`
- Restrição única: `(follower_id, following_id)`

### Interest
- `id`
- `user` (User)
- `topicId` (UUID)
- `createdAt`, `updatedAt`, `deletedAt`

## Tratamento de erros

`GlobalExceptionHandler` padroniza erros comuns:

- `404 Not Found` para `EntityNotFoundException`
- `400 Bad Request` para `IllegalArgumentException`

Formato:

```json
{
  "timestamp": "...",
  "error": "mensagem"
}
```

## Configuração

Arquivo: `src/main/resources/application.yml`.

| Variável | Padrão | Descrição |
|---|---|---|
| `SERVER_PORT` | `3000` | Porta HTTP |
| `SPRING_DATASOURCE_URL` / `DATABASE_URL` | `jdbc:postgresql://localhost:5432/abacachat_user` | URL do PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` / `DB_USERNAME` | `postgres` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` / `DB_PASSWORD` | `postgres` | Senha do banco |
| `SPRING_RABBITMQ_HOST` / `RABBITMQ_HOST` | `localhost` | Host do RabbitMQ |
| `SPRING_RABBITMQ_PORT` / `RABBITMQ_PORT` | `5672` | Porta do RabbitMQ |
| `SPRING_RABBITMQ_USERNAME` / `RABBITMQ_DEFAULT_USER` | `guest` | Usuário RabbitMQ |
| `SPRING_RABBITMQ_PASSWORD` / `RABBITMQ_DEFAULT_PASS` | `guest` | Senha RabbitMQ |
| `APP_RABBITMQ_EXCHANGE` | `audit.exchange` | Exchange de auditoria |
| `APP_RABBITMQ_ROUTING_KEY` | `audit.user` | Routing key de auditoria |

Configurações relevantes:
- `spring.jpa.hibernate.ddl-auto=update`
- `spring.jpa.show-sql=true`
- Swagger UI: `/swagger-ui.html`

## Documentação OpenAPI

Com o serviço rodando, acesse:

- Swagger UI: `http://localhost:3000/swagger-ui.html`

A configuração OpenAPI declara: **"User Microservice API"**, responsável por usuários, perfis, interesses e seguidores.

## Execução local

Pré-requisitos:
- Java 21
- PostgreSQL
- RabbitMQ

```bash
cd user
./mvnw spring-boot:run
```

Build:

```bash
cd user
./mvnw clean package
```

Testes:

```bash
cd user
./mvnw test
```

## Observações

- O serviço usa **soft delete** em `User`, `Following` e `Interest`; registros deletados recebem `deleted_at` e são filtrados por `@SQLRestriction("deleted_at IS NULL")`.
- O `slug` é gerado no cadastro a partir do `handle` (normalizado para minúsculas e caracteres não alfanuméricos substituídos por `-`).
- Não há endpoints de autenticação/autorização neste serviço; a senha é apenas armazenada com hash seguro para uso futuro.

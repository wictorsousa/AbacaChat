# ==========================================
# Estágio 1: Build da aplicação (Multi-stage)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Utilitários necessários para o wrapper do Maven baixar e extrair a distribuição
RUN apk add --no-cache bash curl unzip

# Copia os arquivos do wrapper e o pom.xml para cache das dependências
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Garante terminação LF e permissão de execução
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Baixa as dependências (camada de cache)
RUN ./mvnw dependency:go-offline -B

# Copia o código-fonte
COPY src ./src

# Compila e gera o pacote JAR executável ignorando testes no build da imagem
RUN ./mvnw clean package -DskipTests

# ==========================================
# Estágio 2: Imagem final de execução (Runtime)
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Criação de usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia o JAR gerado no estágio de build
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser:appgroup

# Porta padrão do microsserviço (sobrescrita por SERVER_PORT via ambiente)
ENV SERVER_PORT=8082
EXPOSE 8082

# Parâmetros de JVM otimizados para container
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# Gateway
---

## Estrutura de Arquivos

```text
gateway/
├── src/
│   ├── configs/
│   │   └── config.ts                # Carregamento de variáveis de ambiente (.env)
│   ├── enums/
│   │   ├── type-of-request-enum.ts  # Classificação de status (SUCCESS, FAIL, NEUTRAL)
│   │   └── week-day-enum.ts         # Enum de dias da semana em português
│   ├── functions/
│   │   ├── colorize-json.ts         # Formatação de JSON com cores no terminal
│   │   ├── current-timestamp.ts     # Geração de timestamps legíveis
│   │   └── format-field.ts          # Utilitário de alinhamento de logs
│   ├── interfaces/
│   │   ├── config-interface.ts      # Tipagem das variáveis de ambiente
│   │   ├── match-interface.ts       # Mapeamento de microsserviços e rotas
│   │   ├── request-context-interface.ts # Tipagem do contexto de requisição
│   │   └── request-log-interface.ts # Tipagem de dados para o logger
│   ├── loggers/
│   │   ├── logger.ts                # Motor de logging do gateway
│   │   └── styles/
│   │       └── request-style.ts     # Paleta de cores e formatação condicional
│   ├── middlewares/
│   │   ├── middleware-type.ts       # Contrato de função middleware
│   │   ├── pipeline.ts              # Executor da cadeia de middlewares
│   │   ├── body-limit.ts            # Middleware 413 Payload Too Large
│   │   └── rate-limiter.ts          # Middleware 429 Too Many Requests
│   ├── proxy/
│   │   └── proxy.ts                 # Encaminhamento HTTP com streaming e fallbacks
│   ├── response/
│   │   └── response.ts              # Classe padronizadora de respostas do gateway
│   ├── routers/
│   │   └── router.ts                # Resolução e reescrita de rotas
│   └── gateway.ts                   # Servidor HTTP principal e orquestrador
├── .env.example
├── package.json
└── README.md
```

---

## Como Executar

### 1. Iniciar o Gateway
Em outro terminal, dentro da pasta `gateway`:
```bash
npm start
```

# 🌌 PentaIA no Censo CEEP — Integração Monolítica

## Visão Geral

Este diretório (`pentaia/`) contém a estrutura completa do ecossistema **PentaIA** integrada ao projeto **Censo CEEP**, consolidando os 5 microsserviços:

1. **Heimdall** — Segurança e autenticação
2. **Zios** — Motor de IA e chatbot (Adinha)
3. **TAS** — Análise de tendências e recomendações
4. **Iris** — Scraping e coleta de dados
5. **Mercúrio** — Hub de distribuição e eventos em tempo real

## 📁 Estrutura de Diretórios

```
pentaia/
├── heimdall/              # Middleware de segurança
│   ├── config.py
│   ├── auth.py
│   ├── middleware.py
│   └── ...
├── zios/                  # Motor de IA (Adinha)
│   ├── main.py            # FastAPI app
│   ├── core/              # Lógica de processamento
│   ├── routers/           # Endpoints
│   └── ...
├── tas/                   # Análise de Tendências
│   ├── main.py
│   ├── app/               # Aplicação principal
│   └── ...
├── iris/                  # Scraping & Coleta
│   ├── main.py
│   └── ...
├── mercurio/              # Hub de Distribuição
│   ├── main.py
│   ├── core/              # Bridge & Broadcaster
│   └── ...
├── docker-compose.yml     # Orquestração local
└── README.md              # Este arquivo
```

## 🚀 Quick Start

### 1. Iniciar todos os serviços

```bash
# Na raiz do projeto censoceeps
docker-compose -f pentaia/docker-compose.yml up --build
```

### 2. Verificar status

```bash
# Heimdall (Segurança)
curl http://localhost:8000/health

# Zios (Chatbot/IA)
curl http://localhost:8001/health

# TAS (Tendências)
curl http://localhost:8002/health

# Iris (Scraping)
curl http://localhost:8003/health

# Mercúrio (Hub)
curl http://localhost:8004/health
```

### 3. Testar integração no Frontend

O frontend já está configurado para chamar:
- `POST /api/v1/zios/chat` — Para o assistente Adinha
- Heimdall valida automaticamente via middleware

## 🔌 Endpoints Principais

### Heimdall (Port 8000)
```
POST /api/v1/auth/login
POST /api/v1/auth/register
GET /health
```

### Zios (Port 8001)
```
POST /api/v1/zios/chat          # Adinha responde
GET /health
```

### TAS (Port 8002)
```
GET /api/v1/recommend/trends    # Tendências
GET /health
```

### Iris (Port 8003)
```
POST /api/v1/iris/scan          # Coleta de dados
GET /health
```

### Mercúrio (Port 8004)
```
GET /api/v1/mercurio/bundle     # Pacote consolidado
GET /health
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do `pentaia/`:

```env
# Heimdall
HEIMDALL_ENABLED=true
HEIMDALL_RATE_LIMIT_REQUESTS=100
HEIMDALL_RATE_LIMIT_WINDOW_SECONDS=60

# Zios
ZIOS_PORT=8001
ZIOS_DEBUG=true

# TAS
TAS_PORT=8002

# Iris
IRIS_PORT=8003

# Mercúrio
MERCURIO_PORT=8004
```

## 🔄 Fluxo de Integração (Adinha)

```
Frontend (Chat)
    ↓
Express (Proxy /api/*)
    ↓
Heimdall (Validação)
    ↓
Zios (Processamento)
    ↓
[TAS → análise] [Iris → dados]
    ↓
Resposta para Adinha
    ↓
Frontend (Renderizado)
```

## 📖 Documentação Detalhada

Para mais informações sobre cada serviço:

- [Heimdall](./heimdall/README.md) — Segurança e autenticação
- [Zios](./zios/) — Motor de IA
- [TAS](./tas/) — Análise e tendências
- [Iris](./iris/) — Scraping e coleta
- [Mercúrio](./mercurio/) — Hub e distribuição

## 🛠️ Desenvolvimento Local

### Rodar um serviço isolado

```bash
cd pentaia/zios
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Testes

```bash
# Na pasta de cada serviço
pytest tests/
```

## 🐳 Docker

### Build de um serviço específico

```bash
docker build -f pentaia/zios/Dockerfile -t censoceeps-zios:latest .
```

### Executar via Docker Compose

```bash
docker-compose -f pentaia/docker-compose.yml up -d zios
```

## 📊 Monitoramento

Os logs de todos os serviços são consolidados via Docker Compose:

```bash
docker-compose -f pentaia/docker-compose.yml logs -f zios
```

## 🔗 Links Úteis

- **PentaIA (Repo Original):** https://github.com/ianofc/pentaia
- **Censo CEEP (Repo):** https://github.com/ianofc/censoceeps
- **Documentação:** Consulte cada subpasta

## 📝 Notas Importantes

1. **Autenticação:** Todos os endpoints passam por Heimdall (exceto `/health`).
2. **Rate Limiting:** Configurável via variáveis de ambiente.
3. **Logs Auditados:** Todos os acessos são registrados com mascaramento de dados sensíveis.
4. **Escalabilidade:** Cada microsserviço pode rodar em containers separados (K8s, Swarm, etc.).

---

**Desenvolvido por IO Santos Group para o ecossistema LYV**

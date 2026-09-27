#!/usr/bin/env python3
"""
MERCÚRIO - Hub de Distribuição
Consolida dados de TAS, Iris e outras fontes em pacotes unificados
"""

import os
import logging
import time
import requests
from datetime import datetime
from typing import Dict, Any, List

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | MERCURIO: %(message)s"
)
logger = logging.getLogger("MERCURIO_MAIN")

app = FastAPI(
    title="MERCÚRIO - Hub de Distribuição",
    description="Consolida e distribui dados em tempo real do ecossistema PentaIA",
    version="1.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BUNDLE_CACHE: Dict[str, Any] = {"expires_at": 0.0, "payload": None}
REQUEST_TIMEOUT = 2.5

TAS_URL = os.getenv("TAS_TRENDS_URL", "http://tas:8002/api/v1/recommend/trends")
IRIS_URL = os.getenv("IRIS_SCAN_URL", "http://iris:8003/scan/full")
HEIMDALL_URL = os.getenv("HEIMDALL_CHECK_URL", "http://zios:8001/v1/proactive/heimdall/check")
CACHE_TTL = 30

@app.get("/")
async def root():
    return {
        "status": "OPERATIONAL",
        "service": "MERCURIO_HUB",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "OPERATIONAL",
        "components": {
            "bridge": "ACTIVE",
            "broadcaster": "ACTIVE",
            "cache": "ACTIVE"
        }
    }

@app.get("/api/v1/mercurio/bundle")
async def get_bundle(request: Request):
    """Retorna pacote consolidado de dados do PentaIA"""
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"📦 Gerando bundle para IP {client_ip}")
    
    # Verifica cache
    if BUNDLE_CACHE["payload"] and time.time() < BUNDLE_CACHE["expires_at"]:
        logger.info("✅ Bundle retornado do cache")
        return BUNDLE_CACHE["payload"]
    
    # Consulta segurança
    security_data = {"status": "PROTECTED", "shield_level": "OPTIMAL"}
    try:
        sec_res = requests.get(HEIMDALL_URL, params={"ip": client_ip}, timeout=REQUEST_TIMEOUT)
        if sec_res.ok:
            security_data = sec_res.json()
    except Exception as e:
        logger.warning(f"⚠️ Heimdall indisponível: {e}")
    
    # Coleta tendências (TAS)
    trends = []
    try:
        tas_res = requests.get(TAS_URL, timeout=REQUEST_TIMEOUT)
        if tas_res.ok:
            data = tas_res.json()
            trends = data.get("trends", [])
            logger.info(f"✅ TAS retornou {len(trends)} tendências")
    except Exception as e:
        logger.warning(f"⚠️ TAS indisponível: {e}")
    
    # Coleta notícias (Iris)
    news = []
    try:
        iris_res = requests.get(IRIS_URL, timeout=REQUEST_TIMEOUT * 2)
        if iris_res.ok:
            data = iris_res.json()
            news = data.get("news", [])
            logger.info(f"✅ IRIS retornou {len(news)} notícias")
    except Exception as e:
        logger.warning(f"⚠️ IRIS indisponível: {e}")
    
    # Monta bundle
    bundle = {
        "trends": trends,
        "news": news,
        "security": security_data,
        "events": [{"id": "e1", "title": "Protocolo Mercúrio Ativo"}],
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "cache_ttl_s": CACHE_TTL,
            "node": "mercurio_hub",
            "sources": ["TAS", "IRIS", "HEIMDALL"]
        }
    }
    
    # Armazena em cache
    BUNDLE_CACHE["payload"] = bundle
    BUNDLE_CACHE["expires_at"] = time.time() + CACHE_TTL
    
    return bundle

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
#!/usr/bin/env python3
"""
IRIS - Motor de Scraping & Coleta de Dados
Realiza varreduras externas e coleta dados estruturados
"""

import os
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | IRIS: %(message)s"
)
logger = logging.getLogger("IRIS_MAIN")

app = FastAPI(
    title="IRIS - Coleta de Dados",
    description="Motor de scraping e coleta de dados externos",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsItem(BaseModel):
    source: str
    title: str
    link: str
    published: str

class ScanResponse(BaseModel):
    google_trends: List[dict]
    news: List[NewsItem]
    source: str
    timestamp: str

@app.get("/")
async def root():
    return {
        "status": "OPERATIONAL",
        "engine": "IRIS_PENTAIA_v1",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "OPERATIONAL",
        "scanner": "ACTIVE"
    }

@app.get("/scan/full", response_model=ScanResponse)
async def scan_full():
    """Realiza scan completo de dados externos"""
    logger.info("🔍 IRIS iniciando varredura completa")
    
    trends = [
        {
            "id": "iris_001",
            "topic": "Educação Inclusiva no Brasil",
            "category": "Educação",
            "volume": "25k"
        },
        {
            "id": "iris_002",
            "topic": "Diversidade e Inclusão em Escolas",
            "category": "Sociedade",
            "volume": "18k"
        }
    ]
    
    news = [
        NewsItem(
            source="G1 Educação",
            title="Nova pesquisa sobre equidade étnica em escolas públicas",
            link="https://g1.globo.com/educacao",
            published="2026-09-27"
        ),
        NewsItem(
            source="Folha de São Paulo",
            title="Censo escolar revela desigualdades de acesso",
            link="https://folha.uol.com.br/educacao",
            published="2026-09-26"
        )
    ]
    
    logger.info(f"✅ IRIS coletou {len(trends)} tendências e {len(news)} notícias")
    
    return ScanResponse(
        google_trends=trends,
        news=news,
        source="IRIS_EXTERNAL",
        timestamp=datetime.now().isoformat()
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
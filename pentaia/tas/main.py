#!/usr/bin/env python3
"""
TAS - Thalamus Accumbens SARA System
Motor de análise de tendências e recomendações
"""

import os
import logging
import math
from datetime import datetime
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | TAS: %(message)s"
)
logger = logging.getLogger("TAS_MAIN")

app = FastAPI(
    title="TAS - Análise de Tendências",
    description="Motor de decisão e recomendação. Filtra, alinha e ranqueia conteúdo.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrendItem(BaseModel):
    id: str
    hashtag: str
    topic: str
    category: str
    engagement: str
    sara_score: float
    viral: bool = False

class TrendsResponse(BaseModel):
    trends: List[TrendItem]
    source: str
    count: int
    engine: str
    timestamp: str

MOCK_TRENDS = [
    TrendItem(
        id="tas_001",
        hashtag="#CensoCEEP",
        topic="Pesquisa Participativa de Equidade Étnico-Racial",
        category="Educação",
        engagement="42.5k",
        sara_score=0.98,
        viral=True
    ),
    TrendItem(
        id="tas_002",
        hashtag="#AntiRacismo",
        topic="Práticas de educação antirracista em escolas",
        category="Sociedade",
        engagement="38.2k",
        sara_score=0.95,
        viral=True
    ),
    TrendItem(
        id="tas_003",
        hashtag="#EquidadeEtnica",
        topic="Pesquisas sobre equidade étnica no Brasil",
        category="Pesquisa",
        engagement="31.7k",
        sara_score=0.92,
        viral=True
    ),
]

@app.get("/")
async def root():
    return {
        "status": "OPERATIONAL",
        "engine": "TAS_PENTAIA_v2",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "OPERATIONAL",
        "components": {
            "thalamus": "ACTIVE",
            "sara": "ACTIVE",
            "accumbens": "ACTIVE"
        }
    }

@app.get("/api/v1/recommend/trends", response_model=TrendsResponse)
async def get_trends():
    """Retorna tendências analisadas e ranqueadas"""
    
    def dopamine_score(trend: TrendItem) -> float:
        eng_str = trend.engagement.replace('k', '').replace('m', '')
        try:
            eng_num = float(eng_str)
        except:
            eng_num = 1.0
        return trend.sara_score * math.log(eng_num + 1)
    
    sorted_trends = sorted(MOCK_TRENDS, key=dopamine_score, reverse=True)
    logger.info(f"📊 TAS ranqueou {len(sorted_trends)} tendências")
    
    return TrendsResponse(
        trends=sorted_trends,
        source="TAS_INTERNAL",
        count=len(sorted_trends),
        engine="TAS_v2",
        timestamp=datetime.now().isoformat()
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
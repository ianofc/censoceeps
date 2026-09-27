#!/usr/bin/env python3
"""
ZIOS - Motor de IA & Chatbot (Adinha)
Cérebro inteligente do ecossistema PentaIA
Endpoint: POST /api/v1/zios/chat
"""

import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | ZIOS: %(message)s"
)
logger = logging.getLogger("ZIOS_MAIN")

app = FastAPI(
    title="ZIOS - Inteligência Proativa",
    description="Motor de IA com suporte a chatbot, memória de sessão e processamento inteligente",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Memória de sessão
SESSION_MEMORY: Dict[str, List[Dict[str, str]]] = {}
MAX_SESSION_HISTORY = 20

class ChatRequest(BaseModel):
    prompt: str
    user_id: str = "anonymous"
    mode: str = "geral"
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    user_id: str
    prompt: str
    reply: str
    mode: str
    timestamp: str
    engine: str
    session_length: int

FALLBACK_RESPONSES = {
    "quem é você": "Sou o ZIOS — Zona de Inteligência Operacional Suprema. Motor de IA do ecossistema PentaIA. Como posso ajudar?",
    "ajuda": "Posso ajudar com: respostas sobre Censo CEEP, análise de dados, recomendações e muito mais. O que precisa?",
    "oi": "Sistema online. Pronto para otimizar sua experiência. Qual é sua dúvida?",
}

def zios_fallback(message: str) -> str:
    msg_lower = message.lower()
    for key, response in FALLBACK_RESPONSES.items():
        if key in msg_lower:
            return response
    return f"Processando: '{message[:50]}...'. Consultando bases de dados. Tente novamente."

@app.get("/")
async def root():
    return {
        "status": "OPERATIONAL",
        "engine": "ZIOS_PENTAIA_v3",
        "service": "Inteligência-Proativa",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "OPERATIONAL",
        "components": {
            "brain": "ACTIVE",
            "memory": "ACTIVE",
            "resonance": "ACTIVE"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/zios/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Chatbot principal da Adinha"""
    user_id = req.user_id or "anonymous"
    message = req.prompt.strip()
    
    if not message:
        raise HTTPException(status_code=400, detail="Mensagem não pode ser vazia")
    
    if user_id not in SESSION_MEMORY:
        SESSION_MEMORY[user_id] = []
    
    SESSION_MEMORY[user_id].append({"role": "user", "text": message})
    
    # Processa mensagem
    reply = zios_fallback(message)
    if len(message) > 20:
        reply = f"Entendi sua pergunta sobre '{message[:30]}...'. Consultando a inteligência PentaIA. Resposta: {reply}"
    
    SESSION_MEMORY[user_id].append({"role": "zios", "text": reply})
    
    if len(SESSION_MEMORY[user_id]) > MAX_SESSION_HISTORY:
        SESSION_MEMORY[user_id] = SESSION_MEMORY[user_id][-MAX_SESSION_HISTORY:]
    
    logger.info(f"💬 ZIOS respondeu para {user_id}")
    
    return ChatResponse(
        user_id=user_id,
        prompt=message,
        reply=reply,
        mode=req.mode,
        timestamp=datetime.now().isoformat(),
        engine="ZIOS_v3",
        session_length=len(SESSION_MEMORY[user_id])
    )

@app.get("/api/v1/zios/history/{user_id}")
async def get_history(user_id: str):
    """Retorna histórico de sessão"""
    history = SESSION_MEMORY.get(user_id, [])
    return {
        "user_id": user_id,
        "history": history,
        "count": len(history),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
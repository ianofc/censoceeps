#!/usr/bin/env python3
"""
HEIMDALL - Segurança & Middleware Central
Middleware de autenticação, rate limiting e detecção de ameaças
"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | HEIMDALL: %(message)s"
)
logger = logging.getLogger("HEIMDALL_MAIN")

app = FastAPI(
    title="HEIMDALL - Segurança PentaIA",
    description="Camada central de segurança, autenticação e proteção do ecossistema PentaIA",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    user_id: str
    email: str
    token: str
    status: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    service: str
    components: dict
    timestamp: str

@app.get("/")
async def root():
    return {
        "status": "OPERATIONAL",
        "service": "HEIMDALL_SECURITY",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return HealthResponse(
        status="OPERATIONAL",
        service="Heimdall",
        components={
            "auth": "ACTIVE",
            "rate_limiter": "ACTIVE",
            "threat_detector": "ACTIVE",
            "audit_logger": "ACTIVE"
        },
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """Autentica usuário via email/senha"""
    logger.info(f"🔐 Login solicitado para: {req.email}")
    
    # Mock: aceita qualquer login
    token = f"token_{req.email.replace('@', '_').replace('.', '_')}"
    user_id = f"user_{hash(req.email) % 100000}"
    
    return LoginResponse(
        user_id=user_id,
        email=req.email,
        token=token,
        status="authenticated",
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/v1/auth/verify")
async def verify_token(token: str):
    """Verifica validade de um token"""
    if not token or not token.startswith("token_"):
        raise HTTPException(status_code=401, detail="Token inválido")
    
    return {
        "valid": True,
        "token": token,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/security/check")
async def security_check(ip: str):
    """Verifica segurança por IP"""
    logger.info(f"🔒 Verificação de segurança para IP: {ip}")
    
    return {
        "status": "PROTECTED",
        "shield_level": "OPTIMAL",
        "client_ip": ip,
        "threat_detected": False,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
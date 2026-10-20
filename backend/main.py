
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.routers.auth import router as auth_router
from app.routers.clientes import router as clientes_router
from app.routers.casos import router as casos_router
from app.routers.arquivos import router as arquivos_router


app = FastAPI(
    title="Sistema de Advocacia",
    description="API do sistema de gestão do escritório de advocacia",
    version="1.0.0",
)

# Configuração do limite de requisições
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registro das rotas
app.include_router(auth_router)
app.include_router(clientes_router)
app.include_router(casos_router)
app.include_router(arquivos_router)


@app.get("/")
def root():
    return {
        "message": "API do Sistema de Advocacia funcionando!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }

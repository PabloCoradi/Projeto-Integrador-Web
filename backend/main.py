
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter

from app.routers.auth import router as auth_router
from app.routers.artigos import router as artigos_router
from app.routers.artigos_publicos import router as artigos_publicos_router
from app.routers.clientes import router as clientes_router
from app.routers.casos import router as casos_router
from app.routers.arquivos import router as arquivos_router
from app.routers.administradores import router as administradores_router


app = FastAPI(
    title="Sistema de Advocacia",
    description="API do sistema de gestÃ£o do escritÃ³rio de advocacia",
    version="1.0.0",
)


# ConfiguraÃ§Ã£o do limite de requisiÃ§Ãµes
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# ConfiguraÃ§Ã£o do CORS
def configurar_cors(aplicacao: FastAPI, origens: list[str]) -> None:
    """Aplica a polÃ­tica CORS explÃ­cita usada pelo painel e pelo site."""

    aplicacao.add_middleware(
        CORSMiddleware,
        allow_origins=origens,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


configurar_cors(app, settings.cors_origins)


# Registro das rotas
app.include_router(auth_router)
app.include_router(artigos_router)
app.include_router(artigos_publicos_router)
app.include_router(clientes_router)
app.include_router(casos_router)
app.include_router(arquivos_router)
app.include_router(administradores_router)


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



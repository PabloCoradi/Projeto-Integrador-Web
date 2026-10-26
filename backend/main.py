from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.artigos import router as artigos_router
from app.routers.artigos_publicos import router as artigos_publicos_router
from app.routers.clientes import router as clientes_router
from app.routers.casos import router as casos_router


app = FastAPI(
    title="Sistema de Advocacia",
    description="API do sistema de gestão do escritório de advocacia",
    version="1.0.0",
)


def configurar_cors(aplicacao: FastAPI, origens: list[str]) -> None:
    """Aplica a política CORS explícita usada pelo painel e pelo site."""

    aplicacao.add_middleware(
        CORSMiddleware,
        allow_origins=origens,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


configurar_cors(app, settings.cors_origins)


app.include_router(auth_router)
app.include_router(artigos_router)
app.include_router(artigos_publicos_router)
app.include_router(clientes_router)
app.include_router(casos_router)


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

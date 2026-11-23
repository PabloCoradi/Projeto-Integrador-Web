from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import exigir_permissao
from app.models.usuario import Usuario
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import montar_resumo

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/", response_model=DashboardResponse)
def resumo(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_permissao("dashboard", "visualizar")),
):
    return montar_resumo(db=db, usuario=usuario)

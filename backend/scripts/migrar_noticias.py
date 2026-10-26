import argparse
import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.artigo import Artigo
from app.models.usuario import Usuario


ARQUIVO_PADRAO = Path(__file__).with_name("noticias_iniciais.json")


def migrar_noticias(
    db: Session,
    autor_email: str,
    caminho: Path = ARQUIVO_PADRAO,
) -> tuple[int, int]:
    """Importa notícias publicadas sem duplicar slugs já existentes."""

    autor = db.scalar(
        select(Usuario).where(
            Usuario.email == autor_email.strip().lower(),
            Usuario.ativo.is_(True),
        )
    )

    if autor is None:
        raise ValueError("Autor não encontrado ou inativo.")

    itens = json.loads(caminho.read_text(encoding="utf-8"))
    importados = 0
    ignorados = 0

    for item in itens:
        existente = db.scalar(
            select(Artigo.id).where(Artigo.slug == item["slug"])
        )

        if existente is not None:
            ignorados += 1
            continue

        publicado_em = datetime.fromisoformat(item["publicado_em"])
        db.add(
            Artigo(
                autor_id=autor.id,
                titulo=item["titulo"],
                slug=item["slug"],
                resumo=item["resumo"],
                conteudo=item["conteudo"],
                status="publicado",
                publicado_em=publicado_em,
                criado_em=publicado_em,
                atualizado_em=publicado_em,
            )
        )
        importados += 1

    db.commit()

    return importados, ignorados


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migra as notícias estáticas do site para a tabela artigo."
    )
    parser.add_argument(
        "--autor-email",
        required=True,
        help="E-mail de um usuário ativo que será registrado como autor.",
    )
    argumentos = parser.parse_args()
    db = SessionLocal()

    try:
        importados, ignorados = migrar_noticias(
            db=db,
            autor_email=argumentos.autor_email,
        )
        print(
            f"Migração concluída: {importados} importadas, "
            f"{ignorados} já existentes."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

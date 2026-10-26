from sqlalchemy.exc import OperationalError

from app.core.database import engine


_erro_conexao = None


def conectar_banco_ou_pular(test_case):
    """Abre a conexão de integração ou registra um skip quando o Postgres está offline."""

    global _erro_conexao

    if _erro_conexao is not None:
        test_case.skipTest(f"PostgreSQL indisponível para teste de integração: {_erro_conexao}")

    try:
        return engine.connect()
    except OperationalError:
        _erro_conexao = "conexão recusada; inicie o PostgreSQL configurado em DATABASE_URL"
        test_case.skipTest(f"PostgreSQL indisponível para teste de integração: {_erro_conexao}")

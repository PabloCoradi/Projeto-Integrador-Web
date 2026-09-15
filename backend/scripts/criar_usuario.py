from getpass import getpass

from app.core.database import SessionLocal
from app.services.usuario_service import criar_usuario


def main():
    print("=== Criar usuário ===")

    nome = input("Nome: ").strip()
    email = input("E-mail: ").strip()
    senha = getpass("Senha: ")
    confirmar_senha = getpass("Confirmar senha: ")

    if senha != confirmar_senha:
        print("Erro: as senhas não conferem.")
        return

    if len(senha) < 8:
        print("Erro: a senha deve ter pelo menos 8 caracteres.")
        return

    db = SessionLocal()

    try:
        usuario = criar_usuario(
            db=db,
            nome=nome,
            email=email,
            senha=senha,
        )

        print(f"Usuário criado com sucesso: {usuario.email}")

    except ValueError as erro:
        db.rollback()
        print(f"Erro: {erro}")

    except Exception as erro:
        db.rollback()
        print(f"Erro inesperado: {erro}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
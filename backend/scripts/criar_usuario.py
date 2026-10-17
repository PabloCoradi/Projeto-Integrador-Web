
from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.database import SessionLocal
from app.services.usuario_service import criar_usuario


def main():
    print("=== Criar usuário ===")

    nome = input("Nome: ").strip()
    email = input("E-mail: ").strip()

    # Validação do nome
    if not nome:
        print("Erro: o nome é obrigatório.")
        return

    if len(nome) > 150:
        print("Erro: o nome deve ter no máximo 150 caracteres.")
        return

    # Validação do e-mail
    try:
        email = TypeAdapter(EmailStr).validate_python(email).lower()
    except ValidationError:
        print("Erro: informe um e-mail válido.")
        return

    if len(email) > 255:
        print("Erro: o e-mail deve ter no máximo 255 caracteres.")
        return

    # Solicitação da senha
    senha = getpass("Senha: ")
    confirmar_senha = getpass("Confirmar senha: ")

    # Confirmação da senha
    if senha != confirmar_senha:
        print("Erro: as senhas não conferem.")
        return

    # Validação do tamanho da senha
    if len(senha) < 8:
        print("Erro: a senha deve ter pelo menos 8 caracteres.")
        return

    if len(senha) > 128:
        print("Erro: a senha deve ter no máximo 128 caracteres.")
        return

    # Conexão com o banco de dados
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

    except Exception:
        db.rollback()
        print(
            "Erro: não foi possível criar o usuário. "
            "Verifique o banco de dados."
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()

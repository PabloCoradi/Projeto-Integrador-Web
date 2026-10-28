from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.core.security import hash_password


def main():
    print("=== Criar Usuário ADMIN ===")

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
        # Criação direta da instância com is_admin=True
        admin = Usuario(
            nome=nome,
            email=email,
            senha_hash=hash_password(senha),
            ativo=True,
            is_admin=True,
        )

        db.add(admin)
        db.commit()

        print(f"Administrador criado com sucesso: {admin.email}")

    except IntegrityError:
        db.rollback()
        print("Erro: Este e-mail já está cadastrado no banco de dados.")

    except Exception as erro:
        db.rollback()
        print(
            "Erro: não foi possível criar o administrador. "
            f"Verifique o banco de dados. Detalhes: {erro}"
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()
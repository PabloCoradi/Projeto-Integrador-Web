"""Normalização de textos para comparações e buscas."""

import re
import unicodedata


def somente_digitos(valor: str | None) -> str:
    """'123.456.789-00' -> '12345678900' (CPF/CNPJ com ou sem pontuação)."""

    return re.sub(r"\D", "", valor or "")


def normalizar_busca(valor: str | None) -> str:
    """Remove acentos, maiúsculas e espaços extras: ' Cível ' -> 'civel'."""

    sem_acento = unicodedata.normalize("NFKD", valor or "")
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))

    return " ".join(sem_acento.casefold().split())

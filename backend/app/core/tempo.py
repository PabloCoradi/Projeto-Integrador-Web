from datetime import UTC, datetime


def agora_utc() -> datetime:
    """Retorna UTC sem tzinfo, compatível com os DateTime atuais do projeto."""
    return datetime.now(UTC).replace(tzinfo=None)

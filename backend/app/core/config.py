from urllib.parse import urlsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validar_cors_origins(cls, valor: str) -> str:
        origens_normalizadas: list[str] = []

        for origem_informada in valor.split(","):
            origem = origem_informada.strip().rstrip("/")

            if not origem:
                continue

            if "*" in origem:
                raise ValueError(
                    "CORS_ORIGINS não aceita curingas quando credenciais estão habilitadas."
                )

            partes = urlsplit(origem)

            try:
                porta = partes.port
            except ValueError as erro:
                raise ValueError(f"Origem CORS inválida: {origem}.") from erro

            if (
                partes.scheme.lower() not in {"http", "https"}
                or not partes.hostname
                or partes.username is not None
                or partes.password is not None
                or partes.path
                or partes.query
                or partes.fragment
            ):
                raise ValueError(
                    f"Origem CORS inválida: {origem}. Informe apenas esquema, host e porta."
                )

            host = partes.hostname.lower()

            if ":" in host:
                host = f"[{host}]"

            origem_normalizada = f"{partes.scheme.lower()}://{host}"

            if porta is not None:
                origem_normalizada += f":{porta}"

            if origem_normalizada not in origens_normalizadas:
                origens_normalizadas.append(origem_normalizada)

        return ",".join(origens_normalizadas)

    @property
    def cors_origins(self) -> list[str]:
        """Origens HTTP aceitas, configuradas como uma lista separada por vírgulas."""
        return self.CORS_ORIGINS.split(",") if self.CORS_ORIGINS else []

    RUSTFS_ENDPOINT: str
    RUSTFS_ACCESS_KEY: str
    RUSTFS_SECRET_KEY: str
    RUSTFS_BUCKET: str = "casos"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()

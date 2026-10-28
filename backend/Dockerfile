FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala as dependências primeiro (aproveita o cache do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do backend
COPY . .

# Roda como usuário comum, não como root
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# --proxy-headers e --forwarded-allow-ips: usam o IP real do visitante,
# enviado pelo Nginx. Sem isso, o limite de requisições (slowapi) trataria
# todos os visitantes como se fossem uma única pessoa.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]

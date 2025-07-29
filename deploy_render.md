# Deploy no Render: Backend Django + Frontend React

## Backend (Django)

### 1. Requisitos

- Python 3.10+
- Repositório com `backend/requirements.txt` e `backend/core/settings.py` configurado para variáveis de ambiente.

### 2. Variáveis de Ambiente

Configure as seguintes variáveis no Render:

- `DJANGO_SECRET_KEY`: Chave secreta do Django (ex: `sua-chave-secreta`)
- `ALLOWED_HOSTS`: Domínios permitidos, separados por vírgula (ex: `render.com,seusite.com`)
- `DJANGO_DEBUG`: `False` para produção

Exemplo:

```
DJANGO_SECRET_KEY=suachavesecreta
ALLOWED_HOSTS=render.com
DJANGO_DEBUG=False
```

### 3. Configuração do Serviço no Render

- **Type:** Web Service
- **Start Command:**  
  ```
  gunicorn core.wsgi:application --bind 0.0.0.0:8000
  ```
- **Build Command:**  
  ```
  apt-get update && apt-get install -y ffmpeg
  pip install -r requirements.txt
  ```
- **Root Directory:** `backend`
- **Auto Deploy:** Ativado

### 4. Arquivos Estáticos

- O Django já está configurado para coletar arquivos estáticos em `staticfiles`.
- Se quiser servir arquivos estáticos separadamente, crie um serviço estático apontando para `backend/staticfiles`.

---

## Frontend (React + Vite)

### 1. Requisitos

- Node.js 18+
- Repositório com `frontend/package.json` e código em `frontend/src/`

### 2. Build e Deploy

- **Type:** Static Site
- **Build Command:**  
  ```
  npm install && npm run build
  ```
- **Publish Directory:**  
  ```
  frontend/dist
  ```
- **Root Directory:** `frontend`
- **Auto Deploy:** Ativado

### 3. Variáveis de Ambiente (opcional)

Se o frontend consome API do backend, configure:

- `VITE_API_URL`: URL pública do backend no Render

Exemplo:

```
VITE_API_URL=https://seu-backend.onrender.com
```

---

## Integração Backend/Frontend

- Certifique-se que o frontend está configurado para consumir a API do backend via variável `VITE_API_URL`.
- No backend, mantenha o CORS liberado para o domínio do frontend.

---

## Passo a Passo Resumido

1. Suba o backend como Web Service no Render, configurando as variáveis de ambiente.
2. Suba o frontend como Static Site no Render, apontando para o diretório de build.
3. Configure o frontend para consumir a API do backend.
4. Teste o funcionamento acessando as URLs públicas do Render.

---

## Observações

- Sempre mantenha as variáveis de ambiente seguras.
- Para atualizações, basta dar push no repositório que o Render fará o deploy automático.
- Consulte a [documentação oficial do Render](https://render.com/docs) para detalhes avançados.

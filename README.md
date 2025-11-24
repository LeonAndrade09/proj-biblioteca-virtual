# Biblioteca Virtual

Sistema simples de gestão de livros com backend em Flask (Python), banco PostgreSQL e frontend em HTML/CSS/JS. Inclui autenticação por JWT, CRUD de livros e interface web mínima.

## Funcionalidades principais

- Cadastro / login de usuários (JWT).
- Adicionar, listar, editar e remover livros.
- Frontend com formulários de login / registro e lista de livros.
- Proteção de rotas que alteram dados com JWT.
- Suporte a CORS configurável via `.env`.

## Estrutura do projeto

```
proj-biblioteca-virtual/
│
├── backend/
│   ├── app.py           
│   ├── models.py        
│   ├── auth_routes.py   
│   └── .env             
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── style.css
│   └── script.js
│
├── requirements.txt
└── README.md
```

## Pré-requisitos

- Python 3.8+
- PostgreSQL (opcional: fallback SQLite para desenvolvimento)
- venv (recomendado)

## Variáveis de ambiente (.env)

No diretório `backend/` crie um `.env` com pelo menos:

```
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nome_do_banco

# JWT
JWT_SECRET_KEY=uma_chave_secreta_forte
JWT_EXPIRES_HOURS=1

# CORS (opcional: origens separadas por vírgula)
FRONTEND_ORIGINS=http://127.0.0.1:5500,http://localhost:8000

# Debug (opcional)
FLASK_DEBUG=True
```

Não versionar o arquivo `.env`.

## Instalação

1. Ative seu virtualenv:
   - PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
2. Instale dependências:
   ```powershell
   pip install -r requirements.txt
   ```

(ou instalar manualmente: Flask, Flask-CORS, Flask-JWT-Extended, Flask-SQLAlchemy, python-dotenv, psycopg2-binary, etc.)

## Criar tabelas do banco (uma vez)

Opção A — REPL (recomendado):
```powershell
cd backend
python
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()
... 
>>> exit()
```

Opção B — rodar o app (se `__main__` chama db.create_all()):
```powershell
cd backend
python app.py
```

Opção C — one‑liner:
```powershell
python -c "from backend.app import app, db; exec('with app.app_context():\\n    db.create_all()')"
```

## Executando a aplicação

- Backend:
  ```powershell
  cd backend
  python app.py
  ```
  API disponível em: `http://127.0.0.1:5000`

- Frontend:
  - Abrir via servidor simples:
    ```powershell
    cd frontend
    python -m http.server 8000
    ```
    Acesse `http://localhost:8000/index.html`
  - Ou acessar via rota estática do Flask: `http://127.0.0.1:5000/frontend/index.html` (se disponível)

## Endpoints importantes

- GET /              — status da API
- POST /auth/register — registra usuário (JSON: { nome, email, senha })
- POST /auth/login    — login (JSON: { email, senha }) → retorna `access_token`
- GET /livros         — lista livros
- POST /add_livro     — cria livro (protegido, enviar Authorization: Bearer <token>)
- PUT /update_livro/<id> — atualiza (protegido)
- DELETE /delete_livro/<id> — remove (protegido)

Exemplo de header com token:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Testes rápidos (curl / PowerShell)

- Registrar:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"nome":"Ana","email":"a@ex.com","senha":"1234"}' \
  http://127.0.0.1:5000/auth/register
```

- Login:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"a@ex.com","senha":"1234"}' \
  http://127.0.0.1:5000/auth/login
```

- Usar token para criar livro:
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"titulo":"Novo","autor":"Autor"}' http://127.0.0.1:5000/add_livro
```

## CORS e desenvolvimento

- Se servir frontend em outra origem (ex.: Live Server :5500 ou python -m http.server :8000), o Flask precisa permitir essa origem — configure `FRONTEND_ORIGINS` no `.env` ou mantenha `CORS(app)` em desenvolvimento.
- Em produção restrinja as origens permitidas.

## Boas práticas e observações

- Tokens JWT são emitidos com `identity` como string (evita erros "Subject must be a string"); ao ler `get_jwt_identity()` converta para int se necessário.
- A coluna `senha_hash` foi dimensionada para 255 para suportar hashes modernos.
- Para alterações de esquema em produção, use Flask-Migrate / Alembic em vez de editar a tabela manualmente.
- Mantenha `JWT_SECRET_KEY` seguro e use HTTPS em produção.
- Remova `debug=True` em produção.

## Debugging comum

- Erro CORS no navegador: ajustar `FRONTEND_ORIGINS` ou ativar CORS no backend.
- 401/422 em rotas protegidas: verifique token no header `Authorization` e reefetue login para obter token válido.
- ModuleNotFoundError: execute comandos a partir do diretório `backend` ou ajuste imports (`from backend.app import ...`) conforme o cwd.

## Licença

Projeto para fins acadêmicos e de aprendizado.
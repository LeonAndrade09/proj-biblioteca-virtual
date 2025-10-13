# Biblioteca Virtual

Este é um sistema simples de Biblioteca Virtual desenvolvido com Flask (backend Python), PostgreSQL (banco de dados) e HTML/CSS/JavaScript (frontend). Ele permite cadastrar, listar, editar e remover livros de forma fácil e intuitiva.

## Funcionalidades

- **Adicionar livros** com título, autor, ano, categoria e quantidade.
- **Listar todos os livros** cadastrados.
- **Editar informações** de um livro existente.
- **Remover livros** do acervo.
- Interface web simples e responsiva.

## Estrutura do Projeto

```
proj-biblioteca-virtual/
│
├── backend/
│   └── app.py           # Código do backend Flask + API REST
│   └── .env             # Variáveis de ambiente do banco de dados
│
├── frontend/
│   └── index.html       # Página principal da biblioteca
│   └── style.css        # Estilos da interface
│   └── scripts.js       # Lógica do frontend (consome a API)
│
└── README.md            # Este arquivo
```

## Pré-requisitos

- Python 3.8+
- PostgreSQL

## Configuração do Banco de Dados

1. Crie um banco de dados PostgreSQL e um usuário.
2. No diretório `backend`, crie um arquivo `.env` com o seguinte conteúdo:

   ```
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nome_do_banco
   ```

3. Instale as dependências do backend:

   ```sh
   pip install flask flask_sqlalchemy flask-cors python-dotenv psycopg2
   ```

4. Crie as tabelas do banco (no Python REPL ou script):

   ```python
   from app import db
   db.create_all()
   ```

## Executando o Backend

No diretório `backend`, execute:

```sh
python backend/app.py
```

O backend estará disponível em [http://127.0.0.1:5000](http://127.0.0.1:5000).

## Executando o Frontend

No diretório `frontend`, você pode abrir o `index.html` diretamente **(se o backend estiver servindo arquivos estáticos)** ou rodar um servidor local:

```sh
python -m http.server 8000
```

Acesse [http://localhost:8000/index.html](http://localhost:8000/index.html).

## Uso

- Preencha o formulário para adicionar um livro.
- Veja a lista de livros cadastrados.
- Use os botões **Editar** e **Remover** para gerenciar os livros.

## Observações

- O backend já está configurado para aceitar requisições CORS.
- O frontend consome a API REST do backend.
- O projeto pode ser facilmente adaptado para outros bancos de dados suportados pelo SQLAlchemy.

## Licença

Este projeto é livre para fins acadêmicos e de aprendizado.
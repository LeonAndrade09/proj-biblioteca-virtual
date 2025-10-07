from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

# -------------------------------
# Configuração do ambiente
# -------------------------------
# Carrega variáveis do .env com caminho absoluto
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# -------------------------------
# Inicialização do app Flask
# -------------------------------
app = Flask(__name__)
CORS(app)

# Configura a URI de conexão com PostgreSQL
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

# Validação mínima das variáveis de ambiente
if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
    raise ValueError("Alguma variável do .env está faltando!")

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # evita warning do SQLAlchemy

# Inicializa o banco
db = SQLAlchemy(app)

# -------------------------------
# Modelos
# -------------------------------
class Livro(db.Model):
    __tablename__ = 'livros'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(150), nullable=False)
    autor = db.Column(db.String(100), nullable=False)
    ano = db.Column(db.Integer)
    categoria = db.Column(db.String(50))
    quantidade = db.Column(db.Integer, default=1)  # valor padrão diretamente no modelo

    def to_dict(self):
        """Converte o objeto em dicionário para JSON"""
        return {
            "id": self.id,
            "titulo": self.titulo,
            "autor": self.autor,
            "ano": self.ano,
            "categoria": self.categoria,
            "quantidade": self.quantidade
        }

# -------------------------------
# Rotas
# -------------------------------
@app.route('/')
def home():
    """Rota inicial para testar a conexão"""
    return jsonify({"mensagem": "Conexão com o banco bem-sucedida!"})

@app.route('/livros', methods=['GET'])
def listar_livros():
    """Lista todos os livros"""
    livros = Livro.query.all()
    return jsonify([livro.to_dict() for livro in livros])

@app.route('/add_livro', methods=['POST'])
def add_livro():
    """Adiciona um novo livro via JSON"""
    data = request.get_json()

    # Validação mínima
    if not data or not data.get('titulo') or not data.get('autor'):
        return jsonify({"erro": "Campos 'titulo' e 'autor' são obrigatórios"}), 400

    # Cria e adiciona o livro
    novo_livro = Livro(
        titulo=data['titulo'],
        autor=data['autor'],
        ano=data.get('ano'),
        categoria=data.get('categoria'),
        quantidade=data.get('quantidade', 1)
    )
    db.session.add(novo_livro)
    db.session.commit()

    return jsonify({"mensagem": f"Livro '{novo_livro.titulo}' adicionado com sucesso!"}), 201

@app.route('/update_livro/<int:id>', methods=['PUT'])
def update_livro(id):
    """Atualiza os dados de um livro pelo ID"""
    data = request.get_json()
    livro = Livro.query.get(id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    # Atualiza apenas os campos enviados
    if 'titulo' in data:
        livro.titulo = data['titulo']
    if 'autor' in data:
        livro.autor = data['autor']
    if 'ano' in data:
        livro.ano = data['ano']
    if 'categoria' in data:
        livro.categoria = data['categoria']
    if 'quantidade' in data:
        livro.quantidade = data['quantidade']

    db.session.commit()
    return jsonify({"mensagem": f"Livro '{livro.titulo}' atualizado com sucesso!"})

@app.route('/delete_livro/<int:id>', methods=['DELETE'])
def delete_livro(id):
    """Remove um livro pelo ID"""
    livro = Livro.query.get(id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    db.session.delete(livro)
    db.session.commit()
    return jsonify({"mensagem": f"Livro '{livro.titulo}' removido com sucesso!"})

@app.route('/frontend/<path:filename>')
def frontend_static(filename):
    """Serve arquivos estáticos da pasta frontend."""
    frontend_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    return send_from_directory(frontend_folder, filename)

# -------------------------------
# Execução do servidor
# -------------------------------
if __name__ == '__main__':
    # debug=True apenas em desenvolvimento
    app.run(debug=True)

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Importa o db e o modelo Livro do arquivo models.py
from models import db, Livro

# Carrega variáveis do .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Inicializa o app Flask e habilita CORS
app = Flask(__name__)
CORS(app)

# Configuração do banco de dados PostgreSQL
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
    raise ValueError("Alguma variável do .env está faltando!")

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o banco de dados com o app
db.init_app(app)

# Rota inicial para testar a conexão
@app.route('/')
def home():
    return jsonify({"mensagem": "Conexão com o banco bem-sucedida!"})

# Lista todos os livros
@app.route('/livros', methods=['GET'])
def listar_livros():
    livros = Livro.query.all()
    return jsonify([livro.to_dict() for livro in livros])

# Adiciona um novo livro
@app.route('/add_livro', methods=['POST'])
def add_livro():
    data = request.get_json()
    if not data or not data.get('titulo') or not data.get('autor'):
        return jsonify({"erro": "Campos 'titulo' e 'autor' são obrigatórios"}), 400

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

# Atualiza os dados de um livro pelo ID
@app.route('/update_livro/<int:id>', methods=['PUT'])
def update_livro(id):
    data = request.get_json()
    livro = Livro.query.get(id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

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

# Remove um livro pelo ID
@app.route('/delete_livro/<int:id>', methods=['DELETE'])
def delete_livro(id):
    livro = Livro.query.get(id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    db.session.delete(livro)
    db.session.commit()
    return jsonify({"mensagem": f"Livro '{livro.titulo}' removido com sucesso!"})

# Serve arquivos estáticos da pasta frontend
@app.route('/frontend/<path:filename>')
def frontend_static(filename):
    frontend_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    return send_from_directory(frontend_folder, filename)

# Execução do servidor Flask
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

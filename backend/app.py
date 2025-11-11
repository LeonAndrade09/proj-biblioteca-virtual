from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
import os
import logging
import urllib.parse
from datetime import timedelta

# Importa o db e os modelos do arquivo models.py
from models import db, Livro, Usuario

# Carrega variáveis do .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Logging básico
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializa o app Flask
app = Flask(__name__)

# Configurações de CORS: permita listar origens via .env (separadas por vírgula)
front_origins = os.getenv('FRONTEND_ORIGINS')
if front_origins:
    origins = [o.strip() for o in front_origins.split(',') if o.strip()]
else:
    # origens de desenvolvimento padrão
    origins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ]

CORS(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)

# Configuração do banco de dados PostgreSQL (com escape da senha)
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

if all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
    db_password_escaped = urllib.parse.quote_plus(DB_PASSWORD)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"postgresql://{DB_USER}:{db_password_escaped}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
else:
    # Fallback seguro para desenvolvimento local.
    logger.warning("Variáveis do .env incompletas. Usando sqlite local (dev).")
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dev.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'troque-isto-em-producao')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.getenv('JWT_EXPIRES_HOURS', '1')))
jwt = JWTManager(app)

# Mensagens de erro JWT mais claras
@jwt.unauthorized_loader
def missing_token_callback(reason):
    return jsonify({"erro": "Token ausente", "detalhe": reason}), 401

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    return jsonify({"erro": "Token inválido", "detalhe": reason}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"erro": "Token expirado"}), 401

# Inicializa o banco de dados com o app
db.init_app(app)

# Registra blueprint de autenticação (arquivo auth_routes.py)
from auth_routes import auth_bp
app.register_blueprint(auth_bp)

# Rotas da aplicação (lista, add, update, delete, serve frontend)
@app.route('/')
def home():
    return jsonify({"mensagem": "API da Biblioteca Virtual funcionando!"})

# Lista todos os livros
@app.route('/livros', methods=['GET'])
def listar_livros():
    livros = Livro.query.all()
    return jsonify([livro.to_dict() for livro in livros])

# Adiciona um novo livro
@app.route('/add_livro', methods=['POST'])
@jwt_required()
def add_livro():
    data = request.get_json() or {}
    if not data.get('titulo') or not data.get('autor'):
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
@jwt_required()
def update_livro(id):
    data = request.get_json() or {}
    livro = Livro.query.get(id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    # get_jwt_identity retorna string (emitido como str(usuario.id)); converter quando precisar de int
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        user_id = None

    # Validação mínima dos campos antes de aplicar
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
@jwt_required()
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
    debug_flag = os.getenv('FLASK_DEBUG', 'False').lower() in ('1', 'true', 'yes')
    app.run(debug=debug_flag)

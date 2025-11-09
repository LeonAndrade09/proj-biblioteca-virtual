from flask import Blueprint, request, jsonify
from models import db, Usuario

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registra um novo usuário. JSON esperado: { "nome", "email", "senha" }"""
    data = request.get_json() or {}
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')

    if not nome or not email or not senha:
        return jsonify({"erro": "Campos 'nome', 'email' e 'senha' são obrigatórios"}), 400

    if Usuario.query.filter_by(email=email).first():
        return jsonify({"erro": "Email já cadastrado"}), 400

    usuario = Usuario(nome=nome, email=email)
    usuario.set_senha(senha)
    db.session.add(usuario)
    db.session.commit()

    return jsonify({"mensagem": "Usuário registrado com sucesso", "id": usuario.id}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Autentica usuário. JSON esperado: { "email", "senha" }"""
    data = request.get_json() or {}
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({"erro": "Campos 'email' e 'senha' são obrigatórios"}), 400

    usuario = Usuario.query.filter_by(email=email).first()
    if not usuario or not usuario.verificar_senha(senha):
        return jsonify({"erro": "Credenciais inválidas"}), 401

    return jsonify({
        "mensagem": "Login bem-sucedido",
        "usuario": {"id": usuario.id, "nome": usuario.nome, "email": usuario.email}
    }), 200
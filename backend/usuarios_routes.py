from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import Usuario, db

usuarios_bp = Blueprint('usuarios_bp', __name__)


@usuarios_bp.route('/usuarios', methods=['GET'])
@jwt_required()
def listar_usuarios():
    usuarios = Usuario.query.all()
    resultado = [
        {"id": u.id, "nome": u.nome, "email": u.email} for u in usuarios
    ]
    return jsonify(resultado), 200

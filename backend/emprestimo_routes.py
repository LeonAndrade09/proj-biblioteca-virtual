from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from models import db, Usuario, Livro, Emprestimo

logger = logging.getLogger(__name__)

emprestimo_bp = Blueprint('emprestimo', __name__, url_prefix='/emprestimos')

@emprestimo_bp.route('', methods=['POST'])
def criar_emprestimo():
    """
    POST /emprestimos
    JSON esperado: { "usuario_id": int, "livro_id": int, "data_devolucao_prevista": "ISO8601" (opcional) }
    """
    data = request.get_json() or {}
    usuario_id = data.get('usuario_id')
    livro_id = data.get('livro_id')
    prevista = data.get('data_devolucao_prevista')

    if not usuario_id or not livro_id:
        return jsonify({"erro": "Campos 'usuario_id' e 'livro_id' são obrigatórios"}), 400

    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    livro = Livro.query.get(livro_id)
    if not livro:
        return jsonify({"erro": "Livro não encontrado"}), 404

    if (livro.quantidade or 0) < 1:
        return jsonify({"erro": "Nenhuma unidade disponível deste livro"}), 400

    # parse data prevista se fornecida (armazenada em data_devolucao inicialmente; será sobrescrita na devolução)
    data_devolucao = None
    if prevista:
        try:
            data_devolucao = datetime.fromisoformat(prevista)
        except Exception:
            return jsonify({"erro": "Formato de 'data_devolucao_prevista' inválido. Use ISO8601."}), 400

    try:
        emprestimo = Emprestimo(
            usuario_id=usuario.id,
            livro_id=livro.id,
            data_emprestimo=datetime.utcnow(),
            data_devolucao=data_devolucao,
            status='emprestado'
        )
        livro.quantidade = (livro.quantidade or 0) - 1
        db.session.add(emprestimo)
        db.session.add(livro)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao criar empréstimo")
        return jsonify({"erro": "Erro interno ao criar empréstimo"}), 500

    resp = emprestimo.to_dict()
    resp.update({"usuario_nome": usuario.nome, "livro_titulo": livro.titulo})
    return jsonify(resp), 201


@emprestimo_bp.route('', methods=['GET'])
def listar_emprestimos():
    """
    GET /emprestimos
    Retorna lista de empréstimos com nome do usuário e título do livro
    """
    try:
        emprestimos = Emprestimo.query.order_by(Emprestimo.data_emprestimo.desc()).all()
        result = []
        for e in emprestimos:
            usuario = getattr(e, 'usuario', None)
            livro = getattr(e, 'livro', None)
            item = e.to_dict()
            item.update({
                "usuario_nome": usuario.nome if usuario else None,
                "livro_titulo": livro.titulo if livro else None
            })
            result.append(item)
        return jsonify(result)
    except Exception:
        logger.exception("Erro ao listar empréstimos")
        return jsonify({"erro": "Erro interno ao listar empréstimos"}), 500


@emprestimo_bp.route('/<int:emp_id>/devolver', methods=['PUT'])
def devolver_emprestimo(emp_id):
    """
    PUT /emprestimos/<id>/devolver
    Marca como devolvido: atualiza data_devolucao (agora), status e incrementa quantidade do livro
    """
    emprestimo = Emprestimo.query.get(emp_id)
    if not emprestimo:
        return jsonify({"erro": "Empréstimo não encontrado"}), 404

    if emprestimo.status == 'devolvido':
        return jsonify({"erro": "Empréstimo já foi devolvido"}), 400

    try:
        emprestimo.data_devolucao = datetime.utcnow()
        emprestimo.status = 'devolvido'

        livro = Livro.query.get(emprestimo.livro_id)
        if livro:
            livro.quantidade = (livro.quantidade or 0) + 1
            db.session.add(livro)

        db.session.add(emprestimo)
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("Erro ao registrar devolução")
        return jsonify({"erro": "Erro interno ao registrar devolução"}), 500

    resp = emprestimo.to_dict()
    resp.update({"usuario_nome": getattr(emprestimo, 'usuario').nome if getattr(emprestimo, 'usuario', None) else None,
                 "livro_titulo": getattr(emprestimo, 'livro').titulo if getattr(emprestimo, 'livro', None) else None})
    return jsonify(resp)
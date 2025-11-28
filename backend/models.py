from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Livro(db.Model):
    __tablename__ = 'livros'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(150), nullable=False)
    autor = db.Column(db.String(100), nullable=False)
    ano = db.Column(db.Integer)
    categoria = db.Column(db.String(50))
    quantidade = db.Column(db.Integer, default=1)

    # relação com empréstimos
    emprestimos = db.relationship('Emprestimo', backref='livro', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "autor": self.autor,
            "ano": self.ano,
            "categoria": self.categoria,
            "quantidade": self.quantidade
        }
    
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)

    # relação com empréstimos
    emprestimos = db.relationship('Emprestimo', backref='usuario', lazy=True)

    def set_senha(self, senha):
        """Gera e armazena o hash da senha"""
        self.senha_hash = generate_password_hash(senha)

    def verificar_senha(self, senha):
        """Verifica se a senha fornecida bate com o hash armazenado"""
        return check_password_hash(self.senha_hash, senha)

class Emprestimo(db.Model):
    __tablename__ = 'emprestimos'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    livro_id = db.Column(db.Integer, db.ForeignKey('livros.id'), nullable=False)
    data_emprestimo = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data_prevista = db.Column(db.Date, nullable=True)
    data_devolucao = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='emprestado')

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "livro_id": self.livro_id,
            "data_emprestimo": self.data_emprestimo.isoformat() if self.data_emprestimo else None,
            "data_prevista": self.data_prevista.isoformat() if self.data_prevista else None,
            "data_devolucao": self.data_devolucao.isoformat() if self.data_devolucao else None,
            "status": self.status
        }

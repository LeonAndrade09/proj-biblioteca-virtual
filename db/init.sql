CREATE TABLE livros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    ano INT,
    categoria VARCHAR(50),
    quantidade INT DEFAULT 1
);

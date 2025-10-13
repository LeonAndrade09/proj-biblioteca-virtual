// Seleciona elementos do DOM
const listaLivros = document.getElementById('listaLivros');
const formLivro = document.getElementById('formLivro');

// URL base da API backend
const API_URL = 'http://127.0.0.1:5000';

// Busca e exibe a lista de livros cadastrados na API
async function carregarLivros() {
    const res = await fetch(`${API_URL}/livros`);
    const livros = await res.json();

    listaLivros.innerHTML = '';
    livros.forEach(livro => {
        // Cria um item de lista para cada livro
        const li = document.createElement('li');
        li.textContent = `${livro.titulo} - ${livro.autor} (${livro.ano || ''}) [${livro.categoria || ''}] - Qtd: ${livro.quantidade}`;

        // Botão para remover o livro
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'Remover';
        btnRemover.onclick = () => removerLivro(livro.id);

        // Botão para editar o livro
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarLivro(livro);

        li.appendChild(btnRemover);
        li.appendChild(btnEditar);
        listaLivros.appendChild(li);
    });
}

// Envia um novo livro para a API (CREATE)
async function adicionarLivro(e) {
    e.preventDefault();

    const livro = {
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        ano: parseInt(document.getElementById('ano').value) || null,
        categoria: document.getElementById('categoria').value,
        quantidade: parseInt(document.getElementById('quantidade').value) || 1
    };

    const res = await fetch(`${API_URL}/add_livro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(livro)
    });

    const data = await res.json();
    alert(data.mensagem);

    formLivro.reset();
    carregarLivros();
}

// Define o comportamento padrão do formulário para adicionar livros
formLivro.onsubmit = adicionarLivro;

// Remove um livro da API pelo ID (DELETE)
async function removerLivro(id) {
    if (confirm('Tem certeza que deseja remover este livro?')) {
        const res = await fetch(`${API_URL}/delete_livro/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        alert(data.mensagem || data.erro);
        carregarLivros();
    }
}

// Preenche o formulário para editar um livro e altera o submit para atualizar (UPDATE)
function editarLivro(livro) {
    // Preenche os campos do formulário com os dados do livro selecionado
    document.getElementById('titulo').value = livro.titulo;
    document.getElementById('autor').value = livro.autor;
    document.getElementById('ano').value = livro.ano || '';
    document.getElementById('categoria').value = livro.categoria || '';
    document.getElementById('quantidade').value = livro.quantidade || 1;

    // Altera o comportamento do submit para atualizar o livro selecionado
    formLivro.onsubmit = async function(e) {
        e.preventDefault();
        const livroAtualizado = {
            titulo: document.getElementById('titulo').value,
            autor: document.getElementById('autor').value,
            ano: parseInt(document.getElementById('ano').value) || null,
            categoria: document.getElementById('categoria').value,
            quantidade: parseInt(document.getElementById('quantidade').value) || 1
        };
        const res = await fetch(`${API_URL}/update_livro/${livro.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livroAtualizado)
        });
        const data = await res.json();
        alert(data.mensagem || data.erro);
        formLivro.reset();
        formLivro.onsubmit = adicionarLivro; // Restaura o comportamento padrão do formulário
        carregarLivros();
    };
}

// Carrega a lista de livros ao iniciar a página (READ)
carregarLivros();

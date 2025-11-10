// Seleciona elementos do DOM
const listaLivros = document.getElementById('listaLivros');
const formLivro = document.getElementById('formLivro');

// URL base da API backend
const API_URL = 'http://127.0.0.1:5000';

// LOGIN (usa /auth/login e armazena access_token)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();
        if (response.ok) {
            // backend retorna { access_token, usuario: { nome, email, id } }
            localStorage.setItem("token", data.access_token);
            alert(`Bem-vindo, ${data.usuario?.nome || 'usuário'}!`);
            window.location.href = "index.html";
        } else {
            alert(data.erro || "Falha no login.");
        }
    });
}

// CADASTRO (usa /auth/register)
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Usuário cadastrado com sucesso!");
            window.location.href = "login.html";
        } else {
            alert(data.erro || "Erro no cadastro.");
        }
    });
}

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

// helper para incluir token no header
function authHeaders() {
    const token = localStorage.getItem("token");
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// Envia um novo livro para a API (CREATE) — agora inclui token se presente
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
        headers: authHeaders(),
        body: JSON.stringify(livro)
    });

    const data = await res.json();
    alert(data.mensagem || data.erro);

    formLivro.reset();
    carregarLivros();
}

// Remove um livro da API pelo ID (DELETE) — inclui token se presente
async function removerLivro(id) {
    if (confirm('Tem certeza que deseja remover este livro?')) {
        const res = await fetch(`${API_URL}/delete_livro/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
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
        formLivro.onsubmit = adicionarLivro; 
        carregarLivros();
    };
}

// Carrega a lista de livros ao iniciar a página (READ)
carregarLivros();

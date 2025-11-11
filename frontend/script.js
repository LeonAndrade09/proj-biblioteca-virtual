// Seleciona elementos do DOM
const listaLivros = document.getElementById('listaLivros');
const formLivro = document.getElementById('formLivro');

// URL base da API backend
const API_URL = 'http://127.0.0.1:5000';

// Função para mostrar aviso na tela (toast)
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // força reflow para permitir animação CSS
    void toast.offsetWidth;
    toast.classList.add('toast--visible');

    setTimeout(() => {
        toast.classList.remove('toast--visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}

// LOGIN (usa /auth/login e armazena access_token)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const text = await response.text();
            let data;
            try { data = JSON.parse(text); } catch { data = { message: text }; }

            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                showToast(`Bem-vindo, ${data.usuario?.nome || 'usuário'}!`, 'success', 1500);
                setTimeout(() => window.location.href = "index.html", 1200);
            } else {
                showToast(data.erro || data.message || "Falha no login.", 'error', 4000);
            }
        } catch (err) {
            console.error(err);
            showToast("Erro de rede ao efetuar login.", 'error', 4000);
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

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, senha })
            });

            const text = await response.text();
            let data;
            try { data = JSON.parse(text); } catch { data = { message: text }; }

            if (response.ok) {
                showToast("Usuário cadastrado com sucesso!", 'success', 1500);
                setTimeout(() => window.location.href = "login.html", 1200);
            } else {
                showToast(data.erro || data.message || "Erro no cadastro.", 'error', 4000);
            }
        } catch (err) {
            console.error(err);
            showToast("Erro de rede ao registrar usuário.", 'error', 4000);
        }
    });
}

// Busca e exibe a lista de livros cadastrados na API
async function carregarLivros() {
    try {
        const res = await fetch(`${API_URL}/livros`);
        if (!res.ok) {
            const text = await res.text();
            console.error('Erro ao carregar livros:', res.status, text);
            showToast('Erro ao carregar livros', 'error', 3000);
            return;
        }
        const livros = await res.json();

        listaLivros.innerHTML = '';
        if (!Array.isArray(livros) || livros.length === 0) {
            listaLivros.innerHTML = '<li>Nenhum livro cadastrado.</li>';
            return;
        }

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
    } catch (err) {
        console.error(err);
        showToast('Erro de rede ao carregar livros', 'error', 3000);
    }
}

// helper para incluir token no header
function authHeaders() {
    const token = localStorage.getItem("token");
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// Envia um novo livro para a API (CREATE)
async function adicionarLivro() {
    const livro = {
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        ano: parseInt(document.getElementById('ano').value) || null,
        categoria: document.getElementById('categoria').value,
        quantidade: parseInt(document.getElementById('quantidade').value) || 1
    };

    try {
        const res = await fetch(`${API_URL}/add_livro`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(livro)
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (res.ok) {
            showToast(data.mensagem || 'Livro adicionado', 'success');
            formLivro.reset();
            carregarLivros();
        } else {
            showToast(data.erro || data.message || 'Erro ao adicionar livro', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de rede ao adicionar livro', 'error');
    }
}

// Remove um livro da API pelo ID (DELETE)
async function removerLivro(id) {
    if (!confirm('Tem certeza que deseja remover este livro?')) return;
    try {
        const res = await fetch(`${API_URL}/delete_livro/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (res.ok) {
            showToast(data.mensagem || 'Removido', 'success');
            carregarLivros();
        } else {
            showToast(data.erro || data.message || 'Erro ao remover', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de rede ao remover livro', 'error');
    }
}

// Preenche o formulário para editar um livro (modo edição)
let formIsEditing = false;
let editingLivroId = null;
function editarLivro(livro) {
    formIsEditing = true;
    editingLivroId = livro.id;
    // Preenche os campos do formulário com os dados do livro selecionado
    document.getElementById('titulo').value = livro.titulo;
    document.getElementById('autor').value = livro.autor;
    document.getElementById('ano').value = livro.ano || '';
    document.getElementById('categoria').value = livro.categoria || '';
    document.getElementById('quantidade').value = livro.quantidade || 1;
}

// Submissão do formulário — trata ADD e UPDATE
if (formLivro) {
    formLivro.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (formIsEditing && editingLivroId) {
            const livroAtualizado = {
                titulo: document.getElementById('titulo').value,
                autor: document.getElementById('autor').value,
                ano: parseInt(document.getElementById('ano').value) || null,
                categoria: document.getElementById('categoria').value,
                quantidade: parseInt(document.getElementById('quantidade').value) || 1
            };

            try {
                const res = await fetch(`${API_URL}/update_livro/${editingLivroId}`, {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify(livroAtualizado)
                });

                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { data = { message: text }; }

                if (res.ok) {
                    showToast(data.mensagem || 'Atualizado', 'success');
                } else {
                    showToast(data.erro || data.message || 'Erro ao atualizar', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Erro de rede ao atualizar livro', 'error');
            } finally {
                formLivro.reset();
                formIsEditing = false;
                editingLivroId = null;
                carregarLivros();
            }
            return;
        }

        // Caso padrão: adicionar
        await adicionarLivro();
    });
}

// Carrega a lista de livros ao iniciar a página (READ)
carregarLivros();

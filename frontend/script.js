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
    if (!listaLivros) return;

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
            listaLivros.innerHTML = '<li class="sem-livros">Nenhum livro cadastrado.</li>';
            return;
        }

        livros.forEach(livro => {
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

// elementos da página de empréstimos (só existem em emprestimos.html)
const emprestimoForm = document.getElementById('emprestimoForm');
const usuarioSelect = document.getElementById('usuarioSelect');
const livroSelect = document.getElementById('livroSelect');
const dataPrevistaInput = document.getElementById('data_prevista');
const listaEmprestimos = document.getElementById('listaEmprestimos');

// bloqueia datas anteriores + bloqueia datas muito distantes (2 anos)
if (dataPrevistaInput) {
    const hoje = new Date();
    const minDate = hoje.toISOString().split("T")[0];

    // cria nova data = hoje + 2 anos
    const maxDateObj = new Date();
    maxDateObj.setFullYear(maxDateObj.getFullYear() + 2);
    const maxDate = maxDateObj.toISOString().split("T")[0];

    dataPrevistaInput.min = minDate;
    dataPrevistaInput.max = maxDate;
}

// validação adicional ao enviar
if (emprestimoForm) {
    emprestimoForm.addEventListener("submit", (e) => {
        const selecionada = new Date(dataPrevistaInput.value);

        const hoje = new Date();
        const limite = new Date();
        limite.setFullYear(limite.getFullYear() + 2);

        if (selecionada < hoje) {
            e.preventDefault();
            alert("A data não pode ser anterior ao dia de hoje.");
        }

        if (selecionada > limite) {
            e.preventDefault();
            alert("A data prevista não pode ultrapassar 2 anos a partir de hoje.");
        }
    });
}

// formata data (aceita date-only "YYYY-MM-DD" ou ISO datetime) para exibicao amigavel
function formatDate(d) {
    if (!d) return '—';

    // Se já for um objeto Date, formata direto
    if (d instanceof Date) {
        if (isNaN(d)) return '—';
        return d.toLocaleString();
    }

    // Se for string, primeiro detecta date-only (YYYY-MM-DD)
    if (typeof d === 'string') {
        // remove espaços
        const s = d.trim();

        // Padrão date-only: 2026-01-01
        const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(s);
        if (dateOnlyMatch) {
            const [y, m, day] = s.split('-').map(Number);
            // cria Date no fuso local (evita interpretar como UTC)
            const dt = new Date(y, m - 1, day);
            return dt.toLocaleDateString();
        }

        // Caso seja ISO datetime (com ou sem timezone), tenta converter
        try {
            const dt = new Date(s);
            if (isNaN(dt)) return s;
            return dt.toLocaleString();
        } catch {
            return s;
        }
    }

    // fallback: mostra como string
    try { return String(d); } catch { return '—'; }
}

// tenta carregar lista de usuários. tenta várias rotas possíveis.
async function carregarUsuariosParaSelect() {
    if (!usuarioSelect) return;
    usuarioSelect.innerHTML = '<option value="">Carregando usuários...</option>';

    const tryEndpoints = ['/usuarios', '/users', '/auth/usuarios', '/auth/users'];
    let usuarios = null;

    for (const ep of tryEndpoints) {
        try {
            const res = await fetch(`${API_URL}${ep}`, { headers: authHeaders() });
            if (!res.ok) continue;
            usuarios = await res.json();
            break;
        } catch (err) {
            // tentar próximo
        }
    }

    // fallback: tentar rota de perfil (usuário logado)
    if (!usuarios) {
        try {
            const res = await fetch(`${API_URL}/auth/perfil`, { headers: authHeaders() });
            if (res.ok) {
                const u = await res.json();
                usuarios = [u];
            }
        } catch (err) {}
    }

    // monta select
    usuarioSelect.innerHTML = '';
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
        usuarioSelect.innerHTML = '<option value="">Nenhum usuário disponível</option>';
        return;
    }

    usuarioSelect.appendChild(Object.assign(document.createElement('option'), { value: '', textContent: 'Selecione um usuário' }));
    usuarios.forEach(u => {
        const opt = document.createElement('option');
        // tenta campos comuns
        opt.value = u.id ?? u.user_id ?? u.usuario_id ?? u.email ?? '';
        opt.textContent = (u.nome || u.name || u.email || `#${opt.value}`);
        usuarioSelect.appendChild(opt);
    });
}

// carrega livros para o select (aproveita /livros)
async function carregarLivrosParaSelect() {
    if (!livroSelect) return;
    livroSelect.innerHTML = '<option value="">Carregando livros...</option>';

    try {
        const res = await fetch(`${API_URL}/livros`);
        if (!res.ok) {
            livroSelect.innerHTML = '<option value="">Erro ao carregar livros</option>';
            return;
        }
        const livros = await res.json();
        if (!Array.isArray(livros) || livros.length === 0) {
            livroSelect.innerHTML = '<option value="">Nenhum livro cadastrado</option>';
            return;
        }

        livroSelect.innerHTML = '<option value="">Selecione um livro</option>';
        livros.forEach(l => {
            // inclui todos, mas indica se quantidade é zero
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.textContent = `${l.titulo} — ${l.autor} (Qtd: ${l.quantidade ?? 0})`;
            if ((l.quantidade ?? 0) <= 0) opt.disabled = true;
            livroSelect.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        livroSelect.innerHTML = '<option value="">Erro de rede</option>';
    }
}

// cria empréstimo (POST /emprestimos)
async function criarEmprestimo(payload) {
    try {
        const res = await fetch(`${API_URL}/emprestimos`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (res.ok) {
            showToast(data.mensagem || 'Empréstimo registrado', 'success');
            await carregarEmprestimos();
            await carregarLivros();      
            await carregarLivrosParaSelect(); 
            return true;
        } else {
            showToast(data.erro || data.message || 'Erro ao registrar empréstimo', 'error', 5000);
            return false;
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de rede ao registrar empréstimo', 'error');
        return false;
    }
}

// devolve empréstimo (PUT /emprestimos/:id/devolver) com fallback
async function devolverEmprestimo(id) {
    if (!confirm('Confirmar devolução deste empréstimo?')) return;
    try {
        let res = await fetch(`${API_URL}/emprestimos/${id}/devolver`, {
            method: 'PUT',
            headers: authHeaders()
        });

        if (!res.ok && res.status === 405) {
            // fallback: endpoint alternativo
            res = await fetch(`${API_URL}/devolver/${id}`, { method: 'POST', headers: authHeaders() });
        }

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { message: text }; }

        if (res.ok) {
            showToast(data.mensagem || 'Devolução registrada', 'success');
            await carregarEmprestimos();
            await carregarLivros();
            await carregarLivrosParaSelect();
        } else {
            showToast(data.erro || data.message || 'Erro ao devolver', 'error', 5000);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de rede ao devolver empréstimo', 'error');
    }
}

// carrega empréstimos e exibe em lista
async function carregarEmprestimos() {
    if (!listaEmprestimos) return;
    listaEmprestimos.innerHTML = '<li class="small">Carregando...</li>';

    try {
        const res = await fetch(`${API_URL}/emprestimos`, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Erro ao carregar empréstimos:', res.status, text);
            listaEmprestimos.innerHTML = '<li class="small">Erro ao carregar empréstimos</li>';
            return;
        }

        const emprestimos = await res.json();
        listaEmprestimos.innerHTML = '';

        if (!Array.isArray(emprestimos) || emprestimos.length === 0) {
            listaEmprestimos.innerHTML = '<li class="small">Nenhum empréstimo ativo.</li>';
            return;
        }

        emprestimos.forEach(emp => {
            const li = document.createElement('li');

            // nomes/títulos possíveis vindos do backend (vários formatos)
            const usuarioNome = emp.usuario?.nome || emp.user?.nome || emp.usuario_nome || emp.nome_usuario || emp.nome || (`#${emp.user_id || emp.usuario_id || emp.usuarioId || ''}`);
            const livroTitulo = emp.livro?.titulo || emp.book?.titulo || emp.titulo_livro || emp.livro_titulo || emp.titulo || (`#${emp.livro_id || emp.book_id || ''}`);

            // datas: tentativa de ler campos previstos e efetivos em vários nomes possíveis
            const emprestadoEm = formatDate(emp.data_emprestimo || emp.emprestado_em || emp.created_at);
            const previstaRaw = emp.data_prevista || emp.data_devolucao_prevista || emp.previsao || emp.expected_return || null;
            const prevista = formatDate(previstaRaw);
            const devolucaoRaw = emp.data_devolucao || emp.returned_at || emp.devolvido_em || null;
            const devolucao = formatDate(devolucaoRaw);

            // status possível
            const status = (emp.status || emp.estado || (devolucaoRaw ? 'devolvido' : 'emprestado')).toString().toLowerCase();

            // Composição do texto exibido:
            // - mostra prevista separada de devolução efetiva
            let detalheDatas = `Emprestado: ${emprestadoEm}`;
            if (previstaRaw) detalheDatas += ` • Prevista: ${prevista}`;
            detalheDatas += ` • Devolução: ${devolucao}`;

            li.innerHTML = `<strong>${livroTitulo}</strong> — ${usuarioNome} <br>
                            ${detalheDatas} <br>
                            <em>Status: ${status}</em><br>`;

            // botão devolver (se ativo)
            if (status === 'devolvido' || devolucaoRaw) {
                // exibe apenas informação de devolução (botão escondido)
                const span = document.createElement('span');
                span.className = 'small muted';
                span.textContent = 'Empréstimo finalizado';
                li.appendChild(span);
            } else {
                const btn = document.createElement('button');
                btn.textContent = 'Devolver';
                btn.onclick = () => devolverEmprestimo(emp.id ?? emp.emprestimo_id ?? emp.loan_id);
                li.appendChild(btn);
            }

            listaEmprestimos.appendChild(li);
        });

    } catch (err) {
        console.error(err);
        listaEmprestimos.innerHTML = '<li class="small">Erro de rede ao carregar empréstimos</li>';
    }
}

// tratar submissão do formulário de empréstimo
if (emprestimoForm) {
    emprestimoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // obtém IDs e valida
        const usuarioVal = usuarioSelect?.value;
        const livroVal = livroSelect?.value;
        const dataPrevista = dataPrevistaInput?.value || null;

        if (!usuarioVal) {
            showToast('Selecione um usuário', 'error');
            return;
        }
        if (!livroVal) {
            showToast('Selecione um livro', 'error');
            return;
        }

        // validação extra: data prevista >= hoje (já imposta pelo input.min, mas reforçar)
        if (dataPrevista) {
            const hojeStr = new Date().toISOString().split("T")[0];
            if (dataPrevista < hojeStr) {
                showToast('A data prevista não pode ser anterior a hoje.', 'error');
                return;
            }
        }

        const payload = {
            usuario_id: isNaN(Number(usuarioVal)) ? usuarioVal : Number(usuarioVal),
            livro_id: isNaN(Number(livroVal)) ? livroVal : Number(livroVal),
            // usamos o campo data_prevista conforme combinado com o backend
            data_prevista: dataPrevista
        };

        const ok = await criarEmprestimo(payload);

        if (ok) {
            // reset do form apenas se deu certo
            emprestimoForm.reset();
        }
    });

    // carrega dados iniciais quando a página apresentar o form
    (async () => {
        await carregarUsuariosParaSelect();
        await carregarLivrosParaSelect();
        await carregarEmprestimos();
    })();
}
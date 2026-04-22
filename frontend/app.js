const API      = '/api/produtos';
const API_HIST = '/api/historico';
const PRODUTOS = Array.from({ length: 100 }, (_, i) => `Produto${i + 1}`);

// ── Auth ─────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('inventario_token') || ''; }
function getNome()  { return localStorage.getItem('inventario_usuario') || ''; }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function verificarAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  document.getElementById('usuario-nome').textContent = `Olá, ${getNome()}`;
  return true;
}

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('inventario_token');
  localStorage.removeItem('inventario_usuario');
  window.location.href = 'login.html';
});

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: authHeaders() });
  if (res.status === 401) {
    localStorage.removeItem('inventario_token');
    localStorage.removeItem('inventario_usuario');
    window.location.href = 'login.html';
    throw new Error('Sessão expirada');
  }
  return res;
}

// ── Elementos ────────────────────────────────────────────────────
const form         = document.getElementById('form-produto');
const campoId      = document.getElementById('produto-id');
const campoBusca   = document.getElementById('nome-busca');
const campoNome    = document.getElementById('nome');
const campoCategoria = document.getElementById('categoria');
const campoQtd     = document.getElementById('quantidade');
const btnSalvar    = document.getElementById('btn-salvar');
const btnCancelar  = document.getElementById('btn-cancelar');
const btnQr        = document.getElementById('btn-qr');
const btnFecharQr  = document.getElementById('btn-fechar-qr');
const secaoQr      = document.getElementById('secao-qr');
const qrResultado  = document.getElementById('qr-resultado');
const formTitulo   = document.getElementById('form-titulo');
const corpoTabela  = document.getElementById('corpo-tabela');
const corpoHistorico = document.getElementById('corpo-historico');
const totalProdutos  = document.getElementById('total-produtos');
const divMensagem    = document.getElementById('mensagem');
const btnAtualizarHist = document.getElementById('btn-atualizar-hist');
const btnExportar    = document.getElementById('btn-exportar');
const filtroNome     = document.getElementById('filtro-nome');
const filtroLocal    = document.getElementById('filtro-local');
const btnLimparFiltros = document.getElementById('btn-limpar-filtros');

// ── Listas suspensas ─────────────────────────────────────────────
for (let i = 1; i <= 100; i++) {
  const o1 = document.createElement('option');
  o1.value = o1.textContent = `P${i}`;
  campoCategoria.appendChild(o1);

  const o2 = document.createElement('option');
  o2.value = o2.textContent = `P${i}`;
  filtroLocal.appendChild(o2);
}

// ── Local persistente ────────────────────────────────────────────
const localKey = 'inventario_local';
function initLocal() {
  const s = localStorage.getItem(localKey);
  if (s) campoCategoria.value = s;
}
campoCategoria.addEventListener('change', () => {
  if (campoCategoria.value) localStorage.setItem(localKey, campoCategoria.value);
});

// ── Calculadora de quantidade ────────────────────────────────────
const qtdInput       = document.getElementById('quantidade-input');
const btnAddParcela  = document.getElementById('btn-add-parcela');
const calcDisplay    = document.getElementById('calc-display');
const calcTexto      = document.getElementById('calc-texto');
const btnLimparCalc  = document.getElementById('btn-limpar-calc');
let parcelas = [];

function calcTotal() { return parcelas.reduce((a, b) => a + b, 0); }

function atualizarCalcDisplay() {
  if (parcelas.length === 0) { calcDisplay.style.display = 'none'; campoQtd.value = ''; return; }
  calcDisplay.style.display = 'flex';
  const total = calcTotal();
  calcTexto.textContent = parcelas.length === 1 ? `Total: ${total}` : `${parcelas.join(' + ')} = ${total}`;
  campoQtd.value = total;
}

function adicionarParcela() {
  const val = parseInt(qtdInput.value);
  if (!val || val < 0) return;
  parcelas.push(val);
  qtdInput.value = '';
  qtdInput.focus();
  atualizarCalcDisplay();
}

btnAddParcela.addEventListener('click', adicionarParcela);
qtdInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); adicionarParcela(); } });
btnLimparCalc.addEventListener('click', () => { parcelas = []; qtdInput.value = ''; atualizarCalcDisplay(); });
function resetarCalc() { parcelas = []; qtdInput.value = ''; atualizarCalcDisplay(); }

// ── Autocomplete ─────────────────────────────────────────────────
const sugestoesList = document.getElementById('sugestoes');
let sugestaoAtiva = -1;

campoBusca.addEventListener('input', () => {
  const termo = campoBusca.value.trim().toLowerCase();
  campoNome.value = '';
  if (!termo) { fecharSugestoes(); return; }
  const filtrados = PRODUTOS.filter(p => p.toLowerCase().includes(termo)).slice(0, 10);
  if (!filtrados.length) { fecharSugestoes(); return; }
  sugestoesList.innerHTML = filtrados.map((p, i) =>
    `<li data-valor="${p}" class="${i === sugestaoAtiva ? 'ativo' : ''}">${destacar(p, termo)}</li>`
  ).join('');
  sugestoesList.style.display = 'block';
  sugestaoAtiva = -1;
});

campoBusca.addEventListener('keydown', e => {
  const itens = sugestoesList.querySelectorAll('li');
  if (e.key === 'ArrowDown')  { e.preventDefault(); sugestaoAtiva = Math.min(sugestaoAtiva + 1, itens.length - 1); atualizarAtivo(itens); }
  else if (e.key === 'ArrowUp')   { e.preventDefault(); sugestaoAtiva = Math.max(sugestaoAtiva - 1, 0); atualizarAtivo(itens); }
  else if (e.key === 'Enter' && sugestaoAtiva >= 0) { e.preventDefault(); selecionarSugestao(itens[sugestaoAtiva].dataset.valor); }
  else if (e.key === 'Escape') fecharSugestoes();
});

sugestoesList.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (li) selecionarSugestao(li.dataset.valor); });
document.addEventListener('click', e => { if (!e.target.closest('.autocomplete-wrapper')) fecharSugestoes(); });

function selecionarSugestao(v) { campoBusca.value = v; campoNome.value = v; fecharSugestoes(); }
function fecharSugestoes()     { sugestoesList.style.display = 'none'; sugestoesList.innerHTML = ''; sugestaoAtiva = -1; }
function atualizarAtivo(itens) { itens.forEach((li, i) => li.classList.toggle('ativo', i === sugestaoAtiva)); }
function destacar(texto, termo) {
  const idx = texto.toLowerCase().indexOf(termo);
  if (idx === -1) return escHtml(texto);
  return escHtml(texto.slice(0, idx)) + `<strong>${escHtml(texto.slice(idx, idx + termo.length))}</strong>` + escHtml(texto.slice(idx + termo.length));
}
campoBusca.addEventListener('blur', () => {
  setTimeout(() => { campoBusca.classList.toggle('campo-invalido', !!campoBusca.value && !campoNome.value); }, 200);
});

// ── QR Code ──────────────────────────────────────────────────────
let html5QrCode = null;
btnQr.addEventListener('click', () => {
  secaoQr.style.display = 'block';
  secaoQr.scrollIntoView({ behavior: 'smooth' });
  qrResultado.style.display = 'none';
  html5QrCode = new Html5Qrcode('qr-reader');
  html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } },
    texto => {
      pararQr();
      const encontrado = PRODUTOS.find(p => p.toLowerCase() === texto.trim().toLowerCase());
      campoBusca.value = encontrado || texto.trim();
      campoNome.value  = encontrado || '';
      qrResultado.textContent = encontrado ? `Produto encontrado: ${encontrado}` : `QR lido: "${texto}"`;
      qrResultado.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, () => {}
  ).catch(err => { mostrarMensagem('Câmera indisponível: ' + err, 'erro'); secaoQr.style.display = 'none'; });
});
btnFecharQr.addEventListener('click', () => { pararQr(); secaoQr.style.display = 'none'; });
function pararQr() { if (html5QrCode) { html5QrCode.stop().catch(() => {}); html5QrCode = null; } }

// ── Filtros ──────────────────────────────────────────────────────
let todosProdutos = [];

filtroNome.addEventListener('input', aplicarFiltros);
filtroLocal.addEventListener('change', aplicarFiltros);
btnLimparFiltros.addEventListener('click', () => { filtroNome.value = ''; filtroLocal.value = ''; aplicarFiltros(); });

function aplicarFiltros() {
  const nome  = filtroNome.value.trim().toLowerCase();
  const local = filtroLocal.value;
  const filtrados = todosProdutos.filter(p =>
    (!nome  || p.nome.toLowerCase().includes(nome)) &&
    (!local || p.categoria === local)
  );
  renderizarTabela(filtrados);
}

// ── CRUD ─────────────────────────────────────────────────────────
async function carregarProdutos() {
  try {
    const res = await apiFetch(API);
    todosProdutos = await res.json();
    aplicarFiltros();
  } catch (err) {
    if (err.message !== 'Sessão expirada')
      mostrarMensagem('Erro ao conectar com o servidor.', 'erro');
    corpoTabela.innerHTML = '<tr><td colspan="7" class="carregando">Sem dados</td></tr>';
  }
}

function renderizarTabela(produtos) {
  totalProdutos.textContent = `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`;
  if (!produtos.length) { corpoTabela.innerHTML = '<tr><td colspan="7" class="carregando">Nenhum produto encontrado.</td></tr>'; return; }
  corpoTabela.innerHTML = produtos.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${escHtml(p.nome)}</td>
      <td>${escHtml(p.categoria)}</td>
      <td class="${p.quantidade <= 5 ? 'estoque-baixo' : ''}">${p.quantidade}</td>
      <td>${escHtml(p.lancado_por || '—')}</td>
      <td>${formatarDataHora(p.criado_em)}</td>
      <td><div class="acoes">
        <button class="btn-editar"  onclick="iniciarEdicao(${p.id},'${escAttr(p.nome)}','${escAttr(p.categoria)}',${p.quantidade})">Editar</button>
        <button class="btn-deletar" onclick="deletarProduto(${p.id},'${escAttr(p.nome)}')">Deletar</button>
      </div></td>
    </tr>`).join('');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const id = campoId.value;
  const nomeFinal = campoNome.value || campoBusca.value.trim();
  if (!nomeFinal) { mostrarMensagem('Selecione um produto da lista.', 'erro'); return; }
  const totalQtd = parcelas.length > 0 ? calcTotal() : parseInt(qtdInput.value);
  if (!totalQtd && totalQtd !== 0) { mostrarMensagem('Informe a quantidade.', 'erro'); return; }
  const corpo = { nome: nomeFinal, categoria: campoCategoria.value, quantidade: totalQtd };
  try {
    const res = await apiFetch(id ? `${API}/${id}` : API, { method: id ? 'PUT' : 'POST', body: JSON.stringify(corpo) });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao salvar');
    mostrarMensagem(id ? 'Produto atualizado!' : 'Produto adicionado!', 'sucesso');
    resetarFormulario();
    carregarProdutos();
    carregarHistorico();
  } catch (err) { if (err.message !== 'Sessão expirada') mostrarMensagem(err.message, 'erro'); }
});

function iniciarEdicao(id, nome, categoria, quantidade) {
  campoId.value = id; campoBusca.value = nome; campoNome.value = nome; campoCategoria.value = categoria;
  parcelas = [quantidade]; qtdInput.value = ''; atualizarCalcDisplay();
  formTitulo.textContent = 'Editar Produto'; btnSalvar.textContent = 'Atualizar'; btnCancelar.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnCancelar.addEventListener('click', resetarFormulario);

function resetarFormulario() {
  form.reset(); campoId.value = ''; campoNome.value = ''; campoBusca.value = ''; resetarCalc();
  const ul = localStorage.getItem(localKey); if (ul) campoCategoria.value = ul;
  formTitulo.textContent = 'Adicionar Produto'; btnSalvar.textContent = 'Salvar'; btnCancelar.style.display = 'none';
}

async function deletarProduto(id, nome) {
  if (!confirm(`Deletar "${nome}"?`)) return;
  try {
    const res = await apiFetch(`${API}/${id}`, { method: 'DELETE' });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao deletar');
    mostrarMensagem('Produto deletado!', 'sucesso');
    carregarProdutos(); carregarHistorico();
  } catch (err) { if (err.message !== 'Sessão expirada') mostrarMensagem(err.message, 'erro'); }
}

// ── Exportar Excel ───────────────────────────────────────────────
btnExportar.addEventListener('click', () => {
  const nome  = filtroNome.value.trim().toLowerCase();
  const local = filtroLocal.value;
  const dados = todosProdutos.filter(p =>
    (!nome  || p.nome.toLowerCase().includes(nome)) &&
    (!local || p.categoria === local)
  );
  const linhas = dados.map(p => ({
    ID: p.id,
    Produto: p.nome,
    Local: p.categoria,
    Quantidade: p.quantidade,
    'Lançado por': p.lancado_por || '—',
    'Data/Hora': formatarDataHora(p.criado_em),
  }));
  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
  XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0,10)}.xlsx`);
});

// ── Histórico ────────────────────────────────────────────────────
async function carregarHistorico() {
  try {
    const res  = await apiFetch(API_HIST);
    const dados = await res.json();
    if (!dados.length) { corpoHistorico.innerHTML = '<tr><td colspan="5" class="carregando">Nenhuma ação registrada.</td></tr>'; return; }
    corpoHistorico.innerHTML = dados.map(h => `
      <tr>
        <td><span class="badge-acao badge-${h.acao.toLowerCase()}">${h.acao}</span></td>
        <td>${escHtml(h.produto_nome || '—')}</td>
        <td>${h.produto_id}</td>
        <td>${escHtml(h.usuario || '—')}</td>
        <td>${formatarDataHora(h.realizado_em)}</td>
      </tr>`).join('');
  } catch { corpoHistorico.innerHTML = '<tr><td colspan="5" class="carregando">Erro ao carregar histórico.</td></tr>'; }
}
btnAtualizarHist.addEventListener('click', carregarHistorico);

// ── Utilitários ──────────────────────────────────────────────────
function mostrarMensagem(texto, tipo) {
  divMensagem.textContent = texto; divMensagem.className = `mensagem ${tipo}`; divMensagem.style.display = 'block';
  setTimeout(() => { divMensagem.style.display = 'none'; }, 4000);
}
function formatarDataHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(str) { return String(str).replace(/'/g,"\\'").replace(/\\/g,'\\\\'); }

// ── Init ─────────────────────────────────────────────────────────
if (verificarAuth()) { initLocal(); carregarProdutos(); carregarHistorico(); }

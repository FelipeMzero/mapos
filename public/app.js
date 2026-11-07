// =====================================================================
// Map-OS v5 Web • Lógica Completa do Sistema integrado ao Supabase
// =====================================================================

let supabaseClient = null;
let emitenteAtual = null;
let listaClientes = [];
let listaOs = [];

// Configurações padrão do projeto Supabase
const SUPABASE_DEFAULT_URL = 'https://tfbhqapkloiuogelidhe.supabase.co';

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  
  // Exibe a data de hoje formatada
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dataHoje = new Date().toLocaleDateString('pt-BR', options);
  const elData = document.getElementById('data-atual');
  if (elData) elData.innerText = dataHoje.charAt(0).toUpperCase() + dataHoje.slice(1);

  // Inicializa tema
  inicializarTema();

  // Carrega configurações locais ou default
  carregarConfiguracoes();
});

// =====================================================================
// TEMA CLARO / ESCURO (DESIGN TOKENS MAP-OS v5)
// =====================================================================
function inicializarTema() {
  const temaSalvo = localStorage.getItem('mapos_theme') || 'dark';
  if (temaSalvo === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  atualizarIconeTema();
}

function alternarTema() {
  const ehDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('mapos_theme', ehDark ? 'dark' : 'light');
  atualizarIconeTema();
}

function atualizarIconeTema() {
  const icone = document.getElementById('icone-tema');
  if (!icone) return;
  const ehDark = document.documentElement.classList.contains('dark');
  icone.setAttribute('data-lucide', ehDark ? 'sun' : 'moon');
  if (window.lucide) window.lucide.createIcons();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
}

// =====================================================================
// NAVEGAÇÃO DE TELAS (SIDEBAR)
// =====================================================================
function navegarPara(telaId) {
  const telas = ['dashboard', 'os', 'clientes', 'produtos', 'servicos', 'emitente', 'usuarios', 'config'];
  
  telas.forEach(nome => {
    const el = document.getElementById(`tela-${nome}`);
    const nav = document.getElementById(`nav-${nome}`);
    if (el) {
      if (nome === telaId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    if (nav) {
      if (nome === telaId) {
        nav.classList.add('bg-brand/10', 'text-brand', 'border-l-2', 'border-brand');
        nav.classList.remove('text-slate-300');
      } else {
        nav.classList.remove('bg-brand/10', 'text-brand', 'border-l-2', 'border-brand');
        nav.classList.add('text-slate-300');
      }
    }
  });

  // Atualiza Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-tela');
  const nomesMap = {
    dashboard: 'Dashboard',
    os: 'Ordens de Serviço',
    clientes: 'Clientes',
    produtos: 'Produtos',
    servicos: 'Serviços',
    emitente: 'Emitente (CPF)',
    usuarios: 'Usuários',
    config: 'Conexão Supabase'
  };
  if (breadcrumb) breadcrumb.innerText = nomesMap[telaId] || telaId;

  if (window.lucide) window.lucide.createIcons();
}

// =====================================================================
// CONEXÃO COM O SUPABASE (BAAS)
// =====================================================================
function carregarConfiguracoes() {
  let url = localStorage.getItem('mapos_supabase_url') || SUPABASE_DEFAULT_URL;
  let key = localStorage.getItem('mapos_supabase_key') || '';

  const inputUrl = document.getElementById('supabase-url');
  const inputKey = document.getElementById('supabase-key');
  if (inputUrl) inputUrl.value = url;
  if (inputKey) inputKey.value = key;

  if (url && key) {
    conectarSupabase(url, key);
  } else {
    atualizarStatusConexao(false, 'Anon Key Necessária');
    carregarEmitenteLocal();
  }
}

function salvarConfigSupabase(event) {
  event.preventDefault();
  const url = document.getElementById('supabase-url').value.trim();
  const key = document.getElementById('supabase-key').value.trim();

  localStorage.setItem('mapos_supabase_url', url);
  localStorage.setItem('mapos_supabase_key', key);

  conectarSupabase(url, key);
}

function conectarSupabase(url, key) {
  try {
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(url, key);
      testarConexaoSupabase(true);
    }
  } catch (err) {
    atualizarStatusConexao(false, 'Falha nas credenciais');
    exibirAlerta('danger', 'Erro ao inicializar Supabase: ' + err.message);
  }
}

async function testarConexaoSupabase(silencioso = false) {
  if (!supabaseClient) {
    exibirAlerta('warning', 'Insira a Anon Key do Supabase na aba Conexão.');
    return;
  }

  atualizarStatusConexao(false, 'Conectando...', true);

  try {
    const { count, error } = await supabaseClient.from('usuarios').select('*', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') throw error;

    atualizarStatusConexao(true, 'Supabase Conectado');
    if (!silencioso) exibirAlerta('success', 'Conexão com PostgreSQL Supabase ativa e respondendo!');

    // Carrega dados iniciais
    await carregarEmitente();
    await carregarClientes();
    await carregarOrdensServico();
  } catch (err) {
    atualizarStatusConexao(false, 'Erro de Conexão');
    if (!silencioso) exibirAlerta('danger', 'Erro ao consultar Supabase: ' + err.message);
  }
}

function atualizarStatusConexao(conectado, texto, conectando = false) {
  const dot = document.getElementById('dot-conexao');
  const txt = document.getElementById('texto-conexao');
  if (!dot || !txt) return;

  txt.innerText = texto;
  dot.classList.remove('bg-emerald-500', 'bg-rose-500', 'bg-amber-400', 'animate-pulse');

  if (conectando) {
    dot.classList.add('bg-amber-400', 'animate-pulse');
  } else if (conectado) {
    dot.classList.add('bg-emerald-500');
  } else {
    dot.classList.add('bg-rose-500');
  }
}

// =====================================================================
// GESTÃO DE EMITENTE (FOCO EM CPF)
// =====================================================================
function mascaraCpf(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}

async function buscarCep(cepValor) {
  const cep = cepValor.replace(/\D/g, '');
  if (cep.length !== 8) return;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      document.getElementById('emitente-rua').value = data.logradouro || '';
      document.getElementById('emitente-bairro').value = data.bairro || '';
      document.getElementById('emitente-cidade').value = data.localidade || '';
      document.getElementById('emitente-uf').value = data.uf || '';
      document.getElementById('emitente-numero').focus();
    }
  } catch (e) {
    console.error('Erro na consulta do CEP', e);
  }
}

async function carregarEmitente() {
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.from('emitente').select('*').limit(1).single();
      if (data) {
        emitenteAtual = data;
        preencherFormEmitente(data);
        localStorage.setItem('mapos_emitente_cache', JSON.stringify(data));
        return;
      }
    } catch (e) {}
  }
  carregarEmitenteLocal();
}

function carregarEmitenteLocal() {
  const salvo = localStorage.getItem('mapos_emitente_cache');
  if (salvo) {
    try {
      emitenteAtual = JSON.parse(salvo);
      preencherFormEmitente(emitenteAtual);
      return;
    } catch (e) {}
  }
  // Valor padrão com o usuário solicitado
  emitenteAtual = {
    nome: 'Felipe Monteiro',
    cnpj: '',
    telefone: '',
    email: 'felipe01sigma@gmail.com',
    rua: '',
    cidade: '',
    uf: ''
  };
  preencherFormEmitente(emitenteAtual);
}

function preencherFormEmitente(dados) {
  if (document.getElementById('emitente-nome')) document.getElementById('emitente-nome').value = dados.nome || '';
  if (document.getElementById('emitente-cpf')) document.getElementById('emitente-cpf').value = dados.cnpj || '';
  if (document.getElementById('emitente-telefone')) document.getElementById('emitente-telefone').value = dados.telefone || '';
  if (document.getElementById('emitente-email')) document.getElementById('emitente-email').value = dados.email || '';
  if (document.getElementById('emitente-cep')) document.getElementById('emitente-cep').value = dados.cep || '';
  if (document.getElementById('emitente-numero')) document.getElementById('emitente-numero').value = dados.numero || '';
  if (document.getElementById('emitente-rua')) document.getElementById('emitente-rua').value = dados.rua || '';
  if (document.getElementById('emitente-bairro')) document.getElementById('emitente-bairro').value = dados.bairro || '';
  if (document.getElementById('emitente-cidade')) document.getElementById('emitente-cidade').value = dados.cidade || '';
  if (document.getElementById('emitente-uf')) document.getElementById('emitente-uf').value = dados.uf || '';
  if (document.getElementById('emitente-logo')) document.getElementById('emitente-logo').value = dados.url_logo || '';
}

async function salvarEmitente(event) {
  event.preventDefault();

  const dados = {
    nome: document.getElementById('emitente-nome').value.trim(),
    cnpj: document.getElementById('emitente-cpf').value.trim(), // Guarda o CPF
    tipo_documento: 'CPF',
    telefone: document.getElementById('emitente-telefone').value.trim(),
    email: document.getElementById('emitente-email').value.trim(),
    cep: document.getElementById('emitente-cep').value.trim(),
    numero: document.getElementById('emitente-numero').value.trim(),
    rua: document.getElementById('emitente-rua').value.trim(),
    bairro: document.getElementById('emitente-bairro').value.trim(),
    cidade: document.getElementById('emitente-cidade').value.trim(),
    uf: document.getElementById('emitente-uf').value.trim().toUpperCase(),
    url_logo: document.getElementById('emitente-logo').value.trim(),
  };

  emitenteAtual = dados;
  localStorage.setItem('mapos_emitente_cache', JSON.stringify(dados));

  if (supabaseClient) {
    try {
      const { data: existe } = await supabaseClient.from('emitente').select('id').limit(1);
      let error = null;
      if (existe && existe.length > 0) {
        const res = await supabaseClient.from('emitente').update(dados).eq('id', existe[0].id);
        error = res.error;
      } else {
        const res = await supabaseClient.from('emitente').insert([dados]);
        error = res.error;
      }

      if (error) throw error;
      exibirAlerta('success', 'Dados do emitente com CPF sincronizados com sucesso no Supabase!');
    } catch (err) {
      exibirAlerta('danger', 'Erro ao salvar no Supabase: ' + err.message);
    }
  } else {
    exibirAlerta('success', 'Dados do emitente com CPF salvos localmente.');
  }
}

// =====================================================================
// CLIENTES
// =====================================================================
async function carregarClientes() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('*')
      .order('idClientes', { ascending: false });

    if (error) throw error;
    listaClientes = data || [];
    renderizarTabelaClientes();
    atualizarSelectClientes();
    atualizarDashboard();
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
  }
}

function renderizarTabelaClientes() {
  const tbody = document.getElementById('tabela-clientes-corpo');
  if (!tbody) return;

  if (listaClientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">Nenhum cliente cadastrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = listaClientes.map(c => `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
      <td class="px-6 py-3.5 font-bold text-slate-900 dark:text-white">${c.nomeCliente}</td>
      <td class="px-6 py-3.5 font-mono text-xs text-slate-500">${c.documento || '-'}</td>
      <td class="px-6 py-3.5">${c.telefone || '-'}</td>
      <td class="px-6 py-3.5">${c.email || '-'}</td>
      <td class="px-6 py-3.5 text-slate-500">${c.cidade ? `${c.cidade}/${c.estado}` : '-'}</td>
    </tr>
  `).join('');
}

function atualizarSelectClientes() {
  const select = document.getElementById('os-cliente');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione um cliente...</option>' +
    listaClientes.map(c => `<option value="${c.idClientes}">${c.nomeCliente} (${c.documento || 'Sem doc'})</option>`).join('');
}

function abrirModalNovoCliente() {
  document.getElementById('modal-cliente').classList.remove('hidden');
}

async function salvarNovoCliente(event) {
  event.preventDefault();
  const nome = document.getElementById('cli-nome').value.trim();
  const doc = document.getElementById('cli-doc').value.trim();
  const tel = document.getElementById('cli-tel').value.trim();
  const email = document.getElementById('cli-email').value.trim();
  const cidade = document.getElementById('cli-cidade').value.trim();
  const uf = document.getElementById('cli-uf').value.trim().toUpperCase();

  const novo = {
    nomeCliente: nome,
    documento: doc,
    telefone: tel,
    email: email || '',
    senha: 'no_password',
    cidade: cidade,
    estado: uf,
    pessoa_fisica: true
  };

  if (!supabaseClient) {
    exibirAlerta('warning', 'Conecte ao Supabase para cadastrar clientes.');
    return;
  }

  try {
    const { error } = await supabaseClient.from('clientes').insert([novo]);
    if (error) throw error;

    exibirAlerta('success', 'Cliente cadastrado com sucesso!');
    fecharModal('modal-cliente');
    document.getElementById('cli-nome').value = '';
    document.getElementById('cli-doc').value = '';
    document.getElementById('cli-tel').value = '';
    await carregarClientes();
  } catch (err) {
    exibirAlerta('danger', 'Erro ao salvar cliente: ' + err.message);
  }
}

// =====================================================================
// ORDENS DE SERVIÇO & DASHBOARD
// =====================================================================
async function carregarOrdensServico() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('os')
      .select('*, clientes(nomeCliente, documento, telefone, email)')
      .order('idOs', { ascending: false });

    if (error) throw error;
    listaOs = data || [];
    renderizarTabelaOs();
    atualizarDashboard();
  } catch (err) {
    console.error('Erro ao listar OS:', err);
  }
}

function renderizarTabelaOs() {
  const tbody = document.getElementById('tabela-os-corpo');
  if (!tbody) return;

  if (listaOs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-slate-400">Nenhuma Ordem de Serviço cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = listaOs.map(os => {
    const nomeCliente = os.clientes ? os.clientes.nomeCliente : 'Cliente não informado';
    const totalFormatado = Number(os.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const dataInicial = os.dataInicial ? new Date(os.dataInicial).toLocaleDateString('pt-BR') : '-';
    
    // Status badges no padrão do design system v5
    let statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    if (os.status === 'Finalizado') statusClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    if (os.status === 'Cancelado') statusClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    if (os.status === 'Aberto') statusClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
        <td class="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">#${os.idOs}</td>
        <td class="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">${nomeCliente}</td>
        <td class="px-6 py-4 text-xs text-slate-500">${dataInicial}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}">
            ${os.status || 'Aberto'}
          </span>
        </td>
        <td class="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">${totalFormatado}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="imprimirOs(${os.idOs})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-slate-950 rounded-lg text-xs font-semibold transition" title="Imprimir OS oficial com CPF do emitente">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> Imprimir OS
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function atualizarDashboard() {
  const kpiClientes = document.getElementById('kpi-clientes');
  const kpiAbertas = document.getElementById('kpi-os-abertas');
  const kpiFinalizadas = document.getElementById('kpi-os-finalizadas');
  const kpiReceita = document.getElementById('kpi-receita');

  if (kpiClientes) kpiClientes.innerText = listaClientes.length;
  
  const abertas = listaOs.filter(o => o.status === 'Aberto' || o.status === 'Em Andamento').length;
  const finalizadas = listaOs.filter(o => o.status === 'Finalizado').length;
  const receita = listaOs.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);

  if (kpiAbertas) kpiAbertas.innerText = abertas;
  if (kpiFinalizadas) kpiFinalizadas.innerText = finalizadas;
  if (kpiReceita) kpiReceita.innerText = receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Tabela de OS recentes no dashboard
  const tbodyDash = document.getElementById('tabela-dashboard-os');
  if (tbodyDash) {
    const recentes = listaOs.slice(0, 5);
    if (recentes.length === 0) {
      tbodyDash.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Nenhuma ordem de serviço cadastrada.</td></tr>`;
    } else {
      tbodyDash.innerHTML = recentes.map(os => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
          <td class="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">#${os.idOs}</td>
          <td class="py-3 px-4">${os.clientes ? os.clientes.nomeCliente : '-'}</td>
          <td class="py-3 px-4 text-xs text-slate-500">${os.descricaoProduto || '-'}</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">${os.status}</span></td>
          <td class="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">${Number(os.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
      `).join('');
    }
  }
}

function abrirModalNovaOs() {
  if (!supabaseClient) {
    exibirAlerta('warning', 'Conecte ao Supabase primeiro para cadastrar OS.');
    return;
  }
  document.getElementById('modal-os').classList.remove('hidden');
}

async function salvarNovaOs(event) {
  event.preventDefault();

  const clienteId = document.getElementById('os-cliente').value;
  const produto = document.getElementById('os-produto').value.trim();
  const defeito = document.getElementById('os-defeito').value.trim();
  const status = document.getElementById('os-status').value;
  const valor = parseFloat(document.getElementById('os-valor').value || '0');

  const novaOs = {
    clientes_id: parseInt(clienteId),
    usuarios_id: 1, // ID do administrador Felipe Monteiro
    descricaoProduto: produto,
    defeito: defeito,
    status: status,
    valorTotal: valor,
    dataInicial: new Date().toISOString().split('T')[0],
    faturado: 0
  };

  try {
    const { error } = await supabaseClient.from('os').insert([novaOs]);
    if (error) throw error;

    exibirAlerta('success', 'Ordem de Serviço criada com sucesso!');
    fecharModal('modal-os');
    document.getElementById('os-produto').value = '';
    document.getElementById('os-defeito').value = '';
    document.getElementById('os-valor').value = '';
    await carregarOrdensServico();
  } catch (err) {
    exibirAlerta('danger', 'Erro ao salvar OS: ' + err.message);
  }
}

// =====================================================================
// IMPRESSÃO DE ORDEM DE SERVIÇO COM CABEÇALHO EM CPF
// =====================================================================
function imprimirOs(idOs) {
  const os = listaOs.find(item => item.idOs === idOs);
  if (!os) return;

  const emitente = emitenteAtual || {
    nome: 'Felipe Monteiro',
    cnpj: '000.000.000-00',
    telefone: '',
    email: 'felipe01sigma@gmail.com',
    rua: '',
    cidade: '',
    uf: ''
  };

  // Preenche dados do emitente com CPF explícito
  document.getElementById('print-emitente-nome').innerText = emitente.nome || 'FELIPE MONTEIRO';
  document.getElementById('print-emitente-cpf').innerText = `CPF: ${emitente.cnpj || '000.000.000-00'}`;
  document.getElementById('print-emitente-endereco').innerText = `${emitente.rua || ''} ${emitente.numero || ''} - ${emitente.bairro || ''} - ${emitente.cidade || ''}/${emitente.uf || ''}`;
  document.getElementById('print-emitente-contato').innerText = `Tel: ${emitente.telefone || '-'} | E-mail: ${emitente.email || '-'}`;

  // Preenche dados da OS
  document.getElementById('print-os-numero').innerText = `ORDEM DE SERVIÇO Nº ${os.idOs}`;
  document.getElementById('print-data-emissao').innerText = new Date().toLocaleDateString('pt-BR');
  document.getElementById('print-os-status').innerText = os.status || 'Aberto';

  // Preenche dados do Cliente
  const cliente = os.clientes || {};
  document.getElementById('print-cli-nome').innerText = cliente.nomeCliente || 'Não informado';
  document.getElementById('print-cli-doc').innerText = cliente.documento || '-';
  document.getElementById('print-cli-tel').innerText = cliente.telefone || '-';
  document.getElementById('print-cli-email').innerText = cliente.email || '-';

  // Detalhes
  document.getElementById('print-os-equipamento').innerText = os.descricaoProduto || 'Não informado';
  document.getElementById('print-os-defeito').innerText = os.defeito || 'Sem observações adicionais.';
  document.getElementById('print-os-total').innerText = Number(os.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Assinatura com CPF do prestador
  document.getElementById('print-ass-emitente').innerText = emitente.nome || 'FELIPE MONTEIRO';
  document.getElementById('print-ass-emitente-cpf').innerText = `CPF: ${emitente.cnpj || '000.000.000-00'}`;

  // Exibe a área de impressão e chama a impressão do navegador
  const area = document.getElementById('area-impressao');
  area.classList.remove('hidden');
  window.print();
  area.classList.add('hidden');
}

// Utilitários de Interface
function fecharModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function exibirAlerta(tipo, mensagem) {
  const alerta = document.getElementById('alerta-global');
  if (!alerta) return;

  alerta.className = `mb-6 p-4 rounded-xl border flex items-center justify-between text-xs transition-all shadow-sm`;

  if (tipo === 'success') {
    alerta.classList.add('bg-emerald-50', 'dark:bg-emerald-950/60', 'border-emerald-200', 'dark:border-emerald-800', 'text-emerald-800', 'dark:text-emerald-200');
  } else if (tipo === 'warning') {
    alerta.classList.add('bg-amber-50', 'dark:bg-amber-950/60', 'border-amber-200', 'dark:border-amber-800', 'text-amber-800', 'dark:text-amber-200');
  } else {
    alerta.classList.add('bg-rose-50', 'dark:bg-rose-950/60', 'border-rose-200', 'dark:border-rose-800', 'text-rose-800', 'dark:text-rose-200');
  }

  alerta.innerHTML = `
    <span class="font-medium">${mensagem}</span>
    <button onclick="this.parentElement.classList.add('hidden')" class="font-bold opacity-70 hover:opacity-100 ml-4">&times;</button>
  `;
  alerta.classList.remove('hidden');

  setTimeout(() => {
    alerta.classList.add('hidden');
  }, 7000);
}

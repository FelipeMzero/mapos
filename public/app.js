// =====================================================================
// Map-OS Web - Lógica da Aplicação com Supabase BaaS
// =====================================================================

let supabaseClient = null;
let emitenteAtual = null;
let listaClientes = [];
let listaOs = [];

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  carregarConfiguracoesLocais();
});

// Navegação entre Abas
function trocarAba(aba) {
  const abas = ['os', 'clientes', 'emitente', 'config'];
  abas.forEach(nome => {
    const elSecao = document.getElementById(`secao-${nome}`);
    const elTab = document.getElementById(`tab-${nome}`);
    if (nome === aba) {
      elSecao.classList.remove('hidden');
      elTab.classList.add('tab-active');
    } else {
      elSecao.classList.add('hidden');
      elTab.classList.remove('tab-active');
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

// Carregar Configurações e Inicializar Supabase
function carregarConfiguracoesLocais() {
  const url = localStorage.getItem('mapos_supabase_url');
  const key = localStorage.getItem('mapos_supabase_key');

  if (url && key) {
    document.getElementById('supabase-url').value = url;
    document.getElementById('supabase-key').value = key;
    conectarSupabase(url, key);
  } else {
    atualizarStatusConexao(false, 'Supabase não configurado');
    // Carregar dados locais de emitente se houver
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
    } else {
      atualizarStatusConexao(false, 'Erro ao carregar SDK do Supabase');
    }
  } catch (err) {
    atualizarStatusConexao(false, 'Falha nas credenciais');
    exibirAlerta('danger', 'Erro ao inicializar cliente Supabase: ' + err.message);
  }
}

async function testarConexaoSupabase(silencioso = false) {
  if (!supabaseClient) {
    exibirAlerta('warning', 'Configure a URL e a Anon Key do Supabase primeiro.');
    return;
  }

  atualizarStatusConexao(false, 'Conectando...', true);

  try {
    // Tenta consultar a tabela emitente ou configuracoes
    const { data, error } = await supabaseClient.from('emitente').select('count', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    atualizarStatusConexao(true, 'Conectado ao Supabase');
    if (!silencioso) exibirAlerta('success', 'Conexão com o Supabase estabelecida com sucesso!');
    
    // Carregar dados das tabelas
    await carregarEmitente();
    await carregarClientes();
    await carregarOrdensServico();
  } catch (err) {
    atualizarStatusConexao(false, 'Erro de Conexão');
    if (!silencioso) {
      exibirAlerta('danger', 'Erro ao conectar no Supabase: ' + (err.message || 'Verifique se executou o script supabase_schema.sql no SQL Editor.'));
    }
  }
}

function atualizarStatusConexao(conectado, texto, conectando = false) {
  const dot = document.getElementById('dot-conexao');
  const txt = document.getElementById('texto-conexao');

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
// EMITENTE (CPF)
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
    console.error('Erro ao buscar CEP', e);
  }
}

async function carregarEmitente() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('emitente').select('*').limit(1).single();
      if (data) {
        emitenteAtual = data;
        preencherFormEmitente(data);
        localStorage.setItem('mapos_emitente_cache', JSON.stringify(data));
        return;
      }
    } catch (e) {
      console.log('Nenhum emitente salvo ainda no Supabase');
    }
  }
  carregarEmitenteLocal();
}

function carregarEmitenteLocal() {
  const salvo = localStorage.getItem('mapos_emitente_cache');
  if (salvo) {
    try {
      emitenteAtual = JSON.parse(salvo);
      preencherFormEmitente(emitenteAtual);
    } catch (e) {}
  }
}

function preencherFormEmitente(dados) {
  document.getElementById('emitente-nome').value = dados.nome || '';
  document.getElementById('emitente-cpf').value = dados.cnpj || '';
  document.getElementById('emitente-telefone').value = dados.telefone || '';
  document.getElementById('emitente-email').value = dados.email || '';
  document.getElementById('emitente-cep').value = dados.cep || '';
  document.getElementById('emitente-numero').value = dados.numero || '';
  document.getElementById('emitente-rua').value = dados.rua || '';
  document.getElementById('emitente-bairro').value = dados.bairro || '';
  document.getElementById('emitente-cidade').value = dados.cidade || '';
  document.getElementById('emitente-uf').value = dados.uf || '';
  document.getElementById('emitente-logo').value = dados.url_logo || '';
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
      // Verifica se já existe um emitente para atualizar ou inserir
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
      exibirAlerta('success', 'Dados do emitente (CPF) salvos no Supabase com sucesso!');
    } catch (err) {
      exibirAlerta('danger', 'Salvo localmente, mas erro ao sincronizar no Supabase: ' + err.message);
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
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
  }
}

function renderizarTabelaClientes() {
  const tbody = document.getElementById('tabela-clientes-corpo');
  if (listaClientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Nenhum cliente cadastrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = listaClientes.map(c => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-6 py-3.5 font-medium text-slate-900">${c.nomeCliente}</td>
      <td class="px-6 py-3.5 font-mono text-xs">${c.documento || '-'}</td>
      <td class="px-6 py-3.5">${c.telefone || '-'}</td>
      <td class="px-6 py-3.5">${c.email || '-'}</td>
      <td class="px-6 py-3.5 text-slate-500">${c.cidade ? `${c.cidade}/${c.estado}` : '-'}</td>
    </tr>
  `).join('');
}

function atualizarSelectClientes() {
  const select = document.getElementById('os-cliente');
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
    const { data, error } = await supabaseClient.from('clientes').insert([novo]).select();
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
// ORDENS DE SERVIÇO
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
  } catch (err) {
    console.error('Erro ao listar OSs:', err);
  }
}

function renderizarTabelaOs() {
  const tbody = document.getElementById('tabela-os-corpo');
  if (listaOs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-slate-400">Nenhuma Ordem de Serviço cadastrada ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = listaOs.map(os => {
    const nomeCliente = os.clientes ? os.clientes.nomeCliente : 'Cliente não informado';
    const totalFormatado = Number(os.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const dataInicial = os.dataInicial ? new Date(os.dataInicial).toLocaleDateString('pt-BR') : '-';

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-6 py-4 font-mono font-bold text-slate-900">#${os.idOs}</td>
        <td class="px-6 py-4 font-medium text-slate-800">${nomeCliente}</td>
        <td class="px-6 py-4 text-xs text-slate-500">${dataInicial}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            ${os.status || 'Aberto'}
          </span>
        </td>
        <td class="px-6 py-4 font-mono font-semibold text-slate-900">${totalFormatado}</td>
        <td class="px-6 py-4 text-right space-x-2">
          <button onclick="imprimirOs(${os.idOs})" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#F37338] hover:text-white rounded-lg text-xs font-semibold transition" title="Imprimir OS com CPF do emitente">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i> Imprimir
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
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
    usuarios_id: 1, // ID padrão
    descricaoProduto: produto,
    defeito: defeito,
    status: status,
    valorTotal: valor,
    dataInicial: new Date().toISOString().split('T')[0],
    faturado: 0
  };

  try {
    const { data, error } = await supabaseClient.from('os').insert([novaOs]).select();
    if (error) throw error;

    exibirAlerta('success', 'Ordem de Serviço criada com sucesso!');
    fecharModal('modal-os');
    document.getElementById('os-produto').value = '';
    document.getElementById('os-defeito').value = '';
    document.getElementById('os-valor').value = '';
    await carregarOrdensServico();
  } catch (err) {
    exibirAlerta('danger', 'Erro ao cadastrar OS: ' + err.message);
  }
}

// =====================================================================
// IMPRESSÃO DE OS COM CPF DO EMITENTE
// =====================================================================

function imprimirOs(idOs) {
  const os = listaOs.find(item => item.idOs === idOs);
  if (!os) return;

  const emitente = emitenteAtual || {
    nome: 'Emitente Não Configurado',
    cnpj: '000.000.000-00',
    telefone: '',
    email: '',
    rua: '',
    cidade: '',
    uf: ''
  };

  // Preenche dados do emitente com CPF explícito
  document.getElementById('print-emitente-nome').innerText = emitente.nome || 'NOME DO EMITENTE';
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
  document.getElementById('print-os-defeito').innerText = os.defeito || 'Nenhuma observação registrada.';
  document.getElementById('print-os-total').innerText = Number(os.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Assinatura com CPF
  document.getElementById('print-ass-emitente').innerText = emitente.nome || 'PRESTADOR';
  document.getElementById('print-ass-emitente-cpf').innerText = `CPF: ${emitente.cnpj || '000.000.000-00'}`;

  // Exibe a área de impressão e chama window.print()
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
  alerta.className = `mb-6 p-4 rounded-xl border flex items-center justify-between text-sm transition-all`;

  if (tipo === 'success') {
    alerta.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-800');
  } else if (tipo === 'warning') {
    alerta.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-800');
  } else {
    alerta.classList.add('bg-rose-50', 'border-rose-200', 'text-rose-800');
  }

  alerta.innerHTML = `
    <span>${mensagem}</span>
    <button onclick="this.parentElement.classList.add('hidden')" class="font-bold opacity-70 hover:opacity-100">&times;</button>
  `;
  alerta.classList.remove('hidden');

  setTimeout(() => {
    alerta.classList.add('hidden');
  }, 7000);
}

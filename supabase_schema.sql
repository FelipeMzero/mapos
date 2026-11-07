-- =====================================================================
-- MAP-OS v5.3.0 - SCHEMA PARA POSTGRESQL / SUPABASE (BaaS)
-- =====================================================================
-- Instruções:
-- 1. Acesse o painel do Supabase (https://app.supabase.com)
-- 2. Selecione seu projeto e vá em "SQL Editor"
-- 3. Cole o conteúdo deste arquivo e clique em "Run"
-- =====================================================================

-- Extensão pgcrypto para hash de senhas e geração de UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------
-- Tabela: ci_sessions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ci_sessions (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    timestamp BIGINT DEFAULT 0 NOT NULL,
    data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ci_sessions_timestamp ON ci_sessions (timestamp);

-- -----------------------------------------------------
-- Tabela: clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    "idClientes" SERIAL PRIMARY KEY,
    asaas_id VARCHAR(255) DEFAULT NULL,
    "nomeCliente" VARCHAR(255) NOT NULL,
    sexo VARCHAR(20) DEFAULT NULL,
    pessoa_fisica BOOLEAN NOT NULL DEFAULT TRUE,
    documento VARCHAR(20) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    celular VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(200) NOT NULL,
    "dataCadastro" DATE DEFAULT CURRENT_DATE,
    rua VARCHAR(70) DEFAULT NULL,
    numero VARCHAR(15) DEFAULT NULL,
    bairro VARCHAR(45) DEFAULT NULL,
    cidade VARCHAR(45) DEFAULT NULL,
    estado VARCHAR(20) DEFAULT NULL,
    cep VARCHAR(20) DEFAULT NULL,
    contato VARCHAR(45) DEFAULT NULL,
    complemento VARCHAR(45) DEFAULT NULL,
    fornecedor BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes (documento);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes (email);

-- -----------------------------------------------------
-- Tabela: resets_de_senha
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS resets_de_senha (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL,
    token VARCHAR(255) NOT NULL,
    data_expiracao TIMESTAMP NOT NULL,
    token_utilizado SMALLINT NOT NULL DEFAULT 0
);

-- -----------------------------------------------------
-- Tabela: categorias
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    "idCategorias" SERIAL PRIMARY KEY,
    categoria VARCHAR(80) DEFAULT NULL,
    cadastro DATE DEFAULT CURRENT_DATE,
    status SMALLINT DEFAULT 1,
    tipo VARCHAR(15) DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: contas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS contas (
    "idContas" SERIAL PRIMARY KEY,
    conta VARCHAR(45) DEFAULT NULL,
    banco VARCHAR(45) DEFAULT NULL,
    numero VARCHAR(45) DEFAULT NULL,
    saldo NUMERIC(10,2) DEFAULT 0.00,
    cadastro DATE DEFAULT CURRENT_DATE,
    status SMALLINT DEFAULT 1,
    tipo VARCHAR(80) DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: permissoes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS permissoes (
    "idPermissao" SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    permissoes TEXT DEFAULT NULL,
    situacao SMALLINT DEFAULT 1,
    data DATE DEFAULT CURRENT_DATE
);

-- -----------------------------------------------------
-- Tabela: usuarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    "idUsuarios" SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    rg VARCHAR(20) DEFAULT NULL,
    cpf VARCHAR(20) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    rua VARCHAR(70) DEFAULT NULL,
    numero VARCHAR(15) DEFAULT NULL,
    bairro VARCHAR(45) DEFAULT NULL,
    cidade VARCHAR(45) DEFAULT NULL,
    estado VARCHAR(20) DEFAULT NULL,
    email VARCHAR(80) NOT NULL,
    senha VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    celular VARCHAR(20) DEFAULT NULL,
    situacao SMALLINT NOT NULL DEFAULT 1,
    "dataCadastro" DATE NOT NULL DEFAULT CURRENT_DATE,
    permissoes_id INT NOT NULL REFERENCES permissoes("idPermissao") ON DELETE RESTRICT ON UPDATE CASCADE,
    "dataExpiracao" DATE DEFAULT NULL,
    url_image_user VARCHAR(255) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_usuarios_permissoes ON usuarios (permissoes_id);

-- -----------------------------------------------------
-- Tabela: lancamentos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lancamentos (
    "idLancamentos" SERIAL PRIMARY KEY,
    descricao VARCHAR(255) DEFAULT NULL,
    valor NUMERIC(10, 2) DEFAULT 0.00,
    desconto NUMERIC(10, 2) DEFAULT 0.00,
    valor_desconto NUMERIC(10, 2) DEFAULT 0.00,
    tipo_desconto VARCHAR(8) DEFAULT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE DEFAULT NULL,
    baixado SMALLINT DEFAULT 0,
    cliente_fornecedor VARCHAR(255) DEFAULT NULL,
    forma_pgto VARCHAR(100) DEFAULT NULL,
    tipo VARCHAR(45) DEFAULT NULL,
    anexo VARCHAR(250) DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    clientes_id INT REFERENCES clientes("idClientes") ON DELETE SET NULL ON UPDATE CASCADE,
    categorias_id INT REFERENCES categorias("idCategorias") ON DELETE SET NULL ON UPDATE CASCADE,
    contas_id INT REFERENCES contas("idContas") ON DELETE SET NULL ON UPDATE CASCADE,
    vendas_id INT DEFAULT NULL,
    usuarios_id INT NOT NULL REFERENCES usuarios("idUsuarios") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lancamentos_clientes ON lancamentos (clientes_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categorias ON lancamentos (categorias_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contas ON lancamentos (contas_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_usuarios ON lancamentos (usuarios_id);

-- -----------------------------------------------------
-- Tabela: garantias
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS garantias (
    "idGarantias" SERIAL PRIMARY KEY,
    "dataGarantia" DATE DEFAULT CURRENT_DATE,
    "refGarantia" VARCHAR(15) DEFAULT NULL,
    "textoGarantia" TEXT DEFAULT NULL,
    usuarios_id INT REFERENCES usuarios("idUsuarios") ON DELETE SET NULL ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: os
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS os (
    "idOs" SERIAL PRIMARY KEY,
    "dataInicial" DATE DEFAULT NULL,
    "dataFinal" DATE DEFAULT NULL,
    garantia VARCHAR(45) DEFAULT NULL,
    "descricaoProduto" TEXT DEFAULT NULL,
    defeito TEXT DEFAULT NULL,
    status VARCHAR(45) DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    "laudoTecnico" TEXT DEFAULT NULL,
    "valorTotal" NUMERIC(10, 2) DEFAULT 0.00,
    desconto NUMERIC(10, 2) DEFAULT 0.00,
    valor_desconto NUMERIC(10, 2) DEFAULT 0.00,
    tipo_desconto VARCHAR(8) DEFAULT NULL,
    clientes_id INT NOT NULL REFERENCES clientes("idClientes") ON DELETE RESTRICT ON UPDATE CASCADE,
    usuarios_id INT NOT NULL REFERENCES usuarios("idUsuarios") ON DELETE RESTRICT ON UPDATE CASCADE,
    lancamento INT REFERENCES lancamentos("idLancamentos") ON DELETE SET NULL ON UPDATE CASCADE,
    faturado SMALLINT NOT NULL DEFAULT 0,
    garantias_id INT REFERENCES garantias("idGarantias") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_os_clientes ON os (clientes_id);
CREATE INDEX IF NOT EXISTS idx_os_usuarios ON os (usuarios_id);
CREATE INDEX IF NOT EXISTS idx_os_lancamento ON os (lancamento);
CREATE INDEX IF NOT EXISTS idx_os_status ON os (status);

-- -----------------------------------------------------
-- Tabela: produtos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
    "idProdutos" SERIAL PRIMARY KEY,
    "codDeBarra" VARCHAR(70) NOT NULL,
    descricao VARCHAR(80) NOT NULL,
    unidade VARCHAR(10) DEFAULT NULL,
    "precoCompra" NUMERIC(10,2) DEFAULT NULL,
    "precoVenda" NUMERIC(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    "estoqueMinimo" INT DEFAULT NULL,
    saida SMALLINT DEFAULT NULL,
    entrada SMALLINT DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: produtos_os
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos_os (
    "idProdutos_os" SERIAL PRIMARY KEY,
    quantidade INT NOT NULL,
    descricao VARCHAR(80) DEFAULT NULL,
    preco NUMERIC(10,2) DEFAULT 0.00,
    os_id INT NOT NULL REFERENCES os("idOs") ON DELETE CASCADE ON UPDATE CASCADE,
    produtos_id INT NOT NULL REFERENCES produtos("idProdutos") ON DELETE RESTRICT ON UPDATE CASCADE,
    "subTotal" NUMERIC(10,2) DEFAULT 0.00
);

-- -----------------------------------------------------
-- Tabela: servicos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS servicos (
    "idServicos" SERIAL PRIMARY KEY,
    nome VARCHAR(45) NOT NULL,
    descricao VARCHAR(45) DEFAULT NULL,
    preco NUMERIC(10,2) NOT NULL
);

-- -----------------------------------------------------
-- Tabela: servicos_os
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS servicos_os (
    "idServicos_os" SERIAL PRIMARY KEY,
    servico VARCHAR(80) DEFAULT NULL,
    quantidade DOUBLE PRECISION DEFAULT 1,
    preco NUMERIC(10,2) DEFAULT 0.00,
    os_id INT NOT NULL REFERENCES os("idOs") ON DELETE CASCADE ON UPDATE CASCADE,
    servicos_id INT NOT NULL REFERENCES servicos("idServicos") ON DELETE RESTRICT ON UPDATE CASCADE,
    "subTotal" NUMERIC(10,2) DEFAULT 0.00
);

-- -----------------------------------------------------
-- Tabela: vendas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS vendas (
    "idVendas" SERIAL PRIMARY KEY,
    "dataVenda" DATE DEFAULT CURRENT_DATE,
    "valorTotal" NUMERIC(10, 2) DEFAULT 0.00,
    desconto NUMERIC(10, 2) DEFAULT 0.00,
    valor_desconto NUMERIC(10, 2) DEFAULT 0.00,
    tipo_desconto VARCHAR(8) DEFAULT NULL,
    faturado SMALLINT DEFAULT 0,
    observacoes TEXT DEFAULT NULL,
    observacoes_cliente TEXT DEFAULT NULL,
    clientes_id INT NOT NULL REFERENCES clientes("idClientes") ON DELETE RESTRICT ON UPDATE CASCADE,
    usuarios_id INT REFERENCES usuarios("idUsuarios") ON DELETE SET NULL ON UPDATE CASCADE,
    lancamentos_id INT REFERENCES lancamentos("idLancamentos") ON DELETE SET NULL ON UPDATE CASCADE,
    status VARCHAR(45) DEFAULT NULL,
    garantia INT DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: cobrancas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS cobrancas (
    "idCobranca" SERIAL PRIMARY KEY,
    charge_id VARCHAR(255) DEFAULT NULL,
    conditional_discount_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    custom_id INT DEFAULT NULL,
    expire_at DATE NOT NULL,
    message VARCHAR(255) NOT NULL,
    payment_method VARCHAR(11) DEFAULT NULL,
    payment_url VARCHAR(255) DEFAULT NULL,
    request_delivery_address VARCHAR(64) DEFAULT NULL,
    status VARCHAR(36) NOT NULL,
    total VARCHAR(15) DEFAULT NULL,
    barcode VARCHAR(255) NOT NULL,
    link VARCHAR(255) NOT NULL,
    payment_gateway VARCHAR(255) DEFAULT NULL,
    payment VARCHAR(64) NOT NULL,
    pdf VARCHAR(255) DEFAULT NULL,
    vendas_id INT REFERENCES vendas("idVendas") ON DELETE SET NULL ON UPDATE CASCADE,
    os_id INT REFERENCES os("idOs") ON DELETE SET NULL ON UPDATE CASCADE,
    clientes_id INT REFERENCES clientes("idClientes") ON DELETE SET NULL ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: itens_de_vendas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_de_vendas (
    "idItens" SERIAL PRIMARY KEY,
    "subTotal" NUMERIC(10,2) DEFAULT 0.00,
    quantidade INT DEFAULT 1,
    preco NUMERIC(10,2) DEFAULT 0.00,
    vendas_id INT NOT NULL REFERENCES vendas("idVendas") ON DELETE CASCADE ON UPDATE CASCADE,
    produtos_id INT NOT NULL REFERENCES produtos("idProdutos") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: anexos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS anexos (
    "idAnexos" SERIAL PRIMARY KEY,
    anexo VARCHAR(45) DEFAULT NULL,
    thumb VARCHAR(45) DEFAULT NULL,
    url VARCHAR(300) DEFAULT NULL,
    path VARCHAR(300) DEFAULT NULL,
    os_id INT NOT NULL REFERENCES os("idOs") ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: documentos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
    "idDocumentos" SERIAL PRIMARY KEY,
    documento VARCHAR(70) DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    file VARCHAR(100) DEFAULT NULL,
    path VARCHAR(300) DEFAULT NULL,
    url VARCHAR(300) DEFAULT NULL,
    cadastro DATE DEFAULT CURRENT_DATE,
    categoria VARCHAR(80) DEFAULT NULL,
    tipo VARCHAR(15) DEFAULT NULL,
    tamanho VARCHAR(45) DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: marcas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS marcas (
    "idMarcas" SERIAL PRIMARY KEY,
    marca VARCHAR(100) DEFAULT NULL,
    cadastro DATE DEFAULT CURRENT_DATE,
    situacao SMALLINT DEFAULT 1
);

-- -----------------------------------------------------
-- Tabela: equipamentos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS equipamentos (
    "idEquipamentos" SERIAL PRIMARY KEY,
    equipamento VARCHAR(150) NOT NULL,
    num_serie VARCHAR(80) DEFAULT NULL,
    modelo VARCHAR(80) DEFAULT NULL,
    cor VARCHAR(45) DEFAULT NULL,
    descricao VARCHAR(150) DEFAULT NULL,
    tensao VARCHAR(45) DEFAULT NULL,
    potencia VARCHAR(45) DEFAULT NULL,
    voltagem VARCHAR(45) DEFAULT NULL,
    data_fabricacao DATE DEFAULT NULL,
    marcas_id INT REFERENCES marcas("idMarcas") ON DELETE SET NULL ON UPDATE CASCADE,
    clientes_id INT REFERENCES clientes("idClientes") ON DELETE SET NULL ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: equipamentos_os
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS equipamentos_os (
    "idEquipamentos_os" SERIAL PRIMARY KEY,
    defeito_declarado VARCHAR(200) DEFAULT NULL,
    defeito_encontrado VARCHAR(200) DEFAULT NULL,
    solucao VARCHAR(45) DEFAULT NULL,
    equipamentos_id INT REFERENCES equipamentos("idEquipamentos") ON DELETE SET NULL ON UPDATE CASCADE,
    os_id INT REFERENCES os("idOs") ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS logs (
    "idLogs" SERIAL PRIMARY KEY,
    usuario VARCHAR(80) DEFAULT NULL,
    tarefa VARCHAR(100) DEFAULT NULL,
    data DATE DEFAULT CURRENT_DATE,
    hora TIME DEFAULT CURRENT_TIME,
    ip VARCHAR(45) DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: emitente (com suporte nativo a CPF ou CNPJ)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS emitente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) DEFAULT NULL,
    cnpj VARCHAR(45) DEFAULT NULL, -- Guarda CPF ou CNPJ do emitente
    tipo_documento VARCHAR(10) DEFAULT 'CPF', -- Indicador explícito: CPF ou CNPJ
    ie VARCHAR(50) DEFAULT NULL,
    rua VARCHAR(70) DEFAULT NULL,
    numero VARCHAR(15) DEFAULT NULL,
    bairro VARCHAR(45) DEFAULT NULL,
    cidade VARCHAR(45) DEFAULT NULL,
    uf VARCHAR(20) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    url_logo VARCHAR(225) DEFAULT NULL,
    cep VARCHAR(20) DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: email_queue
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    "to" VARCHAR(255) NOT NULL,
    cc VARCHAR(255) DEFAULT NULL,
    bcc VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    headers TEXT DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: anotacoes_os
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS anotacoes_os (
    "idAnotacoes" SERIAL PRIMARY KEY,
    anotacao VARCHAR(255) NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    os_id INT NOT NULL REFERENCES os("idOs") ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela: configuracoes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracoes (
    "idConfig" SERIAL PRIMARY KEY,
    config VARCHAR(50) NOT NULL UNIQUE,
    valor TEXT DEFAULT NULL
);

-- -----------------------------------------------------
-- Tabela: migrations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
    version BIGINT NOT NULL
);

-- =====================================================================
-- DADOS INICIAIS / SEEDS
-- =====================================================================

INSERT INTO configuracoes (config, valor) VALUES
('app_name', 'Map-OS'),
('app_theme', 'white'),
('per_page', '10'),
('os_notification', 'cliente'),
('control_estoque', '1'),
('notifica_whats', 'Prezado(a), {CLIENTE_NOME} a OS de nº {NUMERO_OS} teve o status alterado para: {STATUS_OS} segue a descrição {DESCRI_PRODUTOS} com valor total de {VALOR_OS}! Para mais informações entre em contato conosco. Atenciosamente, {EMITENTE} {TELEFONE_EMITENTE}.'),
('control_baixa', '0'),
('control_editos', '1'),
('control_datatable', '1'),
('pix_key', ''),
('os_status_list', '["Aberto","Faturado","Negociação","Em Andamento","Orçamento","Finalizado","Cancelado","Aguardando Peças","Aprovado"]'),
('control_edit_vendas', '1'),
('email_automatico', '1'),
('control_2vias', '0')
ON CONFLICT (config) DO NOTHING;

INSERT INTO permissoes ("idPermissao", nome, permissoes, situacao, data) VALUES
(1, 'Administrador', 'a:53:{s:8:"aCliente";s:1:"1";s:8:"eCliente";s:1:"1";s:8:"dCliente";s:1:"1";s:8:"vCliente";s:1:"1";s:8:"aProduto";s:1:"1";s:8:"eProduto";s:1:"1";s:8:"dProduto";s:1:"1";s:8:"vProduto";s:1:"1";s:8:"aServico";s:1:"1";s:8:"eServico";s:1:"1";s:8:"dServico";s:1:"1";s:8:"vServico";s:1:"1";s:3:"aOs";s:1:"1";s:3:"eOs";s:1:"1";s:3:"dOs";s:1:"1";s:3:"vOs";s:1:"1";s:6:"aVenda";s:1:"1";s:6:"eVenda";s:1:"1";s:6:"dVenda";s:1:"1";s:6:"vVenda";s:1:"1";s:9:"aGarantia";s:1:"1";s:9:"eGarantia";s:1:"1";s:9:"dGarantia";s:1:"1";s:9:"vGarantia";s:1:"1";s:8:"aArquivo";s:1:"1";s:8:"eArquivo";s:1:"1";s:8:"dArquivo";s:1:"1";s:8:"vArquivo";s:1:"1";s:10:"aPagamento";N;s:10:"ePagamento";N;s:10:"dPagamento";N;s:10:"vPagamento";N;s:11:"aLancamento";s:1:"1";s:11:"eLancamento";s:1:"1";s:11:"dLancamento";s:1:"1";s:11:"vLancamento";s:1:"1";s:8:"cUsuario";s:1:"1";s:9:"cEmitente";s:1:"1";s:10:"cPermissao";s:1:"1";s:7:"cBackup";s:1:"1";s:10:"cAuditoria";s:1:"1";s:6:"cEmail";s:1:"1";s:8:"cSistema";s:1:"1";s:8:"rCliente";s:1:"1";s:8:"rProduto";s:1:"1";s:8:"rServico";s:1:"1";s:3:"rOs";s:1:"1";s:6:"rVenda";s:1:"1";s:11:"rFinanceiro";s:1:"1";s:9:"aCobranca";s:1:"1";s:9:"eCobranca";s:1:"1";s:9:"dCobranca";s:1:"1";s:9:"vCobranca";s:1:"1";}', 1, CURRENT_DATE)
ON CONFLICT ("idPermissao") DO NOTHING;

INSERT INTO migrations (version) VALUES (20240503170400);

-- =====================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) PARA SUPABASE BaaS (Opcional/Recomendado)
-- =====================================================================
-- Descomente as linhas abaixo se for consumir via Supabase JS Client / Anon API:
-- ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE os ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE emitente ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Emitente público para leitura" ON emitente FOR SELECT USING (true);

// --- NAVEGAÇÃO ---
function mudarAba(evento, idAbaDestino) {
    const botoesMenu = document.querySelectorAll('.menu-item');
    botoesMenu.forEach(botao => botao.classList.remove('ativo'));
    const telas = document.querySelectorAll('.aba');
    telas.forEach(tela => tela.classList.remove('ativa'));
    if (evento && evento.target && evento.target.classList.contains('menu-item')) {
        evento.target.classList.add('ativo');
    }
    document.getElementById(idAbaDestino).classList.add('ativa');
}

const form = document.getElementById('formFuncionario');
const btnSubmit = document.getElementById('btnSubmit');
let idEditando = null;

// --- FUNÇÕES DO DASHBOARD ---
function formatarDataBR(dataISO) {
    const partes = dataISO.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataISO;
}

function atualizarDashboard(funcionarios) {
    // 1. Contadores
    document.getElementById('contador-funcionarios').innerText = funcionarios.length;
    
    const emFerias = funcionarios.filter(f => f.status === 'Férias').length;
    document.getElementById('contador-ferias').innerText = emFerias;

    // 2. Aniversariantes do Mês Atual
    const dataHoje = new Date();
    // Como os meses no JavaScript começam em 0 (Janeiro = 0), adicionamos +1
    const mesAtual = String(dataHoje.getMonth() + 1).padStart(2, '0'); 
    
    const listaNiver = document.getElementById('lista-aniversariantes');
    listaNiver.innerHTML = '';
    
    let encontrouNiver = false;
    funcionarios.forEach(func => {
        if (func.nascimento) {
            const mesNascimento = func.nascimento.split('-')[1]; // Pega só o mês da data YYYY-MM-DD
            if (mesNascimento === mesAtual) {
                encontrouNiver = true;
                const diaNasc = func.nascimento.split('-')[2];
                listaNiver.innerHTML += `<li>🎈 <strong>Dia ${diaNasc}</strong> - ${func.nome}</li>`;
            }
        }
    });
    if (!encontrouNiver) listaNiver.innerHTML = '<li>Nenhum aniversário este mês.</li>';

    // 3. Prazos Inteligentes (Alerta 5 dias antes)
    const diaHoje = dataHoje.getDate();
    
    const boxEsocial = document.getElementById('alerta-esocial');
    // Se for entre o dia 10 e 15, fica vermelho!
    if (diaHoje >= 10 && diaHoje <= 15) {
        boxEsocial.style.backgroundColor = '#fed7d7';
        boxEsocial.style.color = '#c53030';
        boxEsocial.style.borderLeft = '4px solid #e53e3e';
        boxEsocial.innerHTML = '<strong>⚠️ URGENTE:</strong> Enviar eSocial (Vence dia 15!)';
    } else {
        boxEsocial.style.backgroundColor = '#ebf8fa';
        boxEsocial.style.color = '#234e52';
        boxEsocial.style.borderLeft = '4px solid #38b2ac';
        boxEsocial.innerHTML = '<strong>Dia 15:</strong> Enviar fechamento eSocial';
    }

    const boxFgts = document.getElementById('alerta-fgts');
    // Se for entre o dia 15 e 20, fica vermelho!
    if (diaHoje >= 15 && diaHoje <= 20) {
        boxFgts.style.backgroundColor = '#fed7d7';
        boxFgts.style.color = '#c53030';
        boxFgts.style.borderLeft = '4px solid #e53e3e';
        boxFgts.innerHTML = '<strong>⚠️ URGENTE:</strong> Pagar DARF/FGTS (Vence dia 20!)';
    } else {
        boxFgts.style.backgroundColor = '#ebf8fa';
        boxFgts.style.color = '#234e52';
        boxFgts.style.borderLeft = '4px solid #38b2ac';
        boxFgts.innerHTML = '<strong>Dia 20:</strong> Vencimento DARF / FGTS';
    }
}

// --- LÓGICA DO BLOCO DE NOTAS ---
const blocoNotas = document.getElementById('blocoNotas');
// Quando a página carrega, puxa o texto salvo
blocoNotas.value = localStorage.getItem('notasRH') || '';
// Sempre que você digitar algo, ele salva automaticamente
blocoNotas.addEventListener('input', function() {
    localStorage.setItem('notasRH', this.value);
});


// --- TABELA ---
function atualizarTabela() {
    const tbody = document.querySelector('#tabelaFuncionarios tbody');
    tbody.innerHTML = ''; 

    let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    
    // Atualiza os dados da tela inicial
    atualizarDashboard(funcionariosSalvos);

    funcionariosSalvos.forEach(function(func) {
        const tr = document.createElement('tr');
        
        // Proteção para funcionários antigos que não tinham status cadastrado
        const statusExibicao = func.status || 'Ativo'; 
        const badgeStatus = `<span class="badge badge-${statusExibicao}">${statusExibicao}</span>`;

        tr.innerHTML = `
            <td>${badgeStatus}</td>
            <td><strong>${func.nome}</strong></td>
            <td>${func.cargo}</td>
            <td>${formatarDataBR(func.dataAdmissao)}</td>
            <td>
                <div class="acoes-container">
                    <button class="btn-acao btn-perfil" onclick="verPerfil(${func.id})">Perfil</button>
                    <button class="btn-acao btn-editar" onclick="prepararEdicao(${func.id})">Editar</button>
                    <button class="btn-acao btn-excluir" onclick="excluirFuncionario(${func.id})">Excluir</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function excluirFuncionario(id) {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
        let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
        funcSalvos = funcSalvos.filter(f => f.id !== id);
        localStorage.setItem('listaFuncionarios', JSON.stringify(funcSalvos));
        atualizarTabela();
    }
}

function prepararEdicao(id) {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcSalvos.find(f => f.id === id);

    if (func) {
        document.getElementById('nome').value = func.nome;
        document.getElementById('cpf').value = func.cpf;
        document.getElementById('dataNascimento').value = func.nascimento || ''; // Puxa data nova se tiver
        document.getElementById('dataAdmissao').value = func.dataAdmissao;
        document.getElementById('statusFunc').value = func.status || 'Ativo';
        document.getElementById('departamento').value = func.departamento;
        document.getElementById('cargo').value = func.cargo;
        document.getElementById('salario').value = func.salario;
        
        idEditando = id;
        btnSubmit.textContent = "Salvar Alterações";
        btnSubmit.style.background = "linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)";
        document.querySelectorAll('.menu-item')[1].click();
    }
}

// --- VER PERFIL ---
function verPerfil(id) {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcSalvos.find(f => f.id === id);

    if (func) {
        const conteiner = document.getElementById('conteudo-perfil');
        const salarioBR = parseFloat(func.salario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dataNascFmt = func.nascimento ? formatarDataBR(func.nascimento) : 'Não informado';
        const statusBadge = `<span class="badge badge-${func.status || 'Ativo'}">${func.status || 'Ativo'}</span>`;

        let htmlDocs = '';
        if (func.documentos && func.documentos.rg) {
            htmlDocs += `<div class="doc-item"><span>📄 RG/CPF: <strong>${func.documentos.rg.nome}</strong></span><a href="${func.documentos.rg.base64}" download="${func.documentos.rg.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        }
        if (func.documentos && func.documentos.ctps) {
            htmlDocs += `<div class="doc-item"><span>📄 Carteira de Trabalho: <strong>${func.documentos.ctps.nome}</strong></span><a href="${func.documentos.ctps.base64}" download="${func.documentos.ctps.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        }
        if (htmlDocs === '') htmlDocs = '<p style="color: #a0aec0; margin-top: 10px;">Nenhum documento anexado.</p>';

        conteiner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 5px;">
                <h2 style="font-size: 24px; color: #2b6cb0; margin:0;">${func.nome}</h2>
                ${statusBadge}
            </div>
            <p style="color: #718096; font-size: 16px;">${func.cargo} • Departamento de ${func.departamento}</p>
            <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;">
            <div class="perfil-grid">
                <div class="perfil-info"><strong>CPF</strong><p>${func.cpf}</p></div>
                <div class="perfil-info"><strong>Nascimento</strong><p>${dataNascFmt}</p></div>
                <div class="perfil-info"><strong>Admissão</strong><p>${formatarDataBR(func.dataAdmissao)}</p></div>
                <div class="perfil-info"><strong>Salário Bruto</strong><p>${salarioBR}</p></div>
            </div>
            <div class="area-documentos-perfil">
                <strong style="color: #4a5568;">Arquivos Anexados</strong>
                ${htmlDocs}
            </div>
        `;
        mudarAba(null, 'tela-perfil');
    }
}

function exportarListaCSV() {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    if (funcSalvos.length === 0) return alert("Nenhum funcionário cadastrado.");
    
    // Adicionado os novos campos no CSV (Status e Nascimento)
    let csv = "Status,Nome,CPF,Data de Nascimento,Departamento,Cargo,Data de Admissao,Salario Bruto\n";
    funcSalvos.forEach(f => {
        csv += `"${f.status || 'Ativo'}","${f.nome}","${f.cpf}","${f.nascimento || ''}","${f.departamento}","${f.cargo}","${f.dataAdmissao}","${f.salario}"\n`;
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "lista_funcionarios.csv";
    link.click();
}

function processarArquivo(inputElement) {
    return new Promise((resolve) => {
        if (!inputElement.files || inputElement.files.length === 0) resolve(null);
        else {
            const leitor = new FileReader();
            leitor.onload = (e) => resolve({ nome: inputElement.files[0].name, base64: e.target.result });
            leitor.readAsDataURL(inputElement.files[0]);
        }
    });
}

window.onload = atualizarTabela;

// --- SALVAR DADOS ---
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const nascimento = document.getElementById('dataNascimento').value;
    const dataAdmissao = document.getElementById('dataAdmissao').value;
    const status = document.getElementById('statusFunc').value;
    const departamento = document.getElementById('departamento').value.trim();
    const cargo = document.getElementById('cargo').value.trim();
    const salario = document.getElementById('salario').value;

    const arquivoRG = await processarArquivo(document.getElementById('docRG'));
    const arquivoCTPS = await processarArquivo(document.getElementById('docCTPS'));

    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];

    if (idEditando === null) {
        funcSalvos.push({
            id: Date.now(), nome, cpf, nascimento, dataAdmissao, status, departamento, cargo, salario,
            documentos: { rg: arquivoRG, ctps: arquivoCTPS }
        });
    } else {
        const index = funcSalvos.findIndex(f => f.id === idEditando);
        if (index !== -1) {
            funcSalvos[index].nome = nome;
            funcSalvos[index].cpf = cpf;
            funcSalvos[index].nascimento = nascimento;
            funcSalvos[index].dataAdmissao = dataAdmissao;
            funcSalvos[index].status = status;
            funcSalvos[index].departamento = departamento;
            funcSalvos[index].cargo = cargo;
            funcSalvos[index].salario = salario;
            if (!funcSalvos[index].documentos) funcSalvos[index].documentos = {};
            if (arquivoRG) funcSalvos[index].documentos.rg = arquivoRG;
            if (arquivoCTPS) funcSalvos[index].documentos.ctps = arquivoCTPS;
        }
        idEditando = null;
        btnSubmit.textContent = "Salvar Dados do Funcionário";
        btnSubmit.style.background = "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)";
    }

    localStorage.setItem('listaFuncionarios', JSON.stringify(funcSalvos));
    form.reset();
    atualizarTabela(); 
    document.querySelectorAll('.menu-item')[2].click();
});

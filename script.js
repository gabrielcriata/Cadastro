// --- NOTIFICAÇÕES (TOAST) ---
function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Segurança caso a div não exista
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span>${tipo === 'success' ? '✅' : '⚠️'}</span> ${mensagem}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- MÁSCARAS DE INPUT ---
const inputCPF = document.getElementById('cpf');
if (inputCPF) {
    inputCPF.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = v;
    });
}

const inputSalario = document.getElementById('salario');
if (inputSalario) {
    inputSalario.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        e.target.value = v;
    });
}

// --- NAVEGAÇÃO ---
function mudarAba(evento, idAbaDestino) {
    const botoesMenu = document.querySelectorAll('.menu-item');
    botoesMenu.forEach(botao => botao.classList.remove('ativo'));
    
    const telas = document.querySelectorAll('.aba');
    telas.forEach(tela => tela.classList.remove('ativa'));
    
    if (evento && evento.target && evento.target.classList.contains('menu-item')) {
        evento.target.classList.add('ativo');
    }
    
    const telaDestino = document.getElementById(idAbaDestino);
    if (telaDestino) telaDestino.classList.add('ativa');
}

const form = document.getElementById('formFuncionario');
const btnSubmit = document.getElementById('btnSubmit');
let idEditando = null;

// --- DADOS DO CALENDÁRIO ---
const mesesNomes = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const feriados = {
    "01-01": "Confraternização Universal", "04-21": "Tiradentes", "05-01": "Dia do Trabalho",
    "09-07": "Independência do Brasil", "10-12": "Nossa Sra. Aparecida", "11-02": "Finados",
    "11-15": "Proclamação da República", "12-25": "Natal"
};

let dataAtualCalendario = new Date();
let dataSelecionadaNota = null;

function renderizarCalendario() {
    const mesAnoDisplay = document.getElementById('mes-ano-display');
    const diasGrid = document.getElementById('dias-grid');
    
    if (!mesAnoDisplay || !diasGrid) return; // Previne o erro silencioso

    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();
    
    mesAnoDisplay.innerText = `${mesesNomes[mes]} ${ano}`;
    diasGrid.innerHTML = '';

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();
    const notasSalvas = JSON.parse(localStorage.getItem('notasCalendario')) || {};

    for (let i = 0; i < primeiroDiaSemana; i++) {
        diasGrid.innerHTML += `<div class="dia-cal dia-vazio"></div>`;
    }

    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const dataFormatada = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const mesDiaFormatado = `${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        let classesExtras = '';
        let tituloFerido = '';

        if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) { classesExtras += ' dia-hoje'; }
        if (feriados[mesDiaFormatado]) { classesExtras += ' dia-feriado'; tituloFerido = `title="${feriados[mesDiaFormatado]}"`; }
        if (notasSalvas[dataFormatada] && notasSalvas[dataFormatada].trim() !== '') { classesExtras += ' tem-nota'; }

        diasGrid.innerHTML += `<div class="dia-cal ${classesExtras}" ${tituloFerido} onclick="abrirNotasDia('${dataFormatada}', ${dia})">${dia}</div>`;
    }
}

function mudarMes(direcao) {
    dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + direcao);
    fecharNotasDia();
    renderizarCalendario();
}

function abrirNotasDia(dataStr, diaNumero) {
    dataSelecionadaNota = dataStr;
    const mesNome = mesesNomes[dataAtualCalendario.getMonth()];
    
    const painel = document.getElementById('painel-notas-dia');
    const titulo = document.getElementById('titulo-notas-dia');
    const texto = document.getElementById('texto-nota-dia');
    
    if (!painel || !titulo || !texto) return;

    titulo.innerText = `Anotações: ${diaNumero} de ${mesNome}`;
    painel.style.display = 'block';
    
    const notasSalvas = JSON.parse(localStorage.getItem('notasCalendario')) || {};
    texto.value = notasSalvas[dataStr] || '';
}

function fecharNotasDia() {
    const painel = document.getElementById('painel-notas-dia');
    if (painel) painel.style.display = 'none';
    dataSelecionadaNota = null;
}

function salvarNotaDia() {
    if (!dataSelecionadaNota) return;
    const texto = document.getElementById('texto-nota-dia');
    if (!texto) return;
    
    let notasSalvas = JSON.parse(localStorage.getItem('notasCalendario')) || {};
    notasSalvas[dataSelecionadaNota] = texto.value;
    localStorage.setItem('notasCalendario', JSON.stringify(notasSalvas));
    mostrarToast("Anotação salva com sucesso!");
    renderizarCalendario(); 
}

// --- SISTEMA DE BACKUP ---
function exportarBackup() {
    const dados = localStorage.getItem('listaFuncionarios') || '[]';
    const notas = localStorage.getItem('notasCalendario') || '{}';
    const backup = JSON.stringify({ funcionarios: JSON.parse(dados), notas: JSON.parse(notas) });
    
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_rh_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    a.click();
    mostrarToast("Backup exportado com sucesso!");
}

function importarBackup(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if(dados.funcionarios) localStorage.setItem('listaFuncionarios', JSON.stringify(dados.funcionarios));
            if(dados.notas) localStorage.setItem('notasCalendario', JSON.stringify(dados.notas));
            atualizarTabela();
            renderizarCalendario();
            mostrarToast("Dados restaurados com sucesso!");
        } catch (error) {
            mostrarToast("Erro ao ler o arquivo de backup.", "error");
        }
    };
    leitor.readAsText(arquivo);
}

// --- BUSCA NA TABELA ---
function filtrarTabela() {
    const input = document.getElementById('inputBusca');
    if (!input) return;
    
    const busca = input.value.toLowerCase();
    const tbody = document.querySelector('#tabelaFuncionarios tbody');
    if (!tbody) return;

    const linhas = tbody.getElementsByTagName('tr');

    for (let linha of linhas) {
        const textoDaLinha = linha.innerText.toLowerCase();
        if (textoDaLinha.includes(busca)) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    }
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataISO;
}

function atualizarDashboard(funcionarios) {
    const contFunc = document.getElementById('contador-funcionarios');
    if (contFunc) contFunc.innerText = funcionarios.length;

    const contFerias = document.getElementById('contador-ferias');
    if (contFerias) contFerias.innerText = funcionarios.filter(f => f.status === 'Férias').length;

    const listaNiver = document.getElementById('lista-aniversariantes');
    if (listaNiver) {
        const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0'); 
        listaNiver.innerHTML = '';
        
        let encontrouNiver = false;
        funcionarios.forEach(func => {
            if (func.nascimento) {
                if (func.nascimento.split('-')[1] === mesAtual) {
                    encontrouNiver = true;
                    listaNiver.innerHTML += `<li>🎈 <strong>Dia ${func.nascimento.split('-')[2]}</strong> - ${func.nome}</li>`;
                }
            }
        });
        if (!encontrouNiver) listaNiver.innerHTML = '<li>Nenhum aniversário este mês.</li>';
    }
}

function atualizarTabela() {
    const tbody = document.querySelector('#tabelaFuncionarios tbody');
    if (!tbody) return; // Se a tabela não existir no HTML, o JS não trava mais!

    tbody.innerHTML = ''; 

    let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    atualizarDashboard(funcionariosSalvos);

    funcionariosSalvos.forEach(function(func) {
        const tr = document.createElement('tr');
        const statusExibicao = func.status || 'Ativo'; 
        const badgeClass = statusExibicao.replace(/\s+/g, ''); // Resolve problemas com espaços
        const badgeStatus = `<span class="badge badge-${badgeClass}">${statusExibicao}</span>`;

        tr.innerHTML = `
            <td>${badgeStatus}</td>
            <td><strong>${func.nome}</strong><br><small style="color: #718096">${func.cpf || ''}</small></td>
            <td>${func.cargo || ''}</td>
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
        mostrarToast("Funcionário excluído.");
    }
}

function prepararEdicao(id) {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcSalvos.find(f => f.id === id);

    if (func) {
        const setVal = (idEl, val) => { const el = document.getElementById(idEl); if(el) el.value = val; }
        
        setVal('nome', func.nome);
        setVal('cpf', func.cpf);
        setVal('dataNascimento', func.nascimento || '');
        setVal('dataAdmissao', func.dataAdmissao);
        setVal('statusFunc', func.status || 'Ativo');
        setVal('departamento', func.departamento);
        setVal('cargo', func.cargo);
        setVal('salario', func.salario);
        
        idEditando = id;
        if (btnSubmit) btnSubmit.textContent = "✨ Salvar Alterações";
        
        const btnAdmissao = document.querySelectorAll('.menu-item')[1];
        if (btnAdmissao) btnAdmissao.click();
    }
}

function verPerfil(id) {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcSalvos.find(f => f.id === id);

    if (func) {
        const conteiner = document.getElementById('conteudo-perfil');
        if(!conteiner) return;

        const salarioBR = func.salario || 'Não informado'; 
        const dataNascFmt = func.nascimento ? formatarDataBR(func.nascimento) : 'Não informado';
        const statusBadge = `<span class="badge badge-${(func.status || 'Ativo').replace(/\s+/g, '')}">${func.status || 'Ativo'}</span>`;

        let htmlDocs = '';
        if (func.documentos && func.documentos.rg) {
            htmlDocs += `<div class="doc-item"><span>📄 RG/CPF: <strong>${func.documentos.rg.nome}</strong></span><a href="${func.documentos.rg.base64}" download="${func.documentos.rg.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        }
        if (func.documentos && func.documentos.ctps) {
            htmlDocs += `<div class="doc-item"><span>📘 Carteira Trab: <strong>${func.documentos.ctps.nome}</strong></span><a href="${func.documentos.ctps.base64}" download="${func.documentos.ctps.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        }
        if (htmlDocs === '') htmlDocs = '<p style="color: #718096; margin-top: 10px;">Nenhum documento anexado.</p>';

        conteiner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 5px;">
                <h2 style="font-size: 26px; color: #1A202C; margin:0;">${func.nome}</h2>
                ${statusBadge}
            </div>
            <p style="color: #718096; font-size: 16px;">${func.cargo} • Departamento: ${func.departamento}</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
            <div class="perfil-grid">
                <div class="perfil-info"><strong>CPF</strong><p>${func.cpf}</p></div>
                <div class="perfil-info"><strong>Nascimento</strong><p>${dataNascFmt}</p></div>
                <div class="perfil-info"><strong>Admissão</strong><p>${formatarDataBR(func.dataAdmissao)}</p></div>
                <div class="perfil-info"><strong>Salário Bruto</strong><p>${salarioBR}</p></div>
            </div>
            <div class="area-documentos-perfil">
                <strong>Arquivos Anexados</strong>
                ${htmlDocs}
            </div>
        `;
        mudarAba(null, 'tela-perfil');
    }
}

function exportarListaCSV() {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    if (funcSalvos.length === 0) return mostrarToast("Nenhum funcionário cadastrado.", "error");
    
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
        if (!inputElement || !inputElement.files || inputElement.files.length === 0) resolve(null);
        else {
            const leitor = new FileReader();
            leitor.onload = (e) => resolve({ nome: inputElement.files[0].name, base64: e.target.result });
            leitor.readAsDataURL(inputElement.files[0]);
        }
    });
}

window.onload = function() {
    atualizarTabela();
    renderizarCalendario(); 
};

// --- LÓGICA DE SALVAR ---
if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

        const nome = getVal('nome');
        const cpf = getVal('cpf');
        const nascimento = getVal('dataNascimento');
        const dataAdmissao = getVal('dataAdmissao');
        const status = getVal('statusFunc');
        const departamento = getVal('departamento');
        const cargo = getVal('cargo');
        const salario = getVal('salario');

        const arquivoRG = await processarArquivo(document.getElementById('docRG'));
        const arquivoCTPS = await processarArquivo(document.getElementById('docCTPS'));

        let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];

        if (idEditando === null) {
            funcSalvos.push({
                id: Date.now(), nome, cpf, nascimento, dataAdmissao, status, departamento, cargo, salario,
                documentos: { rg: arquivoRG, ctps: arquivoCTPS }
            });
            mostrarToast("Funcionário cadastrado com sucesso!");
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
            if (btnSubmit) btnSubmit.textContent = "✨ Salvar Dados";
            mostrarToast("Dados atualizados com sucesso!");
        }

        localStorage.setItem('listaFuncionarios', JSON.stringify(funcSalvos));
        form.reset();
        atualizarTabela(); 
        
        const btnEquipe = document.querySelectorAll('.menu-item')[2];
        if (btnEquipe) btnEquipe.click();
    });
}

// --- NOTIFICAÇÕES (TOAST) ---
function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span>${tipo === 'success' ? '✅' : '⚠️'}</span> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}

// --- MÁSCARAS E BUSCA DE CEP ---
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

const inputCEP = document.getElementById('cep');
if (inputCEP) {
    inputCEP.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        e.target.value = v;
    });
}

async function buscarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            if (!data.erro) {
                document.getElementById('logradouro').value = data.logradouro;
                document.getElementById('bairro').value = data.bairro;
                document.getElementById('cidade').value = data.localidade;
                document.getElementById('uf').value = data.uf;
                document.getElementById('numeroEnd').focus(); 
            } else {
                mostrarToast('CEP não encontrado.', 'error');
            }
        } catch (error) { mostrarToast('Erro ao buscar o CEP.', 'error'); }
    }
}

// --- LÓGICA DE STATUS E DEMISSÃO ---
function verificarStatus() {
    const status = document.getElementById('statusFunc').value;
    const boxDemissao = document.getElementById('boxDemissao');
    if(boxDemissao) {
        if (status === 'Demitido') {
            boxDemissao.style.display = 'block';
        } else {
            boxDemissao.style.display = 'none';
            document.getElementById('dataDemissao').value = ''; 
        }
    }
}

// --- LÓGICA DE DEPENDENTES ---
let contadorDependentes = 0;

function adicionarDependente(nome = '', nascimento = '') {
    contadorDependentes++;
    const container = document.getElementById('lista-dependentes-container');
    if(!container) return;
    
    const div = document.createElement('div');
    div.className = 'dependente-item';
    div.id = `dependente-${contadorDependentes}`;
    
    div.innerHTML = `
        <div style="flex: 2;">
            <label>Nome do Dependente</label>
            <input type="text" class="dep-nome" value="${nome}" placeholder="Nome completo">
        </div>
        <div style="flex: 1;">
            <label>Nascimento</label>
            <input type="date" class="dep-nasc" value="${nascimento}">
        </div>
        <button type="button" class="btn-acao btn-excluir btn-remover-dep" onclick="removerDependente(${contadorDependentes})">Remover</button>
    `;
    container.appendChild(div);
}

function removerDependente(id) {
    const elemento = document.getElementById(`dependente-${id}`);
    if (elemento) elemento.remove();
}

function limparDependentes() {
    const container = document.getElementById('lista-dependentes-container');
    if(container) container.innerHTML = '';
    contadorDependentes = 0;
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

let idEditando = null;

// --- CALENDÁRIO ---
const mesesNomes = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const feriados = { "01-01": "Confraternização", "04-21": "Tiradentes", "05-01": "Dia do Trabalho", "09-07": "Independência", "10-12": "Nossa Sra. Aparecida", "11-02": "Finados", "11-15": "Proclamação", "12-25": "Natal" };
let dataAtualCalendario = new Date();
let dataSelecionadaNota = null;

function renderizarCalendario() {
    const mesAnoDisplay = document.getElementById('mes-ano-display');
    const diasGrid = document.getElementById('dias-grid');
    if (!mesAnoDisplay || !diasGrid) return; 

    const ano = dataAtualCalendario.getFullYear();
    const mes = dataAtualCalendario.getMonth();
    mesAnoDisplay.innerText = `${mesesNomes[mes]} ${ano}`;
    diasGrid.innerHTML = '';

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();
    const notasSalvas = JSON.parse(localStorage.getItem('notasCalendario')) || {};

    for (let i = 0; i < primeiroDiaSemana; i++) diasGrid.innerHTML += `<div class="dia-cal dia-vazio"></div>`;

    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const dataFormatada = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const mesDiaFormatado = `${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        let classesExtras = '';
        let tituloFerido = '';

        if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) classesExtras += ' dia-hoje';
        if (feriados[mesDiaFormatado]) { classesExtras += ' dia-feriado'; tituloFerido = `title="${feriados[mesDiaFormatado]}"`; }
        if (notasSalvas[dataFormatada] && notasSalvas[dataFormatada].trim() !== '') classesExtras += ' tem-nota';

        diasGrid.innerHTML += `<div class="dia-cal ${classesExtras}" ${tituloFerido} onclick="abrirNotasDia('${dataFormatada}', ${dia})">${dia}</div>`;
    }
}

function mudarMes(direcao) {
    dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + direcao);
    fecharNotasDia(); renderizarCalendario();
}

function abrirNotasDia(dataStr, diaNumero) {
    dataSelecionadaNota = dataStr;
    const painel = document.getElementById('painel-notas-dia');
    const titulo = document.getElementById('titulo-notas-dia');
    const texto = document.getElementById('texto-nota-dia');
    if (!painel || !titulo || !texto) return;
    titulo.innerText = `Anotações: ${diaNumero} de ${mesesNomes[dataAtualCalendario.getMonth()]}`;
    painel.style.display = 'block';
    texto.value = (JSON.parse(localStorage.getItem('notasCalendario')) || {})[dataStr] || '';
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
    mostrarToast("Anotação salva!"); renderizarCalendario(); 
}

// --- BACKUP ---
function exportarBackup() {
    const backup = JSON.stringify({ 
        funcionarios: JSON.parse(localStorage.getItem('listaFuncionarios') || '[]'), 
        notas: JSON.parse(localStorage.getItem('notasCalendario') || '{}') 
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
    a.download = `backup_rh_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    a.click(); mostrarToast("Backup exportado!");
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
            atualizarTabela(); renderizarCalendario(); mostrarToast("Dados restaurados!");
        } catch (err) { mostrarToast("Erro ao ler backup.", "error"); }
    };
    leitor.readAsText(arquivo);
}

// --- TABELA E DASHBOARD ---
function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataISO;
}

function filtrarTabela() {
    const busca = (document.getElementById('inputBusca')?.value || '').toLowerCase();
    const linhas = document.querySelector('#tabelaFuncionarios tbody')?.getElementsByTagName('tr') || [];
    for (let linha of linhas) {
        linha.style.display = linha.innerText.toLowerCase().includes(busca) ? '' : 'none';
    }
}

function atualizarDashboard(funcionarios) {
    const contFunc = document.getElementById('contador-funcionarios');
    if (contFunc) contFunc.innerText = funcionarios.filter(f => f.status !== 'Demitido').length;

    const listaNiver = document.getElementById('lista-aniversariantes');
    if (listaNiver) {
        const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0'); 
        listaNiver.innerHTML = '';
        let encontrou = false;
        funcionarios.forEach(func => {
            if (func.status !== 'Demitido' && func.nascimento && func.nascimento.split('-')[1] === mesAtual) {
                encontrou = true;
                listaNiver.innerHTML += `<li>🎈 <strong>Dia ${func.nascimento.split('-')[2]}</strong> - ${func.nome}</li>`;
            }
        });
        if (!encontrou) listaNiver.innerHTML = '<li>Nenhum aniversário este mês.</li>';
    }
}

function atualizarTabela() {
    const tbody = document.querySelector('#tabelaFuncionarios tbody');
    if (!tbody) return; 
    tbody.innerHTML = ''; 

    let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    atualizarDashboard(funcionariosSalvos);

    funcionariosSalvos.forEach(function(func) {
        const tr = document.createElement('tr');
        const statusExibicao = func.status || 'Ativo'; 
        const badgeClass = statusExibicao.replace(/\s+/g, ''); 
        
        tr.innerHTML = `
            <td><span class="badge badge-${badgeClass}">${statusExibicao}</span></td>
            <td><strong>${func.nome}</strong><br><small style="color: #718096">${func.cpf || ''}</small></td>
            <td>${func.cargo || ''}</td>
            <td>
                <div class="acoes-container">
                    <button class="btn-acao btn-perfil" onclick="verPerfil(${func.id})">Perfil / Imprimir</button>
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
        localStorage.setItem('listaFuncionarios', JSON.stringify(funcSalvos.filter(f => f.id !== id)));
        atualizarTabela(); mostrarToast("Funcionário excluído.");
    }
}

function prepararEdicao(id) {
    let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcSalvos.find(f => f.id === id);

    if (func) {
        const setVal = (idEl, val) => { const el = document.getElementById(idEl); if(el) el.value = val || ''; }
        
        setVal('nome', func.nome);
        setVal('cpf', func.cpf);
        setVal('dataNascimento', func.nascimento);
        setVal('dataAdmissao', func.dataAdmissao);
        setVal('statusFunc', func.status);
        setVal('dataDemissao', func.dataDemissao);
        setVal('departamento', func.departamento);
        setVal('cargo', func.cargo);
        setVal('salario', func.salario);

        setVal('nomeMae', func.filiacao?.mae);
        setVal('nomePai', func.filiacao?.pai);
        
        if (func.endereco && typeof func.endereco === 'object') {
            setVal('cep', func.endereco.cep);
            setVal('logradouro', func.endereco.logradouro);
            setVal('numeroEnd', func.endereco.numero);
            setVal('bairro', func.endereco.bairro);
            setVal('cidade', func.endereco.cidade);
            setVal('uf', func.endereco.uf);
        } else {
            setVal('logradouro', func.endereco); 
        }

        setVal('rg', func.documentosBasicos?.rg);
        setVal('pis', func.documentosBasicos?.pis);
        setVal('reservista', func.documentosBasicos?.reservista);
        setVal('ctpsNumero', func.documentosBasicos?.ctps?.numero);
        setVal('ctpsSerie', func.documentosBasicos?.ctps?.serie);
        setVal('eleitorNumero', func.documentosBasicos?.eleitor?.numero);
        setVal('eleitorZona', func.documentosBasicos?.eleitor?.zona);
        setVal('eleitorSecao', func.documentosBasicos?.eleitor?.secao);
        
        setVal('banco', func.dadosBancarios?.banco);
        setVal('agencia', func.dadosBancarios?.agencia);
        setVal('conta', func.dadosBancarios?.conta);
        setVal('chavePix', func.dadosBancarios?.chavePix);

        limparDependentes();
        if(func.dependentes && func.dependentes.length > 0) {
            func.dependentes.forEach(dep => adicionarDependente(dep.nome, dep.nascimento));
        }
        
        verificarStatus();
        idEditando = id;
        const btnSubmit = document.getElementById('btnSubmit');
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

        const dataNascFmt = func.nascimento ? formatarDataBR(func.nascimento) : '-';
        const badgeClass = (func.status || 'Ativo').replace(/\s+/g, '');
        
        let enderecoFormatado = '-';
        if (func.endereco && typeof func.endereco === 'object' && func.endereco.logradouro) {
            enderecoFormatado = `${func.endereco.logradouro}, ${func.endereco.numero} - ${func.endereco.bairro}. ${func.endereco.cidade}/${func.endereco.uf}. CEP: ${func.endereco.cep}`;
        } else { enderecoFormatado = func.endereco || '-'; }

        let htmlDocs = '';
        if (func.documentos?.rg) htmlDocs += `<div class="doc-item"><span>📄 RG/CPF: <strong>${func.documentos.rg.nome}</strong></span><a href="${func.documentos.rg.base64}" download="${func.documentos.rg.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        if (func.documentos?.ctps) htmlDocs += `<div class="doc-item"><span>📘 CTPS: <strong>${func.documentos.ctps.nome}</strong></span><a href="${func.documentos.ctps.base64}" download="${func.documentos.ctps.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        if (htmlDocs === '') htmlDocs = '<p style="color: #718096; margin-top: 10px;">Nenhum anexo.</p>';

        let htmlDependentes = '';
        if (func.dependentes && func.dependentes.length > 0) {
            func.dependentes.forEach(d => {
                htmlDependentes += `<li><strong>${d.nome}</strong> - Nasc: ${formatarDataBR(d.nascimento)}</li>`;
            });
            htmlDependentes = `<ul class="lista-simples" style="margin-top:0;">${htmlDependentes}</ul>`;
        } else { htmlDependentes = '<p style="color: #718096; padding: 10px 0;">Nenhum dependente cadastrado.</p>'; }

        // MÁGICA DA IMPRESSÃO: Estrutura preparada tanto para visualização web quanto para impressão formal de RH.
        conteiner.innerHTML = `
            <div class="print-header-oficial">
                <h1 style="text-align: center; font-size: 20px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px;">FICHA DE REGISTRO DE EMPREGADO</h1>
            </div>

            <div class="web-cabecalho-perfil" style="display: flex; align-items: center; gap: 15px; margin-bottom: 5px;">
                <h2 style="font-size: 26px; margin:0;">${func.nome}</h2>
                <span class="badge badge-${badgeClass} hide-on-print">${func.status || 'Ativo'}</span>
            </div>
            <p class="web-cabecalho-perfil" style="color: #718096; font-size: 16px;">${func.cargo} • ${func.departamento}</p>
            ${func.status === 'Demitido' ? `<p style="color: #B23434; font-weight: bold; margin-top: 5px;">Demitido em: ${formatarDataBR(func.dataDemissao)}</p>` : ''}
            
            <hr class="hide-on-print" style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
            
            <h3 class="print-section-title" style="margin-bottom: 15px; font-size: 18px; color: var(--primaria);">Dados Pessoais e Endereço</h3>
            <div class="perfil-grid print-grid">
                <div class="perfil-info print-box"><strong>Nome</strong><p class="print-only">${func.nome}</p><p class="hide-on-print">${func.nome}</p></div>
                <div class="perfil-info print-box"><strong>CPF</strong><p>${func.cpf}</p></div>
                <div class="perfil-info print-box"><strong>Nascimento</strong><p>${dataNascFmt}</p></div>
                <div class="perfil-info print-box" style="grid-column: span 2;"><strong>Endereço</strong><p>${enderecoFormatado}</p></div>
                <div class="perfil-info print-box"><strong>Mãe</strong><p>${func.filiacao?.mae || '-'}</p></div>
                <div class="perfil-info print-box"><strong>Pai</strong><p>${func.filiacao?.pai || '-'}</p></div>
            </div>

            <h3 class="print-section-title" style="margin-bottom: 15px; margin-top: 25px; font-size: 18px; color: var(--primaria);">Documentação</h3>
            <div class="perfil-grid print-grid">
                <div class="perfil-info print-box"><strong>RG</strong><p>${func.documentosBasicos?.rg || '-'}</p></div>
                <div class="perfil-info print-box"><strong>PIS</strong><p>${func.documentosBasicos?.pis || '-'}</p></div>
                <div class="perfil-info print-box"><strong>Reservista</strong><p>${func.documentosBasicos?.reservista || '-'}</p></div>
                <div class="perfil-info print-box"><strong>CTPS / Série</strong><p>${func.documentosBasicos?.ctps?.numero || '-'} / ${func.documentosBasicos?.ctps?.serie || '-'}</p></div>
                <div class="perfil-info print-box" style="grid-column: span 2;"><strong>Título de Eleitor (Nº - Zona/Seção)</strong><p>${func.documentosBasicos?.eleitor?.numero || '-'} (Z: ${func.documentosBasicos?.eleitor?.zona || '-'} / S: ${func.documentosBasicos?.eleitor?.secao || '-'})</p></div>
            </div>

            <h3 class="print-section-title" style="margin-bottom: 15px; margin-top: 25px; font-size: 18px; color: var(--primaria);">Contrato e Dados Bancários</h3>
            <div class="perfil-grid print-grid">
                <div class="perfil-info print-box"><strong>Cargo</strong><p>${func.cargo}</p></div>
                <div class="perfil-info print-box"><strong>Departamento</strong><p>${func.departamento}</p></div>
                <div class="perfil-info print-box"><strong>Admissão</strong><p>${formatarDataBR(func.dataAdmissao)}</p></div>
                <div class="perfil-info print-box"><strong>Salário</strong><p>${func.salario || '-'}</p></div>
                <div class="perfil-info print-box"><strong>Banco / Agência</strong><p>${func.dadosBancarios?.banco || '-'} / ${func.dadosBancarios?.agencia || '-'}</p></div>
                <div class="perfil-info print-box"><strong>Conta / PIX</strong><p>${func.dadosBancarios?.conta || '-'} / ${func.dadosBancarios?.chavePix || '-'}</p></div>
            </div>

            <h3 class="print-section-title" style="margin-bottom: 15px; margin-top: 25px; font-size: 18px; color: var(--primaria);">Dependentes</h3>
            <div class="perfil-info print-box" style="margin-bottom: 20px;">${htmlDependentes}</div>

            <div class="area-documentos-perfil hide-on-print">
                <strong>Arquivos Anexados (Não aparecem na impressão)</strong>
                ${htmlDocs}
            </div>

            <div class="print-signatures-oficial">
                <div class="linha-assinatura">
                    <hr>
                    <p>Assinatura do Empregado</p>
                </div>
                <div class="linha-assinatura">
                    <hr>
                    <p>Assinatura do Empregador</p>
                </div>
            </div>
        `;
        mudarAba(null, 'tela-perfil');
    }
}

function exportarListaCSV() {
    let f = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    if (f.length === 0) return mostrarToast("Nenhum funcionário cadastrado.", "error");
    
    let csv = "Status,Nome,CPF,Nascimento,Cargo,Admissao,Salario,Banco,Conta\n";
    f.forEach(x => csv += `"${x.status}","${x.nome}","${x.cpf}","${x.nascimento}","${x.cargo}","${x.dataAdmissao}","${x.salario}","${x.dadosBancarios?.banco}","${x.dadosBancarios?.conta}"\n`);

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

window.onload = function() { atualizarTabela(); renderizarCalendario(); };

// --- SALVAR DADOS (CREATE / UPDATE) ---
const form = document.getElementById('formFuncionario');
if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

        const dependentesArray = [];
        document.querySelectorAll('.dependente-item').forEach(item => {
            const n = item.querySelector('.dep-nome').value;
            const dt = item.querySelector('.dep-nasc').value;
            if (n) dependentesArray.push({ nome: n, nascimento: dt });
        });

        const arquivoRG = await processarArquivo(document.getElementById('docRG'));
        const arquivoCTPS = await processarArquivo(document.getElementById('docCTPS'));

        const novoFunc = {
            id: idEditando !== null ? idEditando : Date.now(),
            nome: getVal('nome'), cpf: getVal('cpf'), nascimento: getVal('dataNascimento'),
            dataAdmissao: getVal('dataAdmissao'), status: getVal('statusFunc'),
            dataDemissao: getVal('statusFunc') === 'Demitido' ? getVal('dataDemissao') : '',
            departamento: getVal('departamento'), cargo: getVal('cargo'), salario: getVal('salario'),
            filiacao: { mae: getVal('nomeMae'), pai: getVal('nomePai') },
            endereco: {
                cep: getVal('cep'), logradouro: getVal('logradouro'), numero: getVal('numeroEnd'), 
                bairro: getVal('bairro'), cidade: getVal('cidade'), uf: getVal('uf')
            },
            documentosBasicos: {
                rg: getVal('rg'), pis: getVal('pis'), reservista: getVal('reservista'),
                ctps: { numero: getVal('ctpsNumero'), serie: getVal('ctpsSerie') },
                eleitor: { numero: getVal('eleitorNumero'), zona: getVal('eleitorZona'), secao: getVal('eleitorSecao') }
            },
            dadosBancarios: {
                banco: getVal('banco'), agencia: getVal('agencia'), conta: getVal('conta'), chavePix: getVal('chavePix')
            },
            dependentes: dependentesArray, documentos: {}
        };

        let funcSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];

        if (idEditando === null) {
            if (arquivoRG) novoFunc.documentos.rg = arquivoRG;
            if (arquivoCTPS) novoFunc.documentos.ctps = arquivoCTPS;
            funcSalvos.push(novoFunc);
            mostrarToast("Ficha salva com sucesso!");
        } else {
            const index = funcSalvos.findIndex(f => f.id === idEditando);
            if (index !== -1) {
                novoFunc.documentos.rg = arquivoRG ? arquivoRG : funcSalvos[index].documentos?.rg;
                novoFunc.documentos.ctps = arquivoCTPS ? arquivoCTPS : funcSalvos[index].documentos?.ctps;
                funcSalvos[index] = novoFunc;
            }
            idEditando = null;
            const btnSubmit = document.getElementById('btnSubmit');
            if (btnSubmit) btnSubmit.textContent = "✨ Salvar Ficha de Registro";
            mostrarToast("Ficha atualizada com sucesso!");
        }

        localStorage.setItem('listaFuncionarios', JSON.stringify(funcSalvos));
        form.reset(); limparDependentes(); verificarStatus(); atualizarTabela(); 
        
        const btnEquipe = document.querySelectorAll('.menu-item')[2];
        if (btnEquipe) btnEquipe.click();
    });
}

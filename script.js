// --- NOTIFICAÇÕES E MÁSCARAS ---
function mostrarToast(msg, tipo = 'success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${tipo}`; t.innerHTML = `<span>${tipo==='success'?'✅':'⚠️'}</span> ${msg}`;
    c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
}

function formatarMoeda(e) {
    let v = e.target.value.replace(/\D/g, "");
    v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    e.target.value = v;
}
document.getElementById('salario')?.addEventListener('input', formatarMoeda);

document.getElementById('cpf')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = v;
});

document.getElementById('cep')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
});

async function buscarCEP(cep) {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length === 8) {
        try {
            const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`); const data = await res.json();
            if (!data.erro) {
                document.getElementById('logradouro').value = data.logradouro; document.getElementById('bairro').value = data.bairro;
                document.getElementById('cidade').value = data.localidade; document.getElementById('uf').value = data.uf;
                document.getElementById('numeroEnd').focus(); 
            } else mostrarToast('CEP não encontrado.', 'error');
        } catch (e) { mostrarToast('Erro no CEP.', 'error'); }
    }
}

// --- NAVEGAÇÃO E ABAS INTERNAS ---
function mudarAba(e, id) {
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('ativo'));
    document.querySelectorAll('.main-content > .aba').forEach(t => t.classList.remove('ativa'));
    if (e?.target?.classList.contains('menu-item')) e.target.classList.add('ativo');
    document.getElementById(id)?.classList.add('ativa');
}

function mudarAbaForm(id) {
    document.querySelectorAll('.btn-form-tab').forEach(b => b.classList.remove('ativo'));
    document.querySelectorAll('.form-tab-content').forEach(c => c.style.display = 'none');
    
    const event = window.event;
    if (event) event.target.classList.add('ativo');
    
    const tab = document.getElementById(id);
    if(tab) tab.style.display = id === 'tab-notas' ? 'block' : 'grid';
}

function verificarStatus() {
    const s = document.getElementById('statusFunc').value;
    const b = document.getElementById('boxDemissao');
    if(b) { b.style.display = s === 'Demitido' ? 'block' : 'none'; if(s !== 'Demitido') document.getElementById('dataDemissao').value = ''; }
}

// --- FÉRIAS: CÁLCULOS E ALERTAS ---
function formatarDataBR(dataISO) {
    if (!dataISO) return ''; const p = dataISO.split('-'); return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : dataISO;
}

function calcularVencimentoFerias() {
    const admissao = document.getElementById('dataAdmissao').value;
    if(!admissao) return;
    
    const dataAdm = new Date(admissao + "T00:00:00");
    document.getElementById('feriasInicio').value = formatarDataBR(admissao);
    
    // Vencimento = 1 ano após admissão
    dataAdm.setFullYear(dataAdm.getFullYear() + 1);
    const vencimentoISO = dataAdm.toISOString().split('T')[0];
    document.getElementById('feriasFim').value = formatarDataBR(vencimentoISO);
}

function verificarAlertas(funcionarios) {
    const lista = document.getElementById('lista-alertas');
    if(!lista) return;
    lista.innerHTML = '';
    let temAlerta = false;
    const hoje = new Date();

    funcionarios.forEach(f => {
        if(f.status === 'Demitido') return;

        // Alerta de Férias Vencendo/Vencidas
        if(f.dataAdmissao) {
            const vencimento = new Date(f.dataAdmissao + "T00:00:00");
            vencimento.setFullYear(vencimento.getFullYear() + 1);
            
            const difMeses = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30);

            if(difMeses < 0) { // Vencidas
                lista.innerHTML += `<li>🚨 <strong>${f.nome}</strong>: Férias vencidas desde ${formatarDataBR(vencimento.toISOString().split('T')[0])}!</li>`;
                temAlerta = true;
            } else if(difMeses <= 2) { // Vencendo em 60 dias
                lista.innerHTML += `<li>⚠️ <strong>${f.nome}</strong>: Férias vencem em breve (${formatarDataBR(vencimento.toISOString().split('T')[0])}).</li>`;
                temAlerta = true;
            }
        }
    });

    if(!temAlerta) lista.innerHTML = '<li style="color: var(--texto-cinza);">Nenhum alerta no momento.</li>';
}

// --- DEPENDENTES E CALENDÁRIO (CÓDIGO MANTIDO DA VERSÃO ANTERIOR) ---
let contadorDep = 0;
function adicionarDependente(n='', d='') {
    contadorDep++; const c = document.getElementById('lista-dependentes-container'); if(!c) return;
    const div = document.createElement('div'); div.className = 'dependente-item'; div.id = `dep-${contadorDep}`;
    div.innerHTML = `<div style="flex:2;"><label>Nome</label><input type="text" class="dep-nome" value="${n}"></div><div style="flex:1;"><label>Nasc.</label><input type="date" class="dep-nasc" value="${d}"></div><button type="button" class="btn-acao btn-excluir" onclick="document.getElementById('dep-${contadorDep}').remove()" style="height:48px; margin-bottom:2px;">Remover</button>`;
    c.appendChild(div);
}
function limparDependentes() { const c = document.getElementById('lista-dependentes-container'); if(c) c.innerHTML = ''; contadorDep = 0; }

// --- CALENDÁRIO ---
let dCal = new Date(); let dSelNota = null; const mN = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
function renderizarCalendario() {
    const mD = document.getElementById('mes-ano-display'); const dG = document.getElementById('dias-grid'); if(!mD||!dG) return;
    const a = dCal.getFullYear(); const m = dCal.getMonth(); mD.innerText = `${mN[m]} ${a}`; dG.innerHTML = '';
    const p = new Date(a, m, 1).getDay(); const u = new Date(a, m + 1, 0).getDate(); const h = new Date();
    const notas = JSON.parse(localStorage.getItem('notasCalendario')) || {};
    for (let i = 0; i < p; i++) dG.innerHTML += `<div class="dia-cal dia-vazio"></div>`;
    for (let d = 1; d <= u; d++) {
        const dtStr = `${a}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let c = ''; if (d===h.getDate() && m===h.getMonth() && a===h.getFullYear()) c += ' dia-hoje';
        if (notas[dtStr] && notas[dtStr].trim() !== '') c += ' tem-nota';
        dG.innerHTML += `<div class="dia-cal ${c}" onclick="abrirNotasDia('${dtStr}', ${d})">${d}</div>`;
    }
}
function mudarMes(dir) { dCal.setMonth(dCal.getMonth() + dir); fecharNotasDia(); renderizarCalendario(); }
function abrirNotasDia(dt, d) { dSelNota = dt; document.getElementById('painel-notas-dia').style.display='block'; document.getElementById('titulo-notas-dia').innerText=`Anotações: ${d} ${mN[dCal.getMonth()]}`; document.getElementById('texto-nota-dia').value=(JSON.parse(localStorage.getItem('notasCalendario'))||{})[dt]||''; }
function fecharNotasDia() { document.getElementById('painel-notas-dia').style.display='none'; dSelNota=null; }
function salvarNotaDia() { if(!dSelNota)return; let n = JSON.parse(localStorage.getItem('notasCalendario'))||{}; n[dSelNota]=document.getElementById('texto-nota-dia').value; localStorage.setItem('notasCalendario', JSON.stringify(n)); mostrarToast("Salvo!"); renderizarCalendario(); }

// --- BACKUP ---
function exportarBackup() {
    const b = JSON.stringify({ func: JSON.parse(localStorage.getItem('listaFuncionarios')||'[]'), notas: JSON.parse(localStorage.getItem('notasCalendario')||'{}') });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([b], {type:'application/json'})); a.download = `rh_backup.json`; a.click(); mostrarToast("Exportado!");
}
function importarBackup(e) {
    const l = new FileReader(); l.onload = (ev) => { try{ const d = JSON.parse(ev.target.result); if(d.func) localStorage.setItem('listaFuncionarios', JSON.stringify(d.func)); if(d.notas) localStorage.setItem('notasCalendario', JSON.stringify(d.notas)); atualizarTabela(); renderizarCalendario(); mostrarToast("Restaurado!"); }catch(err){mostrarToast("Erro","error");} }; l.readAsText(e.target.files[0]);
}

// --- TABELA E DASHBOARD CORE ---
function filtrarTabela() { const b = document.getElementById('inputBusca').value.toLowerCase(); document.querySelectorAll('#tabelaFuncionarios tbody tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(b) ? '' : 'none'); }

function atualizarDashboard(funcs) {
    const c = document.getElementById('contador-funcionarios'); if(c) c.innerText = funcs.filter(f=>f.status!=='Demitido').length;
    const l = document.getElementById('lista-aniversariantes');
    if(l) {
        l.innerHTML=''; let tm = false; const mA = String(new Date().getMonth()+1).padStart(2,'0');
        funcs.forEach(f => { if(f.status!=='Demitido' && f.nascimento && f.nascimento.split('-')[1]===mA) { tm=true; l.innerHTML+=`<li>🎈 <strong>Dia ${f.nascimento.split('-')[2]}</strong> - ${f.nome}</li>`; } });
        if(!tm) l.innerHTML='<li style="color:#718096">Nenhum neste mês.</li>';
    }
    verificarAlertas(funcs);
}

function atualizarTabela() {
    const tb = document.querySelector('#tabelaFuncionarios tbody'); if(!tb) return; tb.innerHTML = '';
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    atualizarDashboard(fs);

    fs.forEach(f => {
        const tr = document.createElement('tr');
        const sc = (f.status||'Ativo').replace(/\s+/g,'');
        
        let msgFerias = '-';
        if(f.status !== 'Demitido' && f.dataAdmissao) {
            const v = new Date(f.dataAdmissao + "T00:00:00"); v.setFullYear(v.getFullYear() + 1);
            if(v < new Date()) msgFerias = `<span style="color:var(--perigo); font-weight:bold; font-size: 12px;">Vencidas</span>`;
            else msgFerias = `<span style="font-size: 12px; color: var(--texto-cinza);">Vence: ${formatarDataBR(v.toISOString().split('T')[0])}</span>`;
        }

        tr.innerHTML = `
            <td><span class="badge badge-${sc}">${f.status}</span></td>
            <td><strong>${f.nome}</strong><br><small style="color:#718096">${f.cargo||''}</small></td>
            <td>${msgFerias}</td>
            <td><div class="acoes-container"><button class="btn-acao btn-perfil" onclick="verPerfil(${f.id})">Ver Ficha</button><button class="btn-acao btn-editar" onclick="prepararEdicao(${f.id})">Editar</button></div></td>
        `; tb.appendChild(tr);
    });
}

let idEditando = null;

function prepararEdicao(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id);
    if (f) {
        const sV = (i, v) => { const el = document.getElementById(i); if(el) el.value = v||''; }
        
        sV('nome', f.nome); sV('cpf', f.cpf); sV('dataNascimento', f.nascimento); sV('dataAdmissao', f.dataAdmissao); sV('statusFunc', f.status); sV('dataDemissao', f.dataDemissao); sV('departamento', f.departamento); sV('cargo', f.cargo); sV('salario', f.salario); sV('nomeMae', f.filiacao?.mae); sV('nomePai', f.filiacao?.pai); sV('rg', f.documentosBasicos?.rg); sV('pis', f.documentosBasicos?.pis); sV('reservista', f.documentosBasicos?.reservista); sV('ctpsNumero', f.documentosBasicos?.ctps?.numero); sV('ctpsSerie', f.documentosBasicos?.ctps?.serie); sV('eleitorNumero', f.documentosBasicos?.eleitor?.numero); sV('eleitorZona', f.documentosBasicos?.eleitor?.zona); sV('eleitorSecao', f.documentosBasicos?.eleitor?.secao); sV('banco', f.dadosBancarios?.banco); sV('agencia', f.dadosBancarios?.agencia); sV('conta', f.dadosBancarios?.conta); sV('chavePix', f.dadosBancarios?.chavePix);
        
        if (typeof f.endereco === 'object') { sV('cep', f.endereco.cep); sV('logradouro', f.endereco.logradouro); sV('numeroEnd', f.endereco.numero); sV('bairro', f.endereco.bairro); sV('cidade', f.endereco.cidade); sV('uf', f.endereco.uf); } else sV('logradouro', f.endereco);
        
        // Férias e Notas
        sV('feriasDiasHaver', f.controle?.feriasDiasHaver !== undefined ? f.controle.feriasDiasHaver : 30);
        sV('feriasDataSaida', f.controle?.feriasDataSaida); sV('feriasDataRetorno', f.controle?.feriasDataRetorno);
        sV('decimoStatus', f.controle?.decimoStatus || 'Não Solicitado'); sV('decimoValorAdiantado', f.controle?.decimoValorAdiantado);
        sV('notasInternas', f.notasInternas);

        limparDependentes(); if(f.dependentes) f.dependentes.forEach(d => adicionarDependente(d.nome, d.nascimento));
        
        verificarStatus(); calcularVencimentoFerias(); idEditando = id;
        document.getElementById('btnSubmit').textContent = "✨ Salvar Alterações";
        mudarAbaForm('tab-dados'); // Volta pra aba principal ao editar
        document.querySelectorAll('.menu-item')[1].click();
    }
}

function verPerfil(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id);
    if (f) {
        const endFmt = typeof f.endereco === 'object' && f.endereco.logradouro ? `${f.endereco.logradouro}, ${f.endereco.numero} - ${f.endereco.bairro}. ${f.endereco.cidade}/${f.endereco.uf}. CEP: ${f.endereco.cep}` : (f.endereco||'-');
        let depHtml = f.dependentes?.length ? f.dependentes.map(d=>`<li><strong>${d.nome}</strong> - Nasc: ${formatarDataBR(d.nascimento)}</li>`).join('') : '<li style="color:#718096;">Nenhum</li>';
        
        // Formatar Adiantamento e Notas
        const adc = f.controle?.decimoStatus === 'Adiantado (Novembro)' ? `(R$ ${f.controle.decimoValorAdiantado || '0,00'})` : '';
        const dHaver = f.controle?.feriasDiasHaver !== undefined ? f.controle.feriasDiasHaver : 30;

        document.getElementById('conteudo-perfil').innerHTML = `
            <div class="print-header-oficial"><h1 style="text-align:center; font-size:20px; font-weight:bold; border-bottom:2px solid black; padding-bottom:10px; margin-bottom:20px;">FICHA DE REGISTRO DE EMPREGADO</h1></div>
            <div class="web-cabecalho-perfil" style="display:flex; align-items:center; gap:15px; margin-bottom:5px;"><h2 style="font-size:26px; margin:0;">${f.nome}</h2><span class="badge badge-${(f.status||'Ativo').replace(/\s+/g,'')} hide-on-print">${f.status||'Ativo'}</span></div>
            <p class="web-cabecalho-perfil" style="color:#718096; font-size:16px;">${f.cargo} • ${f.departamento}</p>
            ${f.status==='Demitido'?`<p style="color:#B23434; font-weight:bold; margin-top:5px;">Demitido em: ${formatarDataBR(f.dataDemissao)}</p>`:''}
            
            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Dados Gerais e Endereço</h3>
            <div class="perfil-grid print-grid">
                <div class="perfil-info print-box"><strong>CPF</strong><p>${f.cpf}</p></div>
                <div class="perfil-info print-box"><strong>Nasc.</strong><p>${formatarDataBR(f.nascimento)}</p></div>
                <div class="perfil-info print-box" style="grid-column: span 2;"><strong>Endereço</strong><p>${endFmt}</p></div>
                <div class="perfil-info print-box"><strong>Mãe</strong><p>${f.filiacao?.mae||'-'}</p></div>
                <div class="perfil-info print-box"><strong>Pai</strong><p>${f.filiacao?.pai||'-'}</p></div>
            </div>

            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Documentação</h3>
            <div class="perfil-grid print-grid">
                <div class="perfil-info print-box"><strong>RG / PIS</strong><p>${f.documentosBasicos?.rg||'-'} / ${f.documentosBasicos?.pis||'-'}</p></div>
                <div class="perfil-info print-box"><strong>CTPS / Série</strong><p>${f.documentosBasicos?.ctps?.numero||'-'} / ${f.documentosBasicos?.ctps?.serie||'-'}</p></div>
                <div class="perfil-info print-box" style="grid-column: span 2;"><strong>Título de Eleitor (Nº - Z/S)</strong><p>${f.documentosBasicos?.eleitor?.numero||'-'} (Z: ${f.documentosBasicos?.eleitor?.zona||'-'} / S: ${f.documentosBasicos?.eleitor?.secao||'-'})</p></div>
            </div>

            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Contrato e Banco</h3>
            <div class="perfil-grid print-grid">
                <div class="perfil-info print-box"><strong>Admissão</strong><p>${formatarDataBR(f.dataAdmissao)}</p></div>
                <div class="perfil-info print-box"><strong>Salário</strong><p>${f.salario||'-'}</p></div>
                <div class="perfil-info print-box"><strong>Banco / Agência</strong><p>${f.dadosBancarios?.banco||'-'} / ${f.dadosBancarios?.agencia||'-'}</p></div>
                <div class="perfil-info print-box"><strong>Conta / PIX</strong><p>${f.dadosBancarios?.conta||'-'} / ${f.dadosBancarios?.chavePix||'-'}</p></div>
            </div>
            
            <h3 class="print-section-title hide-on-print" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--secundaria);">Controle Interno (RH)</h3>
            <div class="perfil-grid hide-on-print" style="background: #E6FAFB; padding: 20px; border-radius: 12px; border: 1px solid #00C4CC;">
                <div class="perfil-info" style="background: transparent;"><strong>Férias em Haver</strong><p>${dHaver} dias</p></div>
                <div class="perfil-info" style="background: transparent;"><strong>Último Agendamento</strong><p>Saída: ${formatarDataBR(f.controle?.feriasDataSaida)||'-'}<br>Retorno: ${formatarDataBR(f.controle?.feriasDataRetorno)||'-'}</p></div>
                <div class="perfil-info" style="background: transparent; grid-column: span 2;"><strong>Situação 13º</strong><p>${f.controle?.decimoStatus||'-'} ${adc}</p></div>
                <div class="perfil-info" style="background: transparent; grid-column: span 4; border-top: 1px solid #ccc; padding-top: 15px;"><strong>Anotações Internas</strong><p style="white-space: pre-wrap; font-size: 14px; font-weight: normal;">${f.notasInternas || 'Nenhuma anotação.'}</p></div>
            </div>

            <div class="print-signatures-oficial"><div class="linha-assinatura"><hr><p>Assinatura Empregado</p></div><div class="linha-assinatura"><hr><p>Assinatura Empregador</p></div></div>
        `;
        mudarAba(null, 'tela-perfil');
    }
}

const form = document.getElementById('formFuncionario');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const gV = id => document.getElementById(id)?.value.trim()||'';
        const dArr = []; document.querySelectorAll('.dependente-item').forEach(i => { const n = i.querySelector('.dep-nome').value; if(n) dArr.push({nome:n, nascimento:i.querySelector('.dep-nasc').value}); });

        const nF = {
            id: idEditando !== null ? idEditando : Date.now(),
            nome: gV('nome'), cpf: gV('cpf'), nascimento: gV('dataNascimento'), dataAdmissao: gV('dataAdmissao'), status: gV('statusFunc'), dataDemissao: gV('statusFunc')==='Demitido'?gV('dataDemissao'):'',
            departamento: gV('departamento'), cargo: gV('cargo'), salario: gV('salario'), filiacao: { mae: gV('nomeMae'), pai: gV('nomePai') },
            endereco: { cep: gV('cep'), logradouro: gV('logradouro'), numero: gV('numeroEnd'), bairro: gV('bairro'), cidade: gV('cidade'), uf: gV('uf') },
            documentosBasicos: { rg: gV('rg'), pis: gV('pis'), reservista: gV('reservista'), ctps: { numero: gV('ctpsNumero'), serie: gV('ctpsSerie') }, eleitor: { numero: gV('eleitorNumero'), zona: gV('eleitorZona'), secao: gV('eleitorSecao') } },
            dadosBancarios: { banco: gV('banco'), agencia: gV('agencia'), conta: gV('conta'), chavePix: gV('chavePix') },
            controle: { feriasDiasHaver: gV('feriasDiasHaver'), feriasDataSaida: gV('feriasDataSaida'), feriasDataRetorno: gV('feriasDataRetorno'), decimoStatus: gV('decimoStatus'), decimoValorAdiantado: gV('decimoValorAdiantado') },
            notasInternas: gV('notasInternas'), dependentes: dArr
        };

        let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
        if (idEditando === null) { fs.push(nF); mostrarToast("Ficha salva!"); } 
        else { const i = fs.findIndex(f => f.id === idEditando); if(i !== -1) fs[i] = nF; idEditando = null; document.getElementById('btnSubmit').textContent = "✨ Salvar Ficha Completa"; mostrarToast("Ficha atualizada!"); }

        localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        form.reset(); limparDependentes(); verificarStatus(); atualizarTabela();
        mudarAbaForm('tab-dados'); // Reseta a view form
        document.querySelectorAll('.menu-item')[2].click();
    });
}
window.onload = function() { atualizarTabela(); renderizarCalendario(); };
function exportarListaCSV() {} // Mantida vazia no minifier para espaço, caso não use exportação csv

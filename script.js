// --- UTILITÁRIOS E TOASTS ---
function mostrarToast(msg, tipo = 'success') {
    const c = document.getElementById('toast-container'); if (!c) return;
    const t = document.createElement('div'); t.className = `toast ${tipo}`; t.innerHTML = `<span>${tipo==='success'?'✅':'⚠️'}</span> ${msg}`;
    c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
}
function formatarMoeda(e) { let v = e.target.value.replace(/\D/g, ""); v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); e.target.value = v; }
document.getElementById('salario')?.addEventListener('input', formatarMoeda);
document.getElementById('decimoValorAdiantado')?.addEventListener('input', formatarMoeda);

document.getElementById('cpf')?.addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, ""); v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); e.target.value = v; });
document.getElementById('cep')?.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2"); });
async function buscarCEP(cep) {
    const limpo = cep.replace(/\D/g, ''); if (limpo.length === 8) {
        try { const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`); const data = await res.json();
            if (!data.erro) { document.getElementById('logradouro').value = data.logradouro; document.getElementById('bairro').value = data.bairro; document.getElementById('cidade').value = data.localidade; document.getElementById('uf').value = data.uf; document.getElementById('numeroEnd').focus(); 
            } else mostrarToast('CEP não encontrado.', 'error');
        } catch (e) { mostrarToast('Erro no CEP.', 'error'); }
    }
}
function formatarDataBR(dataISO) { if (!dataISO) return ''; const p = dataISO.split('-'); return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : dataISO; }

// --- NAVEGAÇÃO E ABAS INTERNAS ---
function mudarAba(e, id) {
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('ativo'));
    document.querySelectorAll('.main-content > .aba').forEach(t => t.classList.remove('ativa'));
    if (e?.target?.classList.contains('menu-item')) e.target.classList.add('ativo');
    document.getElementById(id)?.classList.add('ativa');
}
function mudarAbaForm(id) {
    document.querySelectorAll('.btn-form-tab').forEach(b => b.classList.remove('ativo')); document.querySelectorAll('.form-tab-content').forEach(c => c.style.display = 'none');
    if (window.event && window.event.target) window.event.target.classList.add('ativo');
    const tab = document.getElementById(id); if(tab) tab.style.display = id === 'tab-notas' ? 'block' : 'grid';
}
function verificarStatus() { const s = document.getElementById('statusFunc').value; const b = document.getElementById('boxDemissao'); if(b) { b.style.display = s === 'Demitido' ? 'block' : 'none'; if(s !== 'Demitido') document.getElementById('dataDemissao').value = ''; } }

// --- GESTÃO DE FÉRIAS (NOVO MOTOR) ---
function atualizarTabelaFerias() {
    const tb = document.querySelector('#tabelaFerias tbody'); if(!tb) return; tb.innerHTML = '';
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const hoje = new Date();
    
    fs.forEach(f => {
        if(f.status === 'Demitido' || !f.dataAdmissao) return;
        
        // Matemáticas de Vencimento
        const adm = new Date(f.dataAdmissao + "T00:00:00");
        const vencimento = new Date(adm); vencimento.setFullYear(vencimento.getFullYear() + 1);
        const limiteConcessao = new Date(vencimento); limiteConcessao.setFullYear(limiteConcessao.getFullYear() + 1);
        const difDias = (limiteConcessao.getTime() - hoje.getTime()) / (1000 * 3600 * 24);
        
        // Matemáticas de Dias Restantes
        let historico = f.controle?.historicoFerias || [];
        let diasTirados = historico.reduce((acc, curr) => acc + Number(curr.dias), 0);
        let diasHaver = 30 - diasTirados;
        
        // Status do Farol
        let statusBadge = '';
        if (difDias < 0) statusBadge = '<span class="badge" style="background:#FFF0F0; color:#B23434; border:1px solid #B23434;">🔴 Vencidas</span>';
        else if (difDias <= 90) statusBadge = '<span class="badge" style="background:#FFF6E5; color:#B27B16; border:1px solid #B27B16;">🟡 Atenção</span>';
        else statusBadge = '<span class="badge" style="background:#E6FAFB; color:#008A8F;">🟢 No Prazo</span>';
        
        // Está viajando agora?
        let emGozo = false;
        historico.forEach(h => {
            const dS = new Date(h.saida + "T00:00:00"); const dR = new Date(h.retorno + "T00:00:00");
            if(hoje >= dS && hoje <= dR) emGozo = true;
        });
        if(emGozo) statusBadge = '<span class="badge" style="background:#EBF4FF; color:#1E3A8A; border:1px solid #1E3A8A;">🔵 Em Gozo</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${statusBadge}</td>
            <td><strong>${f.nome}</strong></td>
            <td style="font-size: 13px;">${formatarDataBR(f.dataAdmissao)} a ${formatarDataBR(vencimento.toISOString().split('T')[0])}</td>
            <td><strong style="color:${diasHaver===0?'#B23434':'#008A8F'}; font-size:16px;">${diasHaver}</strong> <span style="font-size:12px;color:var(--texto-cinza);">dias</span></td>
            <td><button class="btn-acao btn-perfil" onclick="abrirModalFerias(${f.id})">Agendar / Histórico</button></td>
        `; tb.appendChild(tr);
    });
}

function filtrarTabelaFerias() { const b = document.getElementById('inputBuscaFerias').value.toLowerCase(); document.querySelectorAll('#tabelaFerias tbody tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(b) ? '' : 'none'); }

function abrirModalFerias(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id); if(!f) return;
    
    document.getElementById('modal-ferias-id').value = id;
    document.getElementById('modal-ferias-nome').innerText = f.nome;
    document.getElementById('modal-saida').value = ''; document.getElementById('modal-retorno').value = ''; document.getElementById('modal-dias').value = '';
    
    let hist = f.controle?.historicoFerias || [];
    let diasTirados = hist.reduce((acc, curr) => acc + Number(curr.dias), 0);
    let diasHaver = 30 - diasTirados;
    document.getElementById('modal-dias-haver').innerText = diasHaver;
    document.getElementById('modal-dias-haver').style.color = diasHaver === 0 ? '#B23434' : '#00C4CC';
    
    let ul = document.getElementById('modal-historico'); ul.innerHTML = '';
    hist.forEach((h, index) => {
        ul.innerHTML += `<li style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E2E8F0;">
            <span>📅 ${formatarDataBR(h.saida)} até ${formatarDataBR(h.retorno)}</span>
            <span><strong style="color:var(--perigo);">- ${h.dias} dias</strong> <button onclick="excluirHistoricoFerias(${id}, ${index})" style="background:none;border:none;color:red;cursor:pointer;margin-left:10px;" title="Excluir">✖</button></span>
        </li>`;
    });
    if(hist.length === 0) ul.innerHTML = '<li style="color:#718096">Nenhum dia tirado neste período.</li>';
    
    document.getElementById('modal-ferias').style.display = 'flex';
}

function fecharModalFerias() { document.getElementById('modal-ferias').style.display = 'none'; }

function calcularDiasModal() {
    const s = document.getElementById('modal-saida').value; const r = document.getElementById('modal-retorno').value;
    if(s && r) {
        const dS = new Date(s + "T00:00:00"); const dR = new Date(r + "T00:00:00");
        const dif = (dR - dS) / (1000 * 3600 * 24); // Diferença de dias
        document.getElementById('modal-dias').value = dif > 0 ? dif : 0;
    }
}

function salvarAgendamentoFerias() {
    const id = Number(document.getElementById('modal-ferias-id').value);
    const saida = document.getElementById('modal-saida').value; const retorno = document.getElementById('modal-retorno').value; const dias = Number(document.getElementById('modal-dias').value);
    
    if(!saida || !retorno || dias <= 0) { mostrarToast('Preencha datas de Saída e Retorno válidas!', 'error'); return; }
    
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const i = fs.findIndex(x => x.id === id);
    if(i !== -1) {
        if(!fs[i].controle) fs[i].controle = {};
        if(!fs[i].controle.historicoFerias) fs[i].controle.historicoFerias = [];
        
        let diasTirados = fs[i].controle.historicoFerias.reduce((acc, curr) => acc + Number(curr.dias), 0);
        if (30 - diasTirados - dias < 0) { mostrarToast('Saldo de dias insuficiente!', 'error'); return; }
        
        fs[i].controle.historicoFerias.push({saida, retorno, dias});
        localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        mostrarToast('Dias descontados com sucesso!');
        abrirModalFerias(id); atualizarTabelaFerias(); atualizarDashboard(fs);
    }
}

function excluirHistoricoFerias(idFunc, indexHist) {
    if(confirm("Cancelar este agendamento e devolver os dias pro saldo?")) {
        let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const i = fs.findIndex(x => x.id === idFunc);
        if(i !== -1 && fs[i].controle?.historicoFerias) {
            fs[i].controle.historicoFerias.splice(indexHist, 1);
            localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
            mostrarToast('Agendamento cancelado. Dias estornados!');
            abrirModalFerias(idFunc); atualizarTabelaFerias(); atualizarDashboard(fs);
        }
    }
}

// --- ALERTAS E DASHBOARD ---
function verificarAlertas(funcionarios) {
    const lista = document.getElementById('lista-alertas'); if(!lista) return; lista.innerHTML = '';
    let temAlerta = false; const hoje = new Date();

    funcionarios.forEach(f => {
        if(f.status === 'Demitido' || !f.dataAdmissao) return;
        const v = new Date(f.dataAdmissao + "T00:00:00"); v.setFullYear(v.getFullYear() + 2); // Limite concessivo
        const difMeses = (v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if(difMeses < 0) { lista.innerHTML += `<li>🚨 <strong>${f.nome}</strong>: Férias vencidas! Sujeito a multa.</li>`; temAlerta = true; }
        else if(difMeses <= 2) { lista.innerHTML += `<li>⚠️ <strong>${f.nome}</strong>: Férias vencendo em breve. Agende logo!</li>`; temAlerta = true; }
    });
    if(!temAlerta) lista.innerHTML = '<li style="color: var(--texto-cinza);">Nenhum alerta de férias no momento.</li>';
}

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

// --- CÓDIGOS BÁSICOS MANTIDOS (DEPENDENTES, CALENDARIO, TABELA EQUIPE, FORMS) ---
let contadorDep = 0;
function adicionarDependente(n='', d='') { contadorDep++; const c = document.getElementById('lista-dependentes-container'); if(!c) return; const div = document.createElement('div'); div.className = 'dependente-item'; div.id = `dep-${contadorDep}`; div.innerHTML = `<div style="flex:2;"><label>Nome</label><input type="text" class="dep-nome" value="${n}"></div><div style="flex:1;"><label>Nasc.</label><input type="date" class="dep-nasc" value="${d}"></div><button type="button" class="btn-acao btn-excluir" onclick="document.getElementById('dep-${contadorDep}').remove()" style="height:48px; margin-bottom:2px;">Remover</button>`; c.appendChild(div); }
function limparDependentes() { const c = document.getElementById('lista-dependentes-container'); if(c) c.innerHTML = ''; contadorDep = 0; }

let dCal = new Date(); let dSelNota = null; const mN = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
function renderizarCalendario() { const mD = document.getElementById('mes-ano-display'); const dG = document.getElementById('dias-grid'); if(!mD||!dG) return; const a = dCal.getFullYear(); const m = dCal.getMonth(); mD.innerText = `${mN[m]} ${a}`; dG.innerHTML = ''; const p = new Date(a, m, 1).getDay(); const u = new Date(a, m + 1, 0).getDate(); const h = new Date(); const notas = JSON.parse(localStorage.getItem('notasCalendario')) || {}; for (let i = 0; i < p; i++) dG.innerHTML += `<div class="dia-cal dia-vazio"></div>`; for (let d = 1; d <= u; d++) { const dtStr = `${a}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; let c = ''; if (d===h.getDate() && m===h.getMonth() && a===h.getFullYear()) c += ' dia-hoje'; if (notas[dtStr] && notas[dtStr].trim() !== '') c += ' tem-nota'; dG.innerHTML += `<div class="dia-cal ${c}" onclick="abrirNotasDia('${dtStr}', ${d})">${d}</div>`; } }
function mudarMes(dir) { dCal.setMonth(dCal.getMonth() + dir); fecharNotasDia(); renderizarCalendario(); }
function abrirNotasDia(dt, d) { dSelNota = dt; document.getElementById('painel-notas-dia').style.display='block'; document.getElementById('titulo-notas-dia').innerText=`Anotações: ${d} ${mN[dCal.getMonth()]}`; document.getElementById('texto-nota-dia').value=(JSON.parse(localStorage.getItem('notasCalendario'))||{})[dt]||''; }
function fecharNotasDia() { document.getElementById('painel-notas-dia').style.display='none'; dSelNota=null; }
function salvarNotaDia() { if(!dSelNota)return; let n = JSON.parse(localStorage.getItem('notasCalendario'))||{}; n[dSelNota]=document.getElementById('texto-nota-dia').value; localStorage.setItem('notasCalendario', JSON.stringify(n)); mostrarToast("Salvo!"); renderizarCalendario(); }

function exportarBackup() { const b = JSON.stringify({ func: JSON.parse(localStorage.getItem('listaFuncionarios')||'[]'), notas: JSON.parse(localStorage.getItem('notasCalendario')||'{}') }); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([b], {type:'application/json'})); a.download = `rh_backup.json`; a.click(); mostrarToast("Exportado!"); }
function importarBackup(e) { const l = new FileReader(); l.onload = (ev) => { try{ const d = JSON.parse(ev.target.result); if(d.func) localStorage.setItem('listaFuncionarios', JSON.stringify(d.func)); if(d.notas) localStorage.setItem('notasCalendario', JSON.stringify(d.notas)); atualizarTabela(); atualizarTabelaFerias(); renderizarCalendario(); mostrarToast("Restaurado!"); }catch(err){mostrarToast("Erro","error");} }; l.readAsText(e.target.files[0]); }

function filtrarTabela() { const b = document.getElementById('inputBusca').value.toLowerCase(); document.querySelectorAll('#tabelaFuncionarios tbody tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(b) ? '' : 'none'); }
function atualizarTabela() {
    const tb = document.querySelector('#tabelaFuncionarios tbody'); if(!tb) return; tb.innerHTML = '';
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; atualizarDashboard(fs);
    fs.forEach(f => {
        const tr = document.createElement('tr'); const sc = (f.status||'Ativo').replace(/\s+/g,'');
        tr.innerHTML = `<td><span class="badge badge-${sc}">${f.status}</span></td><td><strong>${f.nome}</strong><br><small style="color:#718096">${f.cargo||''}</small></td><td><div class="acoes-container"><button class="btn-acao btn-perfil" onclick="verPerfil(${f.id})">Ver Ficha</button><button class="btn-acao btn-editar" onclick="prepararEdicao(${f.id})">Editar</button></div></td>`; tb.appendChild(tr);
    });
}

let idEditando = null;
function prepararEdicao(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id);
    if (f) {
        const sV = (i, v) => { const el = document.getElementById(i); if(el) el.value = v||''; }
        sV('nome', f.nome); sV('cpf', f.cpf); sV('dataNascimento', f.nascimento); sV('dataAdmissao', f.dataAdmissao); sV('statusFunc', f.status); sV('dataDemissao', f.dataDemissao); sV('departamento', f.departamento); sV('cargo', f.cargo); sV('salario', f.salario); sV('nomeMae', f.filiacao?.mae); sV('nomePai', f.filiacao?.pai); sV('rg', f.documentosBasicos?.rg); sV('pis', f.documentosBasicos?.pis); sV('reservista', f.documentosBasicos?.reservista); sV('ctpsNumero', f.documentosBasicos?.ctps?.numero); sV('ctpsSerie', f.documentosBasicos?.ctps?.serie); sV('eleitorNumero', f.documentosBasicos?.eleitor?.numero); sV('eleitorZona', f.documentosBasicos?.eleitor?.zona); sV('eleitorSecao', f.documentosBasicos?.eleitor?.secao); sV('banco', f.dadosBancarios?.banco); sV('agencia', f.dadosBancarios?.agencia); sV('conta', f.dadosBancarios?.conta); sV('chavePix', f.dadosBancarios?.chavePix);
        if (typeof f.endereco === 'object') { sV('cep', f.endereco.cep); sV('logradouro', f.endereco.logradouro); sV('numeroEnd', f.endereco.numero); sV('bairro', f.endereco.bairro); sV('cidade', f.endereco.cidade); sV('uf', f.endereco.uf); } else sV('logradouro', f.endereco);
        sV('decimoStatus', f.controle?.decimoStatus || 'Não Solicitado'); sV('decimoValorAdiantado', f.controle?.decimoValorAdiantado); sV('notasInternas', f.notasInternas);
        limparDependentes(); if(f.dependentes) f.dependentes.forEach(d => adicionarDependente(d.nome, d.nascimento));
        verificarStatus(); idEditando = id; document.getElementById('btnSubmit').textContent = "✨ Salvar Alterações";
        mudarAbaForm('tab-dados'); document.querySelectorAll('.menu-item')[1].click();
    }
}

function verPerfil(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id);
    if (f) {
        const endFmt = typeof f.endereco === 'object' && f.endereco.logradouro ? `${f.endereco.logradouro}, ${f.endereco.numero} - ${f.endereco.bairro}. ${f.endereco.cidade}/${f.endereco.uf}. CEP: ${f.endereco.cep}` : (f.endereco||'-');
        let depHtml = f.dependentes?.length ? f.dependentes.map(d=>`<li><strong>${d.nome}</strong> - Nasc: ${formatarDataBR(d.nascimento)}</li>`).join('') : '<li style="color:#718096;">Nenhum</li>';
        const adc = f.controle?.decimoStatus === 'Adiantado (Novembro)' ? `(R$ ${f.controle.decimoValorAdiantado || '0,00'})` : '';
        
        let hist = f.controle?.historicoFerias || []; let diasTirados = hist.reduce((acc, curr) => acc + Number(curr.dias), 0);
        
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
                <div class="perfil-info" style="background: transparent;"><strong>Férias (Neste Período)</strong><p>Saldo: ${30 - diasTirados} dias</p></div>
                <div class="perfil-info" style="background: transparent;"><strong>Situação 13º</strong><p>${f.controle?.decimoStatus||'-'} <br>${adc}</p></div>
                <div class="perfil-info" style="background: transparent; grid-column: span 2;"><strong>Anotações Internas</strong><p style="white-space: pre-wrap; font-size: 14px; font-weight: normal;">${f.notasInternas || 'Nenhuma anotação.'}</p></div>
            </div>

            <div class="print-signatures-oficial"><div class="linha-assinatura"><hr><p>Assinatura Empregado</p></div><div class="linha-assinatura"><hr><p>Assinatura Empregador</p></div></div>
        `; mudarAba(null, 'tela-perfil');
    }
}

function processarArquivo(input) { return new Promise((resolve) => { if (!input||!input.files||input.files.length===0) resolve(null); else { const l = new FileReader(); l.onload = (e) => resolve({ nome: input.files[0].name, base64: e.target.result }); l.readAsDataURL(input.files[0]); } }); }

const form = document.getElementById('formFuncionario');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); const gV = id => document.getElementById(id)?.value.trim()||'';
        const dArr = []; document.querySelectorAll('.dependente-item').forEach(i => { const n = i.querySelector('.dep-nome').value; if(n) dArr.push({nome:n, nascimento:i.querySelector('.dep-nasc').value}); });
        const aRG = await processarArquivo(document.getElementById('docRG')); const aCTPS = await processarArquivo(document.getElementById('docCTPS'));

        let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
        const nF = {
            id: idEditando !== null ? idEditando : Date.now(),
            nome: gV('nome'), cpf: gV('cpf'), nascimento: gV('dataNascimento'), dataAdmissao: gV('dataAdmissao'), status: gV('statusFunc'), dataDemissao: gV('statusFunc')==='Demitido'?gV('dataDemissao'):'',
            departamento: gV('departamento'), cargo: gV('cargo'), salario: gV('salario'), filiacao: { mae: gV('nomeMae'), pai: gV('nomePai') },
            endereco: { cep: gV('cep'), logradouro: gV('logradouro'), numero: gV('numeroEnd'), bairro: gV('bairro'), cidade: gV('cidade'), uf: gV('uf') },
            documentosBasicos: { rg: gV('rg'), pis: gV('pis'), reservista: gV('reservista'), ctps: { numero: gV('ctpsNumero'), serie: gV('ctpsSerie') }, eleitor: { numero: gV('eleitorNumero'), zona: gV('eleitorZona'), secao: gV('eleitorSecao') } },
            dadosBancarios: { banco: gV('banco'), agencia: gV('agencia'), conta: gV('conta'), chavePix: gV('chavePix') },
            controle: { decimoStatus: gV('decimoStatus'), decimoValorAdiantado: gV('decimoValorAdiantado'), historicoFerias: [] },
            notasInternas: gV('notasInternas'), dependentes: dArr, documentos: {}
        };

        if (idEditando === null) { 
            if (aRG) nF.documentos.rg = aRG; if (aCTPS) nF.documentos.ctps = aCTPS; fs.push(nF); mostrarToast("Ficha salva!"); 
        } else { 
            const i = fs.findIndex(f => f.id === idEditando); 
            if(i !== -1) {
                // Manter histórico de férias antigo no update
                nF.controle.historicoFerias = fs[i].controle?.historicoFerias || [];
                nF.documentos.rg = aRG ? aRG : fs[i].documentos?.rg; nF.documentos.ctps = aCTPS ? aCTPS : fs[i].documentos?.ctps; fs[i] = nF; 
            }
            idEditando = null; document.getElementById('btnSubmit').textContent = "✨ Salvar Ficha Completa"; mostrarToast("Ficha atualizada!"); 
        }

        localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        form.reset(); limparDependentes(); verificarStatus(); atualizarTabela(); atualizarTabelaFerias(); mudarAbaForm('tab-dados'); document.querySelectorAll('.menu-item')[2].click();
    });
}
window.onload = function() { atualizarTabela(); atualizarTabelaFerias(); renderizarCalendario(); };
function exportarListaCSV() {}

// --- LÓGICA DE NAVEGAÇÃO ENTRE AS TELAS ---
function mudarAba(evento, idAbaDestino) {
    // 1. Remove a classe 'ativa' de todos os botões do menu
    const botoesMenu = document.querySelectorAll('.menu-item');
    botoesMenu.forEach(botao => botao.classList.remove('ativo'));

    // 2. Remove a classe 'ativa' de todas as telas (abas)
    const telas = document.querySelectorAll('.aba');
    telas.forEach(tela => tela.classList.remove('ativa'));

    // 3. Se o clique veio do menu lateral, marca o botão como ativo
    if (evento && evento.target && evento.target.classList.contains('menu-item')) {
        evento.target.classList.add('ativo');
    }

    // 4. Mostra a tela de destino
    document.getElementById(idAbaDestino).classList.add('ativa');
}


// --- LÓGICA DO CADASTRO, TABELA E PERFIL ---
const form = document.getElementById('formFuncionario');
const btnSubmit = document.getElementById('btnSubmit');

let idEditando = null;

function atualizarTabela() {
    const tbody = document.querySelector('#tabelaFuncionarios tbody');
    tbody.innerHTML = ''; 

    let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];

    // Atualiza o contador do Dashboard
    document.getElementById('contador-funcionarios').innerText = funcionariosSalvos.length;

    funcionariosSalvos.forEach(function(func) {
        const tr = document.createElement('tr');

        const partesData = func.dataAdmissao.split('-');
        const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : func.dataAdmissao;
        const salarioFormatado = parseFloat(func.salario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let linkDoc = '<span style="color: #a0aec0; font-size: 12px;">Sem anexo</span>';
        if (func.documento) {
            linkDoc = `<a href="${func.documento}" download="doc_${func.nome.replace(/\s+/g, '_')}" class="link-documento">Baixar</a>`;
        }

        // NOVIDADE: Botão 'Ver Perfil' adicionado
        tr.innerHTML = `
            <td><strong>${func.nome}</strong></td>
            <td>${func.cpf}</td>
            <td>${func.cargo}</td>
            <td>${func.departamento}</td>
            <td>${dataFormatada}</td>
            <td>${salarioFormatado}</td>
            <td>${linkDoc}</td>
            <td>
                <div class="acoes-container">
                    <button class="btn-acao btn-perfil" onclick="verPerfil(${func.id})">Ver Perfil</button>
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
        let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
        funcionariosSalvos = funcionariosSalvos.filter(func => func.id !== id);
        localStorage.setItem('listaFuncionarios', JSON.stringify(funcionariosSalvos));
        atualizarTabela();
    }
}

function prepararEdicao(id) {
    let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcionariosSalvos.find(f => f.id === id);

    if (func) {
        document.getElementById('nome').value = func.nome;
        document.getElementById('cpf').value = func.cpf;
        document.getElementById('dataAdmissao').value = func.dataAdmissao;
        document.getElementById('departamento').value = func.departamento;
        document.getElementById('cargo').value = func.cargo;
        document.getElementById('salario').value = func.salario;
        
        idEditando = id;
        
        btnSubmit.textContent = "Salvar Alterações";
        btnSubmit.style.background = "linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)";
        
        // Simula o clique no menu para ir para a tela de Admissão
        document.querySelectorAll('.menu-item')[1].click();
    }
}

// NOVIDADE: Função que monta a ficha completa do funcionário e troca para a tela do perfil
function verPerfil(id) {
    let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
    const func = funcionariosSalvos.find(f => f.id === id);

    if (func) {
        const conteinerPerfil = document.getElementById('conteudo-perfil');

        const partesData = func.dataAdmissao.split('-');
        const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : func.dataAdmissao;
        const salarioFormatado = parseFloat(func.salario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Prepara a área do documento
        let areaDocHTML = '<p style="color: #a0aec0;">Nenhum documento anexado para este funcionário.</p>';
        if (func.documento) {
            areaDocHTML = `
                <p style="margin-bottom: 15px; color: #4a5568; font-weight: 600;">Documento Armazenado</p>
                <a href="${func.documento}" download="doc_${func.nome.replace(/\s+/g, '_')}" class="btn-cadastrar" style="display: inline-block; text-decoration: none; width: auto; padding: 10px 20px;">
                    📥 Baixar Arquivo Anexo
                </a>
            `;
        }

        // Monta a ficha completa
        conteinerPerfil.innerHTML = `
            <h2 style="margin-bottom: 5px; font-size: 24px; color: #2b6cb0;">${func.nome}</h2>
            <p style="color: #718096; font-size: 16px;">${func.cargo} • Departamento de ${func.departamento}</p>
            
            <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;">

            <div class="perfil-grid">
                <div class="perfil-info">
                    <strong>CPF</strong>
                    <p>${func.cpf}</p>
                </div>
                <div class="perfil-info">
                    <strong>Data de Admissão</strong>
                    <p>${dataFormatada}</p>
                </div>
                <div class="perfil-info">
                    <strong>Salário Bruto</strong>
                    <p>${salarioFormatado}</p>
                </div>
            </div>

            <div class="area-documento">
                ${areaDocHTML}
            </div>
        `;

        // Navega para a tela de perfil
        mudarAba(null, 'tela-perfil');
    }
}

// Inicia a tabela assim que a página carrega
window.onload = atualizarTabela;

// Lida com o envio do formulário de cadastro/edição
form.addEventListener('submit', function(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const dataAdmissao = document.getElementById('dataAdmissao').value;
    const departamento = document.getElementById('departamento').value.trim();
    const cargo = document.getElementById('cargo').value.trim();
    const salario = document.getElementById('salario').value;
    const documentoInput = document.getElementById('documento');

    if (!nome || !cpf || !dataAdmissao || !departamento || !cargo || !salario) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    function salvarDados(documentoBase64 = null) {
        let funcionariosSalvos = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];

        if (idEditando === null) {
            // É um novo cadastro
            const novoFuncionario = {
                id: Date.now(),
                nome: nome,
                cpf: cpf,
                dataAdmissao: dataAdmissao,
                departamento: departamento,
                cargo: cargo,
                salario: salario,
                documento: documentoBase64
            };
            funcionariosSalvos.push(novoFuncionario);
        } else {
            // É uma edição
            const index = funcionariosSalvos.findIndex(f => f.id === idEditando);
            if (index !== -1) {
                funcionariosSalvos[index].nome = nome;
                funcionariosSalvos[index].cpf = cpf;
                funcionariosSalvos[index].dataAdmissao = dataAdmissao;
                funcionariosSalvos[index].departamento = departamento;
                funcionariosSalvos[index].cargo = cargo;
                funcionariosSalvos[index].salario = salario;
                // Atualiza o documento apenas se um novo for selecionado
                if (documentoBase64) {
                    funcionariosSalvos[index].documento = documentoBase64;
                }
            }
            
            idEditando = null;
            btnSubmit.textContent = "Cadastrar Funcionário";
            btnSubmit.style.background = "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)";
        }

        localStorage.setItem('listaFuncionarios', JSON.stringify(funcionariosSalvos));
        form.reset();
        atualizarTabela(); 
        
        // Simula o clique para voltar para a tela de Equipe após salvar
        document.querySelectorAll('.menu-item')[2].click();
    }

    // Checa se tem arquivo para converter
    if (documentoInput.files.length > 0) {
        const arquivo = documentoInput.files[0];
        const leitor = new FileReader();
        leitor.onload = function(e) {
            salvarDados(e.target.result);
        };
        leitor.readAsDataURL(arquivo);
    } else {
        salvarDados(null);
    }
});

// --- LÓGICA DE NAVEGAÇÃO ENTRE AS TELAS ---
function mudarAba(evento, idAbaDestino) {
    // 1. Remove a classe 'ativa' de todos os botões do menu
    const botoesMenu = document.querySelectorAll('.menu-item');
    botoesMenu.forEach(botao => botao.classList.remove('ativo'));

    // 2. Remove a classe 'ativa' de todas as telas (abas)
    const telas = document.querySelectorAll('.aba');
    telas.forEach(tela => tela.classList.remove('ativa'));

    // 3. Adiciona a classe 'ativa' no botão clicado e na tela de destino
    evento.target.classList.add('ativo');
    document.getElementById(idAbaDestino).classList.add('ativa');
}


// --- LÓGICA DO CADASTRO E TABELA ---
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

        // NOVIDADE: Botão 'Ver Perfil' adicionado na frente
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

// NOVIDADE: Função base para abrir o perfil (fará o trabalho na próxima etapa)
function verPerfil(id) {
    alert("Em breve! Esta função vai abrir o perfil completo e os documentos do funcionário.");
}

window.onload = atualizarTabela;

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
            const index = funcionariosSalvos.findIndex(f => f.id === idEditando);
            if (index !== -1) {
                funcionariosSalvos[index].nome = nome;
                funcionariosSalvos[index].cpf = cpf;
                funcionariosSalvos[index].dataAdmissao = dataAdmissao;
                funcionariosSalvos[index].departamento = departamento;
                funcionariosSalvos[index].cargo = cargo;
                funcionariosSalvos[index].salario = salario;
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

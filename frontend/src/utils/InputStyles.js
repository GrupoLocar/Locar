export const getInputStyle = (campo) => {
    const larguras = {
        // Funcionarios
        nome: '250px', sexo: '120px', profissao: '250px', situacao: '120px', contrato: '120px', admissao: '120px',  telefone: '130px', email: '250px', endereco: '250px', complemento: '250px', bairro: '250px', municipio: '250px', cep: '100px', banco: '250px', agencia: '100px', conta: '250px', pix: '250px', cpf: '130px', rg: '110px', estado_civil: '120px', estado: '6ch', filhos: '41px', cnh: '120px', categoria: '120px', nome_familiar: '300px', contato_familiar: '130px', indicado: '250px', observacao: '250px',
        // Adicionados campos tipo date
        data_admissao: '130px', data_demissao: '130px', data_nascimento: '130px', emissao_cnh: '130px', validade_cnh: '130px', pj: '24px',
        // Clientes
        cnpj: '160px', insc_estadual: '110px', cliente: '250px', razao_socal: '250px', razao_social: '250px', responsavel: '250px',
        cargo: '250px', cidade: '250px',
        // Filial
        filial: '120px', distrital: '260px',
        // Requerimento de Funcionário
        dataSolicitacao: '250px', qtd: '50px', prioridade: '100px'
    };
    return { width: larguras[campo] || '80px' };
};

describe('Fluxo de Coleta - Censo CEEP', () => {
  beforeEach(() => {
    cy.visit('/coleta', {
      onBeforeLoad(win) {
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          nomeCompleto: 'Pesquisador Teste CEEP',
          email: 'pesquisador@ceep.edu.br',
          papel: 'entrevistador_aluno',
          turmaOuCargo: '3º Ano Informática',
          genero: 'feminino',
          avatarUrl: '',
        };
        win.localStorage.setItem(
          'ceep_offline_session',
          JSON.stringify({ id: mockUser.id, user: { id: mockUser.id, email: mockUser.email } })
        );
        win.localStorage.setItem('ceep_test_user', JSON.stringify(mockUser));
      },
    });
  });

  it('deve bloquear envio com campos obrigatorios vazios', () => {
    cy.contains('Nova Ficha de Coleta').click();

    // Tenta salvar direto sem preencher nada
    cy.contains('Salvar Ficha do Censo').click();

    // O form usa validação HTML5 "required", logo o modal permanece aberto e a msg de sucesso não existe
    cy.contains('Ficha Registrada com Sucesso!').should('not.exist');
    cy.get('form').should('be.visible');
  });

  it('deve permitir preencher os campos obrigatorios e salvar em modo offline', () => {
    cy.contains('Nova Ficha de Coleta').click();

    // Simula estar offline
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', { value: false, configurable: true });
      win.dispatchEvent(new Event('offline'));
    });

    cy.get('#modal-nome').type('Ada Lovelace');
    cy.get('#modal-whatsapp').type('75999999999');
    cy.get('#modal-serie').type('3º Ano Técnico');
    cy.get('#modal-turma').type('Informática A');

    // Submete o formulário
    cy.contains('Salvar Ficha do Censo').click();

    // Como estamos offline, deve aparecer a mensagem de fallback (salvo localmente)
    cy.contains('Salva localmente com segurança no dispositivo').should('be.visible');
  });
});

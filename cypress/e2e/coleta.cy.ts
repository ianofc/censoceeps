describe('Fluxo de Coleta - Censo CEEP', () => {
  beforeEach(() => {
    cy.visit('/coleta');
  });

  it('deve bloquear envio com campos obrigatorios vazios', () => {
    // Tenta clicar no botão "Nova Ficha de Coleta" para abrir o modal
    // Note: Em Home.tsx, o botão não aparece para gestores/admins, então assumimos perfil padrão de Pesquisador
    cy.contains('Nova Ficha de Coleta').click();
    
    // Tenta salvar direto sem preencher nada
    cy.contains('Salvar Ficha do Censo').click();

    // Como o form do browser usa a validação padrão de input "required", 
    // um jeito de testar é verificar se o modal não foi fechado e se a msg de sucesso não apareceu
    cy.contains('Ficha Registrada com Sucesso!').should('not.exist');
    cy.get('form').should('be.visible');
  });

  it('deve permitir fechar o modal e testar o edge case de salvar online/offline', () => {
    cy.contains('Nova Ficha de Coleta').click();
    
    // Simula estar offline
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', { value: false });
      win.dispatchEvent(new Event('offline'));
    });

    cy.get('#modal-nome').type('Ada Lovelace');
    cy.get('#modal-whatsapp').type('75999999999');
    
    // Submete o formulário
    cy.contains('Salvar Ficha do Censo').click();

    // Como estamos offline, deve aparecer a mensagem de fallback (salvo localmente)
    cy.contains('Salva localmente com segurança no dispositivo').should('be.visible');
  });
});

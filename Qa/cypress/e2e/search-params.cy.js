
describe('SEARCH | Parámetros del radar', () => {

  beforeEach(() => {
    cy.visit('/login');

    cy.get('#email')
      .clear()
      .type('valeria.rios@repusense.io');

    cy.get('#password')
      .clear()
      .type('repusense');

    cy.contains('button', 'Iniciar sesión').click();

    cy.location('pathname').should('eq', '/');

    cy.contains('button', 'Lanzar escaneo radar')
      .should('be.visible')
      .click();

    cy.location('pathname').should('include', '/nueva-busqueda');
  });

  it('TC-SEARCH-01 | La calificación permite configurar el rango requerido de 1.5 a 3.5', () => {
    cy.get('input[type="range"]')
      .eq(0)
      .should('have.attr', 'min', '1.5')
      .and('have.attr', 'max', '3.5');
  });

  it('TC-SEARCH-02 | El mínimo de reseñas permitido es 10', () => {
    cy.get('input[type="range"]')
      .eq(1)
      .should('have.attr', 'min', '10');
  });

});

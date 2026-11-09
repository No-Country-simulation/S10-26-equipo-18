/// <reference types="cypress" />

/**
 * Evidencia QA — Verificación de conexión a Browserless en scraper_service.py
 * y diagnóstico del bloqueo de escaneo en Render.
 */
describe('QA Evidencia | Verificación de Browserless en scraper_service.py', () => {

  it('TC-BROWSERLESS-01 | Documentar que scraper_service.py:364 usa p.chromium.launch local en lugar de connect_over_cdp(BROWSERLESS_URL)', () => {
    cy.readFile('../Back/app/services/scraper_service.py', 'utf-8').then((contenido) => {
      const lineas = contenido.split(/\r?\n/);
      const linea364 = (lineas[363] || '').trim();

      cy.log(`Línea 364 actual en scraper_service.py: ${linea364}`);

      // Evidencia 1: En la línea 364 todavía está el lanzamiento de navegador local
      expect(
        linea364,
        'Evidencia: la línea 364 de scraper_service.py lanza Chromium localmente'
      ).to.eq('browser = p.chromium.launch(headless=headless_mode)');

      // Evidencia 2: Aún no se ha reemplazado por la conexión remota a Browserless
      const usaBrowserless = contenido.includes('connect_over_cdp') && contenido.includes('BROWSERLESS_URL');
      expect(
        usaBrowserless,
        'Diagnóstico: falta reemplazar p.chromium.launch por p.chromium.connect_over_cdp(BROWSERLESS_URL)'
      ).to.be.false;
    });
  });

  it('TC-BROWSERLESS-02 | Verificar en Vercel que los 200 leads de Supabase están activos mientras queda pendiente conectar Browserless en Render', () => {
    cy.visit('https://s10-26-equipo-18.vercel.app/login');

    cy.get('#email')
      .should('be.visible')
      .clear()
      .type('valeria.rios@repusense.io');

    cy.get('#password')
      .should('be.visible')
      .clear()
      .type('repusense');

    cy.contains('button', 'Iniciar sesión')
      .should('be.visible')
      .click();

    cy.location('pathname', { timeout: 15000 }).should('eq', '/');

    // Verificar que el Dashboard carga con los 200 leads desde Supabase (con margen para cold-start de Render)
    cy.contains('Leads totales', { timeout: 60000 }).should('be.visible');
    cy.contains('200', { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Lanzar escaneo radar').should('be.visible');

    cy.screenshot('evidencia-vercel-supabase-200-leads');
  });

});

import { test, expect } from '@playwright/test';

test('P0 produção: contrato público e checkout por idioma', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Read-only monitoring: suppress analytics and prohibit mutations.
  await page.route('**/*', route => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
    if (new URL(route.request().url()).pathname.includes('/analytics/')) return route.fulfill({ status: 204 });
    return route.abort();
  });
  const response = await request.get('/api/backend/hotsite/languages/');
  expect(response.status()).toBe(200);
  const { results: languages } = await response.json();
  expect(languages.length).toBeGreaterThan(0);
  for (const language of languages) {
    const offersResponse = await request.get(`/api/backend/hotsite/offers/?language=${language.id}`);
    expect(offersResponse.status()).toBe(200);
    const { results: offers } = await offersResponse.json();
    expect(offers.length).toBeGreaterThan(0);
    expect(new Set(offers.map((offer: { id: number }) => offer.id)).size).toBe(offers.length);
    for (const offer of offers) {
      expect(Array.isArray(offer.student_classes)).toBe(true);
      expect(offer.student_classes.length).toBeGreaterThan(0);
      expect(Array.isArray(offer.billing_options)).toBe(true);
    }
    await page.goto('/checkout');
    await page.getByRole('button', { name: new RegExp(language.name) }).click();
    const cards = page.getByRole('button').filter({ has: page.getByText('Horários disponíveis', { exact: true }) });
    await expect(cards).toHaveCount(offers.length);
    await cards.first().click();
    await expect(page.getByRole('heading', { name: 'Escolha a turma', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Filtrar turmas por dia da semana' })).toBeVisible();
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  }
  expect(errors).toEqual([]);
});

test('P0 produção: portal do aluno protege páginas privadas', async ({ page }) => {
  await page.route('**/*', route => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
    return route.abort();
  });
  await page.goto('https://aluno.escolaveli.com/financeiro');
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByRole('button', { name: 'Entrar na conta' })).toBeVisible();
});

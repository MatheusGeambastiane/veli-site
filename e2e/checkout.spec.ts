import { test, expect, type Page } from '@playwright/test';

const course = { id: 1, name: 'Inglês iniciante', description: 'Aulas de inglês', language: { id: 2, name: 'Inglês', lang_icon: '/globe.svg' }, levels: [{ id: 1, level: 'A1' }] };
const classes = [
  { id: 1, course, days_of_week: ['Mon', 'Wed'], time: '09:00:00', start_date: '01/01/2027', finish_date: '31/12/2027', is_active: true, is_generic: false },
  { id: 2, course, days_of_week: ['Sat'], time: '11:00:00', start_date: '01/01/2027', finish_date: '31/12/2027', is_active: true, is_generic: false },
];
const billing = [
  { id: 1, code: 'UPFRONT_CREDIT_CARD', type: 'one_time', cycle: 'none', billing_method: 'credit_card', price: '1200.00', allowed_installments: [1, 12], is_active: true },
  { id: 2, code: 'UPFRONT_PIX', type: 'one_time', cycle: 'none', billing_method: 'pix', price: '1140.00', allowed_installments: [1], is_active: true },
];
const offer = { id: 1, name: 'Plano anual teste', price: '1200.00', access_duration_days: 365, student_classes: classes, billing_options: billing };
const paginated = (results: unknown[]) => ({ count: results.length, next: null, previous: null, results });

async function catalog(page: Page, options: { legacy?: boolean; pixOnly?: boolean; empty?: boolean; failOnce?: boolean; description?: string } = {}) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let requests = 0;
  let details = 0;
  const current = { ...offer, description: options.description, billing_options: options.pixOnly ? [billing[1]] : billing };
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({ json: { authenticated: false } });
    if (!url.pathname.startsWith('/api/backend/')) return route.continue();
    if (url.pathname.endsWith('/hotsite/languages/')) return route.fulfill({ json: paginated([{ id: 2, name: 'Inglês', image: '/globe.svg' }]) });
    if (url.pathname.endsWith('/hotsite/offers/')) {
      requests++;
      if (options.failOnce && requests === 1) return route.fulfill({ status: 503, json: { detail: 'Catálogo temporariamente indisponível' } });
      const results = options.empty ? [] : options.legacy ? classes.map(c => ({ id: 1, student_class_id: c.id, course, price: '1200.00' })) : [current];
      return route.fulfill({ json: paginated(results) });
    }
    if (url.pathname.endsWith('/hotsite/offers/1/')) { details++; return route.fulfill({ json: current }); }
    if (url.pathname.includes('/analytics/')) return route.fulfill({ status: 204 });
    return route.fulfill({ status: 500, json: { detail: `Unexpected test request: ${url.pathname}` } });
  });
  await page.goto('/checkout');
  await page.getByRole('button', { name: /Inglês/ }).click();
  return { errors, details: () => details };
}

const offerCard = (page: Page) => page.getByRole('button').filter({ has: page.getByText('Horários disponíveis', { exact: true }) });

test('P0 idioma → oferta agrupada → cartão → identificação', async ({ page }) => {
  const state = await catalog(page);
  await expect(offerCard(page)).toHaveCount(1);
  await expect(offerCard(page)).toContainText(/12x R\$\s*100,00/);
  await expect(offerCard(page)).toContainText('Segunda-feira');
  await expect(offerCard(page)).toContainText('Quarta-feira');
  await expect(offerCard(page)).toContainText('Sábado');
  await offerCard(page).click();
  await expect(page.getByRole('heading', { name: 'Escolha a turma' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cartão', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Finalize sua matrícula' })).toBeVisible();
  expect(state.errors).toEqual([]);
});

test('P0 API antiga não derruba o checkout nem duplica ofertas', async ({ page }) => {
  const state = await catalog(page, { legacy: true });
  await expect(offerCard(page)).toHaveCount(1);
  await expect(offerCard(page)).toContainText('Sábado');
  expect(state.details()).toBe(1);
  expect(state.errors).toEqual([]);
});

test('Pix mostra preço com desconto e economia em reais e percentual ao selecionar', async ({ page }) => {
  await catalog(page);
  await offerCard(page).click();
  const pix = page.getByRole('button', { name: /^Pix / });
  await expect(pix).toContainText(/R\$\s*1\.140,00/);
  await expect(pix).toContainText('5% de desconto no Pix');
  await expect(pix).toHaveAttribute('aria-pressed', 'false');
  await pix.click();
  await expect(pix).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toContainText(/economiza R\$\s*60,00 \(5%\)/);
  await expect(page.locator('aside')).toContainText(/R\$\s*1\.140,00/);
  await page.getByRole('button', { name: 'Cartão', exact: true }).click();
  await expect(page.getByText(/No Pix, você economiza/)).toHaveCount(0);
  await expect(page.locator('aside')).toContainText(/Valor total: R\$\s*1\.200,00/);
});

test('P0 oferta somente Pix não anuncia parcelamento', async ({ page }) => {
  await catalog(page, { pixOnly: true });
  await expect(offerCard(page)).toContainText(/R\$\s*1\.200,00/);
  await expect(offerCard(page)).not.toContainText('12x');
});

test('P1 filtrar dia remove seleção escondida e permite nova turma', async ({ page }) => {
  await catalog(page);
  await offerCard(page).click();
  await page.getByRole('button', { name: 'Sab', exact: true }).click();
  const classes = page.getByRole('group', { name: 'Turmas disponíveis', exact: true }).getByRole('button').filter({ hasText: 'Professor:' });
  await expect(classes).toHaveCount(1);
  await expect(classes.first()).toContainText('11:00');
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeDisabled();
  await classes.first().click();
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(classes).toHaveCount(2);
});

test('P1 preferência de período permite prosseguir sem escolher turma', async ({ page }) => {
  await catalog(page);
  await offerCard(page).click();
  await page.getByRole('button', { name: 'Não quero esses horários' }).click();
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /Manhã/ }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Finalize sua matrícula' })).toBeVisible();
});

test('P1 erro de API apresenta recuperação sem quebrar a página', async ({ page }) => {
  const state = await catalog(page, { failOnce: true });
  await expect(page.getByText('Catálogo temporariamente indisponível')).toBeVisible();
  await page.getByRole('button', { name: /Tentar novamente/ }).click();
  await expect(offerCard(page)).toHaveCount(1);
  expect(state.errors).toEqual([]);
});

test('P2 catálogo vazio apresenta mensagem e permite trocar idioma', async ({ page }) => {
  await catalog(page, { empty: true });
  await expect(page.getByText(/Não encontramos cursos de/)).toBeVisible();
  await page.getByRole('button', { name: 'Trocar idioma' }).click();
  await expect(page.getByRole('button', { name: /Inglês/ })).toBeVisible();
});


test('Descrição da oferta aparece em negrito abaixo do curso', async ({ page }) => {
  const description = 'Material complementar incluído.\nConversação semanal.';
  await catalog(page, { description });
  const card = offerCard(page);
  const offerDescription = card.getByText(description);
  await expect(offerDescription).toBeVisible();
  await expect(offerDescription).toHaveCSS('font-weight', '700');
  const courseBox = await card.getByText(course.description, { exact: true }).boundingBox();
  const offerBox = await offerDescription.boundingBox();
  expect(courseBox).not.toBeNull();
  expect(offerBox).not.toBeNull();
  expect(offerBox!.y).toBeGreaterThan(courseBox!.y);
  await expect(card).not.toContainText('Aulas gravadas e uma aula ao vivo de 60 minutos');
});

test('Oferta sem descrição não mostra o texto padrão', async ({ page }) => {
  await catalog(page);
  await expect(offerCard(page)).toBeVisible();
  await expect(offerCard(page)).not.toContainText('Aulas gravadas e uma aula ao vivo de 60 minutos');
});

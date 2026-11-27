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

async function catalog(page: Page, options: { legacy?: boolean; pixOnly?: boolean; empty?: boolean; failOnce?: boolean; description?: string; recurring?: boolean; recurringStartMonth?: string; monthlyPrice?: string } = {}) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let requests = 0;
  let details = 0;
  const current = {
    ...offer,
    description: options.description,
    recurring_start_month: options.recurring ? options.recurringStartMonth ?? '2027-02-01' : null,
    billing_options: options.recurring ? [
      ...billing,
      { id: 3, code: 'MONTHLY_CARD', type: 'recurring', cycle: 'monthly', billing_method: 'credit_card', price: options.monthlyPrice ?? '100.00', allowed_installments: [1], is_active: true },
      { id: 4, code: 'MONTHLY_PIX', type: 'recurring', cycle: 'monthly', billing_method: 'pix', price: options.monthlyPrice ?? '100.00', allowed_installments: [1], is_active: true },
    ] : options.pixOnly ? [billing[1]] : billing,
  };
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
    if (url.pathname.endsWith('/hotsite/offers/1/validate-coupon/')) {
      const payload = route.request().postDataJSON() as { billing_option_code: string; coupon_code: string };
      const selected = current.billing_options.find(option => option.code === payload.billing_option_code)!;
      const installments = selected.type === 'recurring' ? 12 : 1;
      const amountOriginal = Number(selected.price) * installments;
      const amountTotal = amountOriginal - 100;
      return route.fulfill({ json: {
        offer_id: 1,
        billing_option_code: selected.code,
        amount_original: amountOriginal.toFixed(2),
        discount_amount: '100.00',
        amount_total: amountTotal.toFixed(2),
        coupon_code: payload.coupon_code,
        installments,
        installment_amount: (amountTotal / installments).toFixed(2),
      } });
    }
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

test('seletor não oferece pagamento agora mais 11 mensalidades', async ({ page }) => {
  const state = await catalog(page, { recurring: true });
  await offerCard(page).click();
  await expect(page.getByRole('button', { name: 'Agora + 11 mensalidades' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mensal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Único', exact: true })).toBeVisible();
  const recurringInfo = page.getByLabel('A primeira mensalidade é cobrada no momento da contratação e, em seguida, é criada a recorrência para as próximas cobranças mensais.');
  await recurringInfo.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  expect(state.errors).toEqual([]);
});

test('cupom mensal desconta o total anual e rateia o saldo em 12 cobranças', async ({ page }) => {
  await catalog(page, { recurring: true, monthlyPrice: '89.00' });
  await offerCard(page).click();
  await page.getByRole('button', { name: 'Mensal', exact: true }).click();
  await page.getByRole('button', { name: 'Tenho um cupom' }).click();
  await page.getByLabel('Código do cupom').fill('ANUAL100');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();

  const summary = page.locator('aside');
  await expect(summary).toContainText(/12x de R\$\s*80,67/);
  await expect(summary).toContainText(/Valor total: R\$\s*968,00/);
  await expect(summary).toContainText(/economia de R\$\s*100,00/);
});

test('mês recorrente inválido não derruba o checkout', async ({ page }) => {
  const state = await catalog(page, { recurring: true, recurringStartMonth: '02/2027' });
  await offerCard(page).click();
  await expect(page.getByRole('heading', { name: 'Escolha a turma' })).toBeVisible();
  expect(state.errors).toEqual([]);
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

for (const { manual, pix } of [{ manual: false, pix: true }, { manual: true, pix: true }, { manual: false, pix: false }]) {
  test(`${pix ? "Pix Automático" : "Cartão"} segue para pagamento ${manual ? 'pelo botão' : 'após cinco segundos'}`, async ({ page }) => {
    let paid = false;
    const order = {
      order_id: 51, payment_type: pix ? 'pix' : 'credit', payment_mode: 'one_time', amount_due: '100.00',
      enrollment_billing_method: pix ? 'pix' : 'credit_card', enrollment_card_reuse: false, enrollment_gateway: 'abacatepay',
      enrollment_monthly_amount: '100.00', automatic_pix: pix,
    };
    let attempts = 0;
    await page.route('**/api/auth/session', route => route.fulfill({ json: { authenticated: true } }));
    await page.route('**/api/backend/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/orders/51/')) return route.fulfill({ json: order });
      if (path.endsWith('/payment-status/')) return route.fulfill({ json: {
        ...order, is_paid: paid, payment_status: paid ? 'paid' : 'pending',
        enrollment_first_due_date: paid ? '2027-01-27' : null, immediate_subscription: paid,
      } });
      if (path.endsWith('/start-payment/')) {
        const data = route.request().postDataJSON();
        expect(data).toMatchObject({ accept_contract: true, accept_recurring: true, gateway_choice: 'abacatepay' });
        expect(data).not.toHaveProperty('card_token');
        attempts++;
        return route.fulfill({ json: { checkout_url: 'https://gateway.example.test/pix' } });
      }
      return route.fulfill({ json: {} });
    });
    await page.route('https://gateway.example.test/pix', route => route.fulfill({ body: 'Pix Automático' }));
    await page.clock.install();
    await page.goto('/checkout?order=51');
    await expect(page.getByText(/Você será redirecionado para o pagamento/)).toBeVisible();
    const next = page.getByRole('button', { name: 'Seguir para pagamento' });
    await expect(next).toBeEnabled();
    await expect(page.getByText('Ao prosseguir, você concorda com o termo de adesão.')).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await page.clock.runFor(4000);
    await expect(page.getByText('1s', { exact: true })).toBeVisible();
    expect(attempts).toBe(0);
    if (manual) await next.click();
    else await page.clock.runFor(1000);
    await expect(page).toHaveURL('https://gateway.example.test/pix');
    paid = true;
    await page.goto('/checkout?order=51');
    await expect(page.getByRole('heading', { name: 'Sua matrícula está confirmada' })).toBeVisible();
    await expect(page.getByText(/segundo QR code/i)).toHaveCount(0);
    expect(attempts).toBe(1);
  });
}

for (const method of ['credit', 'pix']) {
  test(`Mensalidade no ${method} aguarda o gateway e retoma pelo link validado`, async ({ page }) => {
    const order = { order_id: 61, offer_name: 'Plano mensal', created_at: '2026-11-27T10:00:00Z',
      status: 'waiting_payment', checkout_status: 'pending_payment', payment_status: 'pending', payment_type: method, payment_mode: 'monthly', amount_due: '100.00',
      enrollment_checkout_url: 'https://gateway.example.test/expirado' };
    let releaseConfig!: () => void;
    const configReady = new Promise<void>(resolve => { releaseConfig = resolve; });
    await page.route('**/api/auth/session', route => route.fulfill({ json: { authenticated: true } }));
    await page.route('**/api/backend/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/hotsite/orders/')) return route.fulfill({ json: { count: 1, results: [order] } });
      if (path.endsWith('/orders/61/')) return route.fulfill({ json: order });
      if (path.endsWith('/payment-status/')) return route.fulfill({ json: { ...order, payment_status: 'pending' } });
      if (path.endsWith('/payments/config/')) {
        await configReady;
        return route.fulfill({ json: { gateway: 'abacatepay', checkout_mode: 'hosted' } });
      }
      if (path.endsWith('/start-payment/')) return route.fulfill({ json: { checkout_url: 'https://gateway.example.test/valido' } });
      return route.fulfill({ json: {} });
    });
    await page.route('https://gateway.example.test/valido', route => route.fulfill({ body: 'Pagamento' }));
    const pending = page.waitForRequest(req => req.url().includes('/payments/config/'));
    await page.goto('/meus-pedidos');
    await page.getByRole('link', { name: 'Seguir para o pagamento' }).click();
    await pending;
    await expect(page.locator('#card-number')).toHaveCount(0);
    await expect(page.getByText('Revise antes de gerar o PIX')).toHaveCount(0);
    releaseConfig();
    await page.getByRole('button', { name: 'Seguir para pagamento' }).click();
    await expect(page).toHaveURL('https://gateway.example.test/valido');
  });
}

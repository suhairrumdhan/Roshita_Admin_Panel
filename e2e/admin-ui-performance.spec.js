import {expect, test} from '@playwright/test';
import {performance} from 'node:perf_hooks';
import fs from 'node:fs';

const email = process.env.ADMIN_TEST_EMAIL;
const password = process.env.ADMIN_TEST_PASSWORD;
const samples = {};
const resultPath = process.env.ADMIN_UI_RESULT_PATH;

function saveCheckpoint() {
  if (resultPath) fs.writeFileSync(resultPath, `${JSON.stringify({browser: 'Chrome', viewport: '1920x1080', samples}, null, 2)}\n`);
}

async function loadPage(page, route, ready) {
  const started = performance.now();
  await page.goto(route);
  await ready();
  return performance.now() - started;
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {runs: values.length, averageMs: +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2),
    maxMs: +Math.max(...values).toFixed(2), p95Ms: +sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(2), errorRate: 0,
    samplesMs: values.map((value) => +value.toFixed(2))};
}

test('TC-ADM-P01..P04 browser presentation timings on isolated Firebase Emulator', async ({page, context}) => {
  test.setTimeout(420000);
  page.on('response', async (response) => {
    if (!response.url().includes('/adminList')) return;
    let summary = '';
    try {
      const body = await response.json();
      const result = body?.result || body;
      summary = ` total=${result?.total} rows=${result?.rows?.length} error=${result?.error?.message || body?.error?.message || ''}`;
    } catch (error) { summary = ` response-read=${error.message}`; }
    console.log(`ADMIN_LIST_UI_RESPONSE status=${response.status()}${summary}`);
  });
  test.skip(!email || !password, 'Synthetic Emulator credentials were not supplied.');
  saveCheckpoint();
  await page.setViewportSize({width: 1920, height: 1080});
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto('/');
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(password);
  await page.getByRole('button', {name: 'دخول آمن'}).click();
  // Fixture seeding can enqueue one-time projection work in the Emulator.
  // Wait for that warm-up here; measured samples start only afterwards.
  await expect(page.getByRole('heading', {name: 'الرئيسية', exact: true})).toBeVisible({timeout: 120000});

  const dashboard = [];
  for (let i = 0; i < 10; i += 1) dashboard.push(await loadPage(page, '/', () =>
    expect(page.getByRole('heading', {name: 'الرئيسية', exact: true})).toBeVisible({timeout: 30000})));
  samples['TC-ADM-P01 dashboard visible'] = summarize(dashboard);
  saveCheckpoint();

  for (const [kind, route, heading, searchPlaceholder] of [
    ['requests', '/requests', 'طلبات تسجيل الصيدليات', 'بداية اسم الصيدلية أو المالك أو الترخيص'],
    ['orders', '/orders', 'متابعة الطلبات', 'بداية رقم الطلب أو الصيدلية'],
    ['pharmacies', '/pharmacies', 'الصيدليات', 'بداية الاسم أو الترخيص أو الهاتف'],
  ]) {
    const timings = [];
    for (let i = 0; i < 10; i += 1) {
      await page.goto(route);
      await expect(page.getByRole('heading', {name: heading, exact: true})).toBeVisible({timeout: 30000});
      const input = page.getByPlaceholder(searchPlaceholder);
      await expect(input).toBeVisible();
      const started = performance.now();
      await input.fill('admperf');
      await expect(page.locator('.request-pagination').getByText('الإجمالي المطابق: 1000', {exact: false})).toBeVisible({timeout: 30000});
      await expect(page.locator('tbody tr')).toHaveCount(50);
      timings.push(performance.now() - started);
    }
    samples[`TC-ADM-P02 ${kind} search visible`] = summarize(timings);
    saveCheckpoint();
  }

  const coverage = [];
  for (let i = 0; i < 5; i += 1) {
    coverage.push(await loadPage(page, '/coverage', async () => {
      await expect(page.getByRole('heading', {name: 'التغطية الجغرافية', exact: true})).toBeVisible();
      await expect(page.getByText('خريطة الصيدليات', {exact: true})).toBeVisible();
      await expect.poll(() => page.locator('.coverage-list article').count(), {timeout: 30000}).toBe(200);
      await expect.poll(() => page.locator('.leaflet-marker-icon').count(), {timeout: 30000}).toBeGreaterThanOrEqual(200);
    }));
  }
  samples['TC-ADM-P03 map rendered 200 pharmacies'] = summarize(coverage);
  await page.getByLabel('الظهور').selectOption('hidden');
  await expect.poll(() => page.locator('.coverage-list article').count()).toBe(100);
  saveCheckpoint();

  const reports = [];
  for (let i = 0; i < 5; i += 1) reports.push(await loadPage(page, '/reports', async () => {
    await expect(page.getByRole('heading', {name: 'التقارير', exact: true})).toBeVisible();
    await expect(page.getByText('الحركة اليومية ونمو المستخدمين', {exact: true})).toBeVisible({timeout: 30000});
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible();
  }));
  samples['TC-ADM-P04 report rendered 1000 orders'] = summarize(reports);
  console.log(`ADMIN_UI_PERF_RESULT=${JSON.stringify({browser: 'Chrome/Playwright', viewport: '1920x1080', samples})}`);
  saveCheckpoint();
  expect(Object.keys(samples)).toHaveLength(6);
});

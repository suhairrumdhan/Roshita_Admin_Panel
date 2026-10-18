import {expect, test} from '@playwright/test';

const protectedPaths = ['/requests', '/orders', '/pharmacies', '/users', '/audit'];

for (const path of protectedPaths) {
  test(`TC-ADM-02 | direct access to ${path} without a session shows login only`, async ({page}) => {
    await page.goto(path);
    await expect(page.getByRole('heading', {name: 'تسجيل الدخول'})).toBeVisible();
    await expect(page.getByLabel('البريد الإلكتروني')).toBeVisible();
    await expect(page.getByLabel('كلمة المرور')).toBeVisible();
    await expect(page.getByText('سجل العمليات', {exact: true})).toHaveCount(0);
    await expect(page.getByText('طلبات التسجيل', {exact: true})).toHaveCount(0);
  });
}

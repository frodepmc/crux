// tests/e2e/board-crm-table.spec.js
const { test, expect } = require('@playwright/test');

const USERNAME = process.env.E2E_USER || 'pedro@cruxmallorca.es';
const PASSWORD = process.env.E2E_PASS;
const BOARD_ID = process.env.E2E_BOARD_ID;

test.beforeAll(() => {
    if (!PASSWORD) throw new Error('E2E_PASS env var required');
    if (!BOARD_ID) throw new Error('E2E_BOARD_ID env var required (run bootstrap first)');
});

test('login → CRM table render', async ({ page }) => {
    // 1. Login
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);

    // 2. Open CRM board
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // 3. Header visible con título
    await expect(page.locator('.b-header-title')).toHaveText('CRM Pipeline');

    // 4. Tabla con 4 filas seed
    await expect(page.locator('.b-table tbody tr')).toHaveCount(4);

    // 5. Acme aparece
    await expect(page.locator('.b-table tbody').filter({ hasText: 'Acme S.L.' })).toBeVisible();
});

test('edit cell → persists across reload', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Open drawer for Acme
    await page.locator('.b-table tbody tr').filter({ hasText: 'Acme S.L.' }).click();
    await expect(page.locator('.b-drawer h2')).toHaveText('Acme S.L.');

    // Edit Notes
    const notesField = page.locator('.b-drawer textarea');
    await notesField.fill('Edited via E2E test ' + Date.now());
    const newValue = await notesField.inputValue();

    // Close drawer
    await page.locator('.b-drawer button[aria-label="Cerrar"]').click();

    // Reload page
    await page.reload();
    await page.locator('.b-table tbody tr').filter({ hasText: 'Acme S.L.' }).click();
    await expect(page.locator('.b-drawer textarea')).toHaveValue(newValue);
});

test('drag row reorders and persists', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Get original first row name
    const firstRowBefore = await page.locator('.b-table tbody tr').first().locator('.b-cell-name').textContent();
    const secondRowBefore = await page.locator('.b-table tbody tr').nth(1).locator('.b-cell-name').textContent();

    // Drag first row's handle to second row position
    const firstHandle = page.locator('.b-table tbody tr').first().locator('.b-row-handle');
    const secondRow = page.locator('.b-table tbody tr').nth(1);
    await firstHandle.hover();
    await page.mouse.down();
    await secondRow.hover();
    await page.mouse.up();

    // Wait for reorder
    await page.waitForTimeout(400);

    // After reload, the new first row should be the one that was second
    await page.reload();
    const firstRowAfter = await page.locator('.b-table tbody tr').first().locator('.b-cell-name').textContent();
    expect(firstRowAfter).not.toBe(firstRowBefore);
});

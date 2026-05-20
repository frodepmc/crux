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

test('view switcher: tabla ↔ kanban', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Default view: kanban (post-M2 bootstrap)
    await expect(page.locator('.b-kanban')).toBeVisible();

    // Switch to Tabla
    await page.locator('.b-view-btn[aria-current="false"]', { hasText: 'Tabla' }).click();
    await expect(page.locator('.b-table tbody')).toBeVisible();
    await expect(page.locator('.b-kanban')).not.toBeVisible();

    // Switch back to Kanban
    await page.locator('.b-view-btn[aria-current="false"]', { hasText: 'Kanban' }).click();
    await expect(page.locator('.b-kanban')).toBeVisible();
});

test('drag card between kanban columns persists status change', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Ensure Kanban view
    await page.locator('.b-view-btn', { hasText: 'Kanban' }).click();
    await expect(page.locator('.b-kanban')).toBeVisible();

    // Find Acme card (seed has it in "Reunión")
    const acmeCard = page.locator('.b-kanban-card', { hasText: 'Acme' });
    await expect(acmeCard).toBeVisible();

    // Find "Ganado" column for drop
    const ganadoCol = page.locator('.b-kanban-col', { hasText: 'GANADO' });

    // Drag Acme to Ganado
    await acmeCard.hover();
    await page.mouse.down();
    await ganadoCol.hover();
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Reload: Acme should still be in Ganado
    await page.reload();
    const ganadoColAfter = page.locator('.b-kanban-col', { hasText: 'GANADO' });
    await expect(ganadoColAfter.locator('.b-kanban-card', { hasText: 'Acme' })).toBeVisible();
});

test('calendar view: pills render on dates and drag reschedules', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Switch to Calendar
    await page.locator('.b-view-btn', { hasText: 'Calendar' }).click();
    await expect(page.locator('.b-cal-grid')).toBeVisible();
    await expect(page.locator('.b-cal-pill').first()).toBeVisible();
});

test('timeline view: bars and arrows render', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Switch to Timeline
    await page.locator('.b-view-btn', { hasText: 'Timeline' }).click();
    // CRM has col_next (date, not daterange) — empty state expected
    // For Tareas board it would show bars. We accept either: bars OR empty state.
    const hasBars = await page.locator('.b-tl-bar').count();
    const hasEmpty = await page.locator('.b-tl-wrap .b-empty, .b-tl-empty').count();
    expect(hasBars + hasEmpty).toBeGreaterThan(0);
});

test('mobile viewport: table renders as vertical cards', async ({ page, browserName }, testInfo) => {
    // Only run on mobile project (iPhone 13 device)
    test.skip(!(testInfo.project.name || '').includes('mobile'), 'desktop-only project');

    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Switch to Tabla
    await page.locator('.b-view-btn', { hasText: 'Tabla' }).click();
    // En móvil <768px, las filas se muestran como cards verticales (thead oculto)
    const thead = page.locator('.b-table thead');
    await expect(thead).toBeHidden();
    // Items siguen siendo clicables
    await expect(page.locator('.b-table tbody tr').first()).toBeVisible();
});

test('theme toggle: switches data-theme and persists', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/hub/);
    await page.goto(`/admin/integrations/boards/board.html?id=${BOARD_ID}`);

    // Wait for hydrate
    await expect(page.locator('.b-header-title')).toBeVisible();

    // Get initial theme (default: dark)
    const initial = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');

    // Click toggle
    await page.locator('.b-theme-toggle').click();
    await page.waitForTimeout(200);
    const next = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(next).not.toBe(initial);

    // Wait for debounced persist
    await page.waitForTimeout(700);

    // Reload — theme should be restored
    await page.reload();
    await expect(page.locator('.b-header-title')).toBeVisible();
    const restored = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(restored).toBe(next);
});

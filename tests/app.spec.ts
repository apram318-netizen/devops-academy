import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const html = pathToFileURL(path.resolve('dist/DevOps-Academy.html')).href;

const SAMPLE_UNITS = [
  { id: 'dev101', start: 1, weeks: 11, quizWeight: 5 },
  { id: 'dev102', start: 1, weeks: 11, quizWeight: 5 },
];

async function clearDb(page: import('@playwright/test').Page) {
  await page.goto(html + '#/');
  await page.evaluate(() =>
    new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('devops-academy');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    }),
  );
}

async function openApp(page: import('@playwright/test').Page, hash = '#/') {
  await page.goto(html + hash);
  await expect(page.getByText('DevOps Academy').first()).toBeVisible();
  await expect(page.getByText('Loading your progress…')).toHaveCount(0, { timeout: 10_000 });
}

test.describe('DevOps Academy', () => {
  test.beforeEach(async ({ page }) => {
    await clearDb(page);
  });

  test('dashboard and core routes render', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await openApp(page, '#/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good/);

    await openApp(page, '#/courses');
    await expect(page.getByRole('heading', { name: 'My courses' })).toBeVisible();

    await openApp(page, '#/course/dev101');
    await expect(page.getByRole('heading', { name: /Linux and Shell/ })).toBeVisible();

    await openApp(page, '#/course/dev101/week/1');
    await expect(page.getByRole('heading', { name: /Filesystem and permissions/ })).toBeVisible();

    await openApp(page, '#/course/dev101/week/1/notes');
    await expect(page.getByRole('heading', { name: /Week 1 notes/ })).toBeVisible();

    await openApp(page, '#/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();

    await openApp(page, '#/grades');
    await expect(page.getByRole('heading', { name: 'All grades' })).toBeVisible();

    await openApp(page, '#/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('notes do not complete on open; mark as done works', async ({ page }) => {
    await openApp(page, '#/course/dev101/week/1/notes');
    await expect(page.getByRole('button', { name: 'Mark as done' })).toBeVisible();
    await page.getByRole('button', { name: 'Mark as done' }).click();
    await expect(page.getByRole('button', { name: /Done/ })).toBeVisible();
    await page.getByRole('button', { name: /Done/ }).click();
    await expect(page.getByRole('button', { name: 'Mark as done' })).toBeVisible();
  });

  test('quiz attempt finishes and shows review', async ({ page }) => {
    await openApp(page, '#/course/dev101/week/1/quiz');
    await page.getByRole('button', { name: 'Start quiz' }).click();
    await expect(page.getByText('Question 1 of 3')).toBeVisible();

    for (let q = 0; q < 3; q++) {
      await page.locator('.option-row').nth(0).click();
      if (q < 2) await page.getByRole('button', { name: 'Next' }).click();
    }
    await page.getByRole('button', { name: 'Finish attempt' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('heading', { name: /Score/ })).toBeVisible();
  });

  test('assignment draft, submit, self-grade appears in gradebook', async ({ page }) => {
    await openApp(page, '#/course/dev101/assessment/dev101-a1');
    await page.getByRole('button', { name: 'Add submission' }).click();
    await page.getByLabel('Online text').fill('Server health reporter submission evidence for tests.');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.locator('.chip', { hasText: 'Draft' })).toBeVisible();

    await page.getByRole('button', { name: 'Submit assignment' }).click();
    await page.getByText('This submission is my own work').click();
    await page.getByRole('button', { name: 'Submit assignment' }).click();
    await expect(page.locator('.chip', { hasText: 'Submitted' })).toBeVisible();

    await page.getByRole('link', { name: 'Self-grade' }).click();
    await expect(page.getByRole('heading', { name: 'Self-grading' })).toBeVisible();
    const boxes = page.locator('.checklist input[type="checkbox"]');
    const count = await boxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await boxes.nth(i).evaluate((el: HTMLInputElement) => {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.click();
      });
    }
    // Ensure all checked via label clicks as fallback
    for (let i = 0; i < count; i++) {
      if (!(await boxes.nth(i).isChecked())) {
        await page.locator('.checklist label').nth(i).click();
      }
    }
    await expect(page.getByText(/Rubric grade: 100%/)).toBeVisible();
    await page.getByRole('button', { name: 'Save grade' }).click();
    await expect(page.getByText('Graded')).toBeVisible();
    await page.waitForTimeout(600);

    await openApp(page, '#/course/dev101/grades');
    await expect(page.getByText('Assignment 1: Server health reporter')).toBeVisible();
    const a1row = page.locator('.grades-table tr', { hasText: 'Assignment 1: Server health reporter' });
    await expect(a1row).toContainText('100%');
  });

  test('reload keeps progress via IndexedDB', async ({ page }) => {
    await openApp(page, '#/course/dev101/week/1/notes');
    await page.getByRole('button', { name: 'Mark as done' }).click();
    await expect(page.getByRole('button', { name: /Done/ })).toBeVisible();
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByText('DevOps Academy').first()).toBeVisible();
    await expect(page.getByText('Loading your progress…')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Done/ })).toBeVisible();
  });

  test('export backup, reset, import restores', async ({ page }) => {
    await openApp(page, '#/course/dev101/week/1/notes');
    await page.getByRole('button', { name: 'Mark as done' }).click();
    await page.waitForTimeout(600);

    await openApp(page, '#/settings');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('main').getByRole('button', { name: 'Export backup' }).click(),
    ]);
    const backupPath = path.resolve('test-results', await download.suggestedFilename());
    await download.saveAs(backupPath);

    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Reset everything' }).click();
    await page.waitForTimeout(400);

    await openApp(page, '#/course/dev101/week/1/notes');
    await expect(page.getByRole('button', { name: 'Mark as done' })).toBeVisible();

    await openApp(page, '#/settings');
    page.once('dialog', (d) => d.accept());
    await page.setInputFiles('input[type=file][accept*="json"]', backupPath);
    await page.waitForTimeout(800);

    await openApp(page, '#/course/dev101/week/1/notes');
    await expect(page.getByRole('button', { name: /Done/ })).toBeVisible();
  });

  test('changing start date moves due dates', async ({ page }) => {
    await openApp(page, '#/course/dev101/week/1/quiz');
    const before = await page.locator('.page-sub').innerText();
    await openApp(page, '#/settings');
    await page.getByLabel('Program start date').fill('2027-01-04');
    await openApp(page, '#/course/dev101/week/1/quiz');
    const after = await page.locator('.page-sub').innerText();
    expect(after).not.toEqual(before);
    expect(after).toMatch(/2027|January|Jan/);
  });

  test('sample unit week routes load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const unit of SAMPLE_UNITS) {
      for (let i = 0; i < 3; i++) {
        const gw = unit.start + i;
        await openApp(page, `#/course/${unit.id}/week/${gw}`);
        await openApp(page, `#/course/${unit.id}/week/${gw}/notes`);
        if (unit.quizWeight > 0) await openApp(page, `#/course/${unit.id}/week/${gw}/quiz`);
        await openApp(page, `#/course/${unit.id}/week/${gw}/lab/0`);
      }
    }
    expect(errors).toEqual([]);
  });
});

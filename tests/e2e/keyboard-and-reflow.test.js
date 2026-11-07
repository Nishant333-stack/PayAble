// Keyboard-only, focus-management, reflow and text-spacing checks that axe
// cannot do automatically (WCAG 2.1.1, 2.4.1, 2.4.3, 3.3.1, 1.4.10, 1.4.12).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setup, horizontalOverflow } from '../helpers/browser.mjs';

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

async function open(path, viewport = { width: 1280, height: 800 }) {
  const page = await env.browser.newPage();
  await page.setViewport(viewport);
  await page.goto(`${env.url}/${path}`, { waitUntil: 'networkidle0' });
  return page;
}

const activeId = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

test('first Tab reaches the skip link, which moves focus to main content', async () => {
  const page = await open('index.html');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
  await page.keyboard.press('Enter');
  assert.equal(await activeId(page), 'main');
  await page.close();
});

test('tab order follows the visual order of the form', async () => {
  const page = await open('index.html');
  await page.focus('#cc-name');
  const order = ['cc-name'];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    order.push(await activeId(page));
  }
  assert.deepEqual(order, ['cc-name', 'cc-number', 'cc-exp', 'cc-csc', 'save-no', 'pay-button']);
  await page.close();
});

test('submitting empty form via keyboard shows a focused error summary', async () => {
  const page = await open('index.html');
  await page.focus('#pay-button');
  await page.keyboard.press('Enter');
  assert.equal(await activeId(page), 'error-summary');
  const links = await page.$$eval('#error-summary-list a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(links, ['#cc-name', '#cc-number', '#cc-exp', '#cc-csc']);
  assert.match(await page.title(), /^Error:/);
  const invalid = await page.$$eval('[aria-invalid="true"]', (els) => els.length);
  assert.equal(invalid, 4);
  await page.close();
});

test('error summary links move focus to the field', async () => {
  const page = await open('index.html');
  await page.click('#pay-button');
  await page.keyboard.press('Tab');               // first link in the summary
  await page.keyboard.press('Tab');               // second link -> card number
  await page.keyboard.press('Enter');
  assert.equal(await activeId(page), 'cc-number');
  await page.close();
});

test('errors are linked to their inputs through aria-describedby', async () => {
  const page = await open('index.html');
  await page.click('#pay-button');
  const described = await page.$eval('#cc-number', (el) =>
    el.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id)?.textContent.trim()).join(' | '));
  assert.match(described, /Error: Enter your card number\./);
  await page.close();
});

test('card network is detected and announced politely', async () => {
  const page = await open('index.html');
  await page.type('#cc-number', '5555');
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(await page.$eval('#cc-network-name', (el) => el.textContent), 'Mastercard');
  assert.equal(await page.$eval('#announcer', (el) => el.textContent), 'Mastercard card detected.');
  await page.close();
});

test('Amex switches the security-code hint to 4 digits on the front', async () => {
  const page = await open('index.html');
  await page.type('#cc-number', '3782');
  assert.equal(await page.$eval('#cvv-length', (el) => el.textContent), '4');
  assert.equal(await page.$eval('#cvv-location', (el) => el.textContent), 'front');
  await page.close();
});

test('card number formatting keeps the caret in place when editing mid-number', async () => {
  const page = await open('index.html');
  await page.type('#cc-number', '411111111111111');
  // Move caret to just after the 4th digit and insert a digit.
  await page.$eval('#cc-number', (el) => el.setSelectionRange(4, 4));
  await page.keyboard.type('9');
  const { value, caret } = await page.$eval('#cc-number', (el) => ({ value: el.value, caret: el.selectionStart }));
  assert.equal(value, '4111 9111 1111 1111');
  assert.equal(caret, 6); // after "4111 9"
  await page.close();
});

test('successful keyboard-only payment moves focus to the confirmation heading', async () => {
  const page = await open('index.html');
  await page.focus('#cc-name');
  await page.keyboard.type('Asha Kulkarni');
  await page.keyboard.press('Tab');
  await page.keyboard.type('4111111111111111');
  await page.keyboard.press('Tab');
  await page.keyboard.type('1229');
  await page.keyboard.press('Tab');
  await page.keyboard.type('123');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await activeId(page), 'confirm-heading');
  assert.match(await page.$eval('#confirm-detail', (el) => el.textContent), /Visa card ending 1111/);
  await page.close();
});

for (const path of ['index.html', 'transactions.html']) {
  test(`${path} reflows at 320 CSS px without horizontal page scrolling (1.4.10)`, async () => {
    const page = await open(path, { width: 320, height: 640 });
    assert.equal(await horizontalOverflow(page), 0);
    await page.close();
  });

  test(`${path} survives WCAG 1.4.12 text-spacing overrides without overflow`, async () => {
    const page = await open(path, { width: 320, height: 640 });
    await page.addStyleTag({
      content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
    });
    assert.equal(await horizontalOverflow(page), 0);
    await page.close();
  });
}

test('sortable headers expose aria-sort and actually sort', async () => {
  const page = await open('transactions.html');
  await page.click('th[data-key="amount"] button');
  assert.equal(await page.$eval('th[data-key="amount"]', (th) => th.getAttribute('aria-sort')), 'ascending');
  assert.equal(await page.$eval('th[data-key="date"]', (th) => th.getAttribute('aria-sort')), 'none');
  const amounts = await page.$$eval('#tx-body td.num', (tds) => tds.map((td) => Number(td.textContent.replace(/[^\d.]/g, ''))));
  assert.deepEqual(amounts, [...amounts].sort((a, b) => a - b));
  await page.close();
});

test('filtering updates the live result count', async () => {
  const page = await open('transactions.html');
  await page.select('#status', 'Declined');
  assert.match(await page.$eval('#result-count', (el) => el.textContent), /^Showing 1 of \d+ transactions\.$/);
  await page.close();
});

test('the scrollable table region is keyboard focusable and labelled', async () => {
  const page = await open('transactions.html', { width: 320, height: 640 });
  const region = await page.$eval('.table-scroll', (el) => ({
    tabindex: el.getAttribute('tabindex'),
    label: document.getElementById(el.getAttribute('aria-labelledby'))?.textContent,
  }));
  assert.equal(region.tabindex, '0');
  assert.ok(region.label.length > 0);
  await page.close();
});

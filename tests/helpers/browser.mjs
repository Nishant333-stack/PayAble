import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startServer } from '../../tools/serve.mjs';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

export function chromePath() {
  const found = CANDIDATES.find((p) => p && existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome/Chromium binary.');
  return found;
}

export async function setup() {
  const { server, url } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  return {
    url,
    browser,
    async close() {
      await browser.close();
      server.close();
    },
  };
}

/** Width of content that overflows the viewport horizontally (0 = reflows fine). */
export async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

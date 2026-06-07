import puppeteer from 'puppeteer';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function findChrome(): string | null {
  const commonPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/chrome',
    process.env.CHROME_PATH,
  ].filter(Boolean) as string[];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  // Try to find via which
  try {
    const which = execSync('which chromium-browser chromium google-chrome 2>/dev/null || true', {
      encoding: 'utf-8',
    }).trim();
    if (which) return which.split('\n')[0]!;
  } catch {
    // ignore
  }

  // Check puppeteer's bundled chromium
  try {
    const puppeteerDir = path.dirname(require.resolve('puppeteer'));
    const possibleChrome = path.join(puppeteerDir, '..', '.local-chromium');
    if (fs.existsSync(possibleChrome)) {
      const dirs = fs.readdirSync(possibleChrome);
      for (const dir of dirs) {
        const chromeBin = path.join(possibleChrome, dir, 'chrome-linux64', 'chrome');
        if (fs.existsSync(chromeBin)) return chromeBin;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function renderAndScreenshot(
  html: string,
  aspectRatio: string,
): Promise<Uint8Array> {
  const [w, h] = aspectRatio.split(':').map(Number);
  const width = w && h ? Math.min(600, 400 * (w / h)) : 400;
  const height = w && h ? width * (h / w) : 500;

  const chromePath = findChrome();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: Math.round(width), height: Math.round(height) });
    await page.setContent(html);
    await new Promise((r) => setTimeout(r, 500));

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      fullPage: false,
    });

    return screenshot;
  } finally {
    await browser.close();
  }
}

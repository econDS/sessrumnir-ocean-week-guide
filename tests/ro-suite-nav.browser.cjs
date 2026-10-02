#!/usr/bin/env node
'use strict';
/*
 * npm install --prefix "$RUNNER_TEMP/ocean-qa" --no-save --package-lock=false --ignore-scripts playwright@1.55.1
 * NODE_PATH="$RUNNER_TEMP/ocean-qa/node_modules" BASELINE_ONLY=1 QA_OUTPUT=/tmp/ocean-baseline node tests/ro-suite-nav.browser.cjs
 * NODE_PATH="$RUNNER_TEMP/ocean-qa/node_modules" BASE_DOCS=/tmp/base/docs BASE_SHA=<sha> QA_OUTPUT=qa-artifacts node tests/ro-suite-nav.browser.cjs
 * The runner owns two HTTP servers. Both serve the SAME GitHub Pages subpath;
 * neither serves the app at /. Playwright and Chromium are QA-only dependencies.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const OUTPUT = path.resolve(process.env.QA_OUTPUT || path.join(ROOT, 'qa-artifacts'));
const BASE_DOCS = process.env.BASE_DOCS ? path.resolve(process.env.BASE_DOCS) : null;
const BASELINE_ONLY = process.env.BASELINE_ONLY === '1';
const PREFIX = '/sessrumnir-ocean-week-guide/';
const SUFFIX = '?qa=preserve%20me&repeat=a&repeat=b#qa-sentinel';
const WIDTHS = [360, 390, 768, 1440];
const THEMES = ['light', 'dark'];
const PIN = '1.55.1';
const PORTAL = 'https://econds.github.io/ro_tools_portal/';
const SELF = 'https://econds.github.io/sessrumnir-ocean-week-guide/';
const DESTINATIONS = [PORTAL, 'https://econds.github.io/ro-leveling-map/', 'https://econds.github.io/ro-reform-preparation/', 'https://econds.github.io/dim_glacier_planner/', SELF, 'https://econds.github.io/ro-best-status/'];
const SENTINEL = { key: 'ocean-nav-qa-sentinel', value: 'unchanged:ไทย:🌊:2026' };
const servers = [];
const origins = new Set();
let browser;
fs.mkdirSync(OUTPUT, { recursive: true });
const report = {
  schemaVersion: 1, mode: BASELINE_ONLY ? 'baseline-only' : 'comparison', startedAt: new Date().toISOString(),
  playwrightVersion: null, browserVersion: null, subpath: PREFIX, widths: WIDTHS, themes: THEMES,
  sources: {}, checks: [], failures: [], screenshots: [], scenarios: {}, networkComparison: null,
  nativeClipboard: { scenarios: {}, networkComparison: null }, releaseAssetHttp: [],
  limitations: [
    'Exhaustive copy coverage intercepts clipboard writes and execCommand output for every real copy target. Separate native Chromium smoke contexts receive clipboard-read/write permissions and verify actual clipboard readText after real clicks on three representative controls, including the real execCommand fallback. Native smoke is limited to 390/light and 1440/dark.',
    'Exact external link destinations are intercepted only for document navigation and fulfilled with local QA stubs. This verifies click/keyboard navigation targets, not remote site availability.',
    'External fonts are not mocked or blanket-ignored. Their real request, response, console and failure inventories are retained and compared against the real baseline.',
    'Screenshots are viewport captures taken at settled scroll top. Geometry comparison preserves any measured pre-existing overflow rather than treating the original page as perfect.'
  ]
};
function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function git(args, cwd = ROOT) { try { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } }
function manifest(root) {
  const result = [];
  const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f); else if (e.isFile()) result.push({ file: path.relative(root, f).split(path.sep).join('/'), bytes: fs.statSync(f).size, sha256: sha(fs.readFileSync(f)) }); } };
  walk(root); return result.sort((a, b) => a.file.localeCompare(b.file));
}
function source(root, suppliedSha) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  return { directory: root, commit: suppliedSha || git(['rev-parse', 'HEAD'], root), indexSha256: sha(html), files: manifest(root), inlineScripts: [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim()).map(s => ({ sha256: sha(s), source: s })), worktree: git(['status', '--short'], root) };
}
function normalizeUrl(value) {
  if (!value) return value;
  let out = String(value);
  for (const origin of origins) out = out.split(origin).join('http://local.test');
  return out;
}
function save() {
  report.status = report.failures.length ? 'failed' : 'passed';
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUTPUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  if (BASELINE_ONLY) fs.writeFileSync(path.join(OUTPUT, 'baseline.json'), JSON.stringify(report, null, 2) + '\n');
}
function failure(name, error) {
  report.failures.push({ name, message: error.message || String(error), stack: error.stack || null });
  report.checks.push({ name, status: 'failed' });
  console.error('FAIL', name, error.message || error);
}
async function check(name, task, page) {
  try { const value = await task(); report.checks.push({ name, status: 'passed' }); return value; }
  catch (error) { failure(name, error); if (page && !page.isClosed()) await capture(page, 'failure-' + name, false).catch(() => {}); return undefined; }
}
async function top(page) {
  // Clicks in the mobile exchange table legitimately scroll its overflow-x:auto
  // wrapper. Restore original horizontal scrollers before comparing geometry or
  // taking top-of-page screenshots. This uses scrolling, not CSS/DOM changes.
  // Blurring can close the menu through focusout, so preserve keyboard focus.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('main.page *')) {
      if (!el.closest('ro-suite-nav') && el.scrollLeft !== 0) {
        el.scrollTo({ left: 0, top: el.scrollTop, behavior: 'instant' });
      }
    }
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  });
  await page.waitForFunction(() => scrollX === 0 && scrollY === 0 &&
    [...document.querySelectorAll('main.page *')].filter(el => !el.closest('ro-suite-nav')).every(el => el.scrollLeft === 0));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function capture(page, name, settle = true) {
  if (settle) await top(page);
  const file = name.replace(/[^a-zA-Z0-9._-]/g, '-') + '.png';
  await page.screenshot({ path: path.join(OUTPUT, file), fullPage: false, animations: 'disabled' });
  const viewport = page.viewportSize();
  const position = await page.evaluate(() => ({ scrollX, scrollY }));
  report.screenshots.push({ name, file, viewport, ...position, url: normalizeUrl(page.url()), sha256: sha(fs.readFileSync(path.join(OUTPUT, file))) });
}
async function serve(root, label) {
  const server = http.createServer((request, response) => {
    let url;
    try { url = new URL(request.url, 'http://localhost'); } catch { response.writeHead(400).end(); return; }
    if (!url.pathname.startsWith(PREFIX)) { response.writeHead(404).end('Only the exact GitHub Pages subpath is served'); return; }
    let relative;
    try { relative = decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html'; } catch { response.writeHead(400).end(); return; }
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { response.writeHead(404).end('Not found'); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  servers.push(server);
  const origin = `http://127.0.0.1:${server.address().port}`;
  origins.add(origin);
  return { label, root, origin, url: origin + PREFIX + SUFFIX };
}
async function createContext(width, theme) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(({ sentinel, prefix }) => {
    window.__qa = { copies: [], clipboardMode: 'success', fallbackCalls: [], storageOperations: [] };
    if (location.pathname.startsWith(prefix)) {
      localStorage.setItem(sentinel.key, sentinel.value);
      sessionStorage.setItem(sentinel.key, sentinel.value);
    }
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { window.__qa.storageOperations.push({ storage: this === localStorage ? 'local' : 'session', method, args }); return original.apply(this, args); };
    }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
      if (window.__qa.clipboardMode === 'reject') throw new Error('QA: exercise the application clipboard fallback');
      window.__qa.copies.push({ api: 'clipboard', text: String(text) });
    } } });
    const originalExec = document.execCommand.bind(document);
    document.execCommand = (command, ...args) => {
      if (String(command).toLowerCase() !== 'copy') return originalExec(command, ...args);
      const active = document.activeElement;
      const text = active && typeof active.value === 'string' ? active.value.slice(active.selectionStart, active.selectionEnd) : getSelection().toString();
      window.__qa.fallbackCalls.push({ command, tag: active?.tagName, readonly: active?.hasAttribute('readonly') });
      window.__qa.copies.push({ api: 'execCommand', text });
      return true;
    };
  }, { sentinel: SENTINEL, prefix: PREFIX });
  return context;
}
function monitor(page, scenario) {
  const n = scenario.network;
  page.on('request', r => n.requests.push({ url: r.url(), type: r.resourceType(), method: r.method(), navigation: r.isNavigationRequest() }));
  page.on('requestfailed', r => n.failedRequests.push({ url: r.url(), error: r.failure()?.errorText || '' }));
  page.on('response', r => { const item = { url: r.url(), status: r.status(), type: r.request().resourceType() }; n.responses.push(item); if (r.status() >= 400) n.badResponses.push(item); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') n.console.push({ type: m.type(), text: m.text(), location: m.location() }); });
  page.on('pageerror', e => n.pageErrors.push({ message: e.message, stack: e.stack }));
}
async function settled(page) {
  await page.locator('main.page > header h1').waitFor();
  await page.evaluate(async () => {
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 10000))]);
    await Promise.all([...document.images].map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); setTimeout(resolve, 10000); })));
  });
  await top(page);
}
async function inventory(page) {
  return page.evaluate(() => {
    const original = el => !el.closest('ro-suite-nav') && !el.closest('.first-run-jumps');
    const attrs = el => Object.fromEntries([...el.attributes].map(a => [a.name, a.value]));
    const local = url => { try { const u = new URL(url, location.href); return u.origin === location.origin ? u.pathname + u.search + u.hash : u.href; } catch { return url; } };
    const clone = document.querySelector('main.page').cloneNode(true);
    clone.querySelectorAll('ro-suite-nav, .first-run-jumps').forEach(el => el.remove());
    const loreSummary = clone.querySelector('.first-run-lore > summary');
    if (loreSummary) loreSummary.textContent = 'เนื้อเรื่องกิจกรรม:';
    // Only approved archive copy is removed from content regression; all original guide content stays compared.
    clone.querySelectorAll('.archive-ended, .archive-caveat').forEach(el => el.remove());
    clone.querySelector('.hero-badge').textContent = 'Sessrumnir Ocean Week';
    const subtitle = clone.querySelector('header > .subtitle');
    subtitle.textContent = subtitle.textContent.replace('ใช้คู่มือนี้ดู NPC และขั้นตอนของรอบเดิม · ', '');
    return {
      title: document.title, heading: document.querySelector('h1').textContent,
      guideText: clone.textContent.replace(/\s+/g, ' ').trim(),
      ids: [...document.querySelectorAll('[id]')].filter(original).filter(el => !el.id.startsWith('ocean-')).map(el => ({ tag: el.tagName, id: el.id })),
      anchors: [...document.querySelectorAll('a')].filter(original).map(el => ({ attrs: attrs(el), text: el.textContent, href: local(el.href) })),
      images: [...document.querySelectorAll('img:not(#imageLightboxImg)')].filter(original).map(el => ({ attrs: attrs(el), src: local(el.currentSrc || el.src), complete: el.complete, width: el.naturalWidth, height: el.naturalHeight })),
      copies: [...document.querySelectorAll('[data-copy]')].filter(original).map(el => ({ tag: el.tagName, attrs: attrs(el), text: el.textContent, value: el.dataset.copy })),
      aggregates: [...document.querySelectorAll('[data-copy-all]')].filter(original).map(el => ({ tag: el.tagName, attrs: attrs(el), text: el.textContent, mode: el.dataset.copyAll })),
      arrays: { dailyCommands: [...dailyCommands], mainQuestCommands: [...mainQuestCommands], allCommands: [...allCommands] }
    };
  });
}
async function geometry(page) {
  await top(page);
  return page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const header = document.querySelector('main.page > header');
    const anchorY = header.getBoundingClientRect().top;
    const nodes = [...document.querySelectorAll('main.page > *, .grid > *, [data-copy], [data-copy-all], img[data-zoom], main.page a')].filter(el => !el.closest('ro-suite-nav') && el.getClientRects().length);
    const items = nodes.map((el, index) => { const r = rect(el); return { index, tag: el.tagName, id: el.id, class: el.className, x: r.x, relativeY: r.y - anchorY, width: r.width, height: r.height }; });
    return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, excess: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth, header: rect(header), items, host: document.querySelector('ro-suite-nav') ? rect(document.querySelector('ro-suite-nav')) : null };
  });
}
function compareGeometry(actual, expected, label) {
  assert(actual.excess <= expected.excess + 1, `${label}: horizontal overflow ${actual.excess}px must not exceed baseline ${expected.excess}px`);
  // First-run intentionally changes vertical order/height. Content invariants are checked separately.
  assert(actual.host && actual.host.bottom <= actual.header.y + 1, `${label}: navigation does not overlap the guide header`);
}
async function storage(page) { return page.evaluate(() => ({ local: Object.fromEntries(Object.entries(localStorage)), session: Object.fromEntries(Object.entries(sessionStorage)), operations: window.__qa.storageOperations })); }
async function assertState(page, scenario) {
  const state = await storage(page);
  scenario.storage = state;
  assert.deepEqual(state.local, { [SENTINEL.key]: SENTINEL.value }, 'Local-storage sentinel survives and no novel keys appear');
  assert.deepEqual(state.session, { [SENTINEL.key]: SENTINEL.value }, 'Session-storage sentinel survives and no novel keys appear');
  assert.deepEqual(state.operations, [], 'The guide/navigation performs no storage mutation, including transient keys');
  assert.equal(page.url(), scenario.url, 'Query and hash remain byte-for-byte unchanged');
}
async function copies(page, scenario, baseline) {
  const results = [];
  for (const kind of ['copies', 'aggregates']) {
    const selector = kind === 'copies' ? '[data-copy]' : '[data-copy-all]';
    const count = await page.locator(selector).count();
    assert.equal(count, scenario.inventory[kind].length);
    for (let i = 0; i < count; i++) {
      for (const mode of ['success', 'reject']) {
        await check(`${scenario.id}-${kind}-${i}-${mode}`, async () => {
          const entry = scenario.inventory[kind][i];
          const expected = kind === 'copies' ? entry.value : (entry.mode === 'daily' ? scenario.inventory.arrays.dailyCommands : scenario.inventory.arrays.allCommands).join('\n');
          const countBefore = await page.evaluate(mode => { window.__qa.clipboardMode = mode; return window.__qa.copies.length; }, mode);
          const control = page.locator(selector).nth(i);
          const delegatedButton = control.locator('.route-copy');
          const copyLabel = control.locator('.copy-label');
          // Daily quest controls contain zoomable NPC images: click COPY, not the image.
          const target = await delegatedButton.count() ? delegatedButton : await copyLabel.count() ? copyLabel : control;
          await target.click();
          await page.waitForFunction(n => window.__qa.copies.length > n, countBefore);
          const actual = await page.evaluate(() => window.__qa.copies.at(-1));
          assert.equal(actual.api, mode === 'success' ? 'clipboard' : 'execCommand');
          assert.equal(actual.text, expected, 'Exact full copy output, including whitespace, line breaks, spelling and duplicates');
          if (baseline) {
            const previous = baseline.copyResults.find(r => r.kind === kind && r.index === i && r.mode === mode);
            assert(previous, 'An actual baseline click exists for this control and copy API path');
            assert.deepEqual(Buffer.from(actual.text), Buffer.from(previous.text), 'UTF-8 clipboard bytes match baseline');
          }
          assert.equal(await page.locator('#toast').textContent(), `Copied: ${expected.split('\n')[0]}`);
          assert(await page.locator('#toast').evaluate(el => el.classList.contains('show')));
          assert.equal(await page.locator('textarea[readonly]').count(), 0, 'Fallback textarea is removed');
          results.push({ kind, index: i, mode, api: actual.api, text: actual.text, utf8Bytes: Buffer.byteLength(actual.text), sha256: sha(actual.text) });
        }, page);
      }
    }
  }
  scenario.copyResults = results;
  scenario.aggregateStatus = scenario.inventory.aggregates.length ? `${scenario.inventory.aggregates.length} actual aggregate controls exercised` : 'absent: zero actual data-copy-all controls; no fabricated aggregate buttons';
  scenario.fallbackCopyCalls = await page.evaluate(() => window.__qa.fallbackCalls);
  await page.evaluate(() => { window.__qa.clipboardMode = 'success'; });
}
async function lightboxes(page, scenario) {
  scenario.lightboxes = [];
  const count = await page.locator('img[data-zoom]').count();
  assert.equal(count, scenario.inventory.images.filter(img => Object.hasOwn(img.attrs, 'data-zoom')).length);
  for (let i = 0; i < count; i++) {
    for (const dismissal of ['Escape', 'image-click', 'backdrop-click']) {
      await check(`${scenario.id}-lightbox-${i}-${dismissal}`, async () => {
        const image = page.locator('img[data-zoom]').nth(i);
        const expected = await image.evaluate(el => ({ src: el.currentSrc || el.src, alt: el.alt }));
        await image.click();
        const box = page.locator('#imageLightbox');
        assert(await box.isVisible()); assert.equal(await box.getAttribute('aria-hidden'), 'false');
        assert.equal(await page.locator('#imageLightboxImg').getAttribute('src'), expected.src);
        assert.equal(await page.locator('#imageLightboxImg').getAttribute('alt'), expected.alt);
        await page.waitForFunction(() => { const img = document.getElementById('imageLightboxImg'); return img.complete && img.naturalWidth > 0; });
        if (dismissal === 'Escape') await page.keyboard.press('Escape');
        else if (dismissal === 'image-click') await page.locator('#imageLightboxImg').click();
        else await box.click({ position: { x: 2, y: 2 } });
        assert.equal(await box.getAttribute('aria-hidden'), 'true'); assert(!(await box.isVisible()));
        assert.equal(await page.locator('#imageLightboxImg').getAttribute('src'), '');
        scenario.lightboxes.push({ index: i, src: normalizeUrl(expected.src), dismissal, openedAndClosed: true });
      }, page);
    }
  }
}
async function theme(page, scenario) {
  const colors = () => page.evaluate(() => {
    const snap = el => { if (!el) return null; const c = getComputedStyle(el); return { color: c.color, background: c.background, colorScheme: c.colorScheme }; };
    return { body: snap(document.body), header: snap(document.querySelector('main.page > header')), card: snap(document.querySelector('.card')), nav: snap(document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('nav')) };
  });
  const before = await colors();
  await page.emulateMedia({ colorScheme: scenario.theme === 'light' ? 'dark' : 'light' });
  const changed = await colors();
  assert.deepEqual(changed, before, 'The host remains light-only and the installed menu stays theme=light after an OS theme transition');
  await page.emulateMedia({ colorScheme: scenario.theme });
  scenario.colors = before;
}
async function disclosures(page, scenario) {
  scenario.disclosures = [];
  const details = page.locator('main.page details');
  for (let i = 0; i < await details.count(); i++) {
    await check(`${scenario.id}-disclosure-${i}`, async () => {
      const item = details.nth(i), summary = item.locator('summary');
      const initial = await item.evaluate(el => el.open);
      for (const activation of ['click', 'Enter', 'Space']) {
        for (const expected of [!initial, initial]) {
          if (activation === 'click') await summary.click();
          else { await summary.focus(); await page.keyboard.press(activation); }
          assert.equal(await item.evaluate(el => el.open), expected, `Details toggles with ${activation}`);
        }
      }
      scenario.disclosures.push({ index: i, summary: await summary.textContent(), initialOpen: initial, clickEnterSpaceOpenClose: true });
    }, page);
  }
}
async function originalLinks(page, context, scenario) {
  scenario.anchorInteractions = [];
  for (let i = 0; i < scenario.inventory.anchors.length; i++) {
    await check(`${scenario.id}-original-anchor-${i}`, async () => {
      const item = scenario.inventory.anchors[i];
      const sameHrefBefore = scenario.inventory.anchors.slice(0, i).filter(a => a.attrs.href === item.attrs.href).length;
      const link = page.locator(`main.page a[href=${JSON.stringify(item.attrs.href)}]`).nth(sameHrefBefore);
      const details = link.locator('xpath=ancestor::details');
      const wasClosed = await details.count() && !(await details.evaluate(el => el.open));
      if (wasClosed) await details.locator('summary').click();
      assert.equal(await link.getAttribute('href'), item.attrs.href);
      if (item.attrs.target === '_blank') {
        const popupPromise = context.waitForEvent('page');
        await link.click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(normalizeUrl(popup.url()), item.href);
        assert.equal(await popup.evaluate(() => window.opener === null), true, 'External target=_blank preserves noopener');
        await popup.close();
      } else {
        const expected = new URL(item.attrs.href, scenario.url).href;
        await link.click(); await page.waitForURL(expected);
        assert.equal(page.url(), expected);
        await page.goBack({ waitUntil: 'domcontentloaded' }); await settled(page);
      }
      if (wasClosed) await details.locator('summary').click();
      scenario.anchorInteractions.push({ index: i, href: item.href, target: item.attrs.target || '_self', activation: 'real click', interceptedLocally: /^https?:/.test(item.href) });
    }, page);
  }
}
async function navigation(page, scenario, baseline) {
  const host = page.locator('ro-suite-nav');
  const button = host.locator('.bar button');
  await button.waitFor();
  assert.equal(await host.count(), 1);
  assert.equal(await host.getAttribute('tool-id'), 'ocean-week-guide');
  assert.equal(await host.getAttribute('theme'), 'light');
  assert.equal(await host.getAttribute('catalog-url'), null, 'No live catalog request');
  assert.equal(await host.getAttribute('portal-url'), PORTAL);
  const identity = await host.evaluate(el => {
    const root = el.shadowRoot, nav = root.querySelector('nav');
    return { accent: getComputedStyle(nav).borderBottomColor, chipAccent: getComputedStyle(root.querySelector('.current .chip')).backgroundColor, cssAccent: nav.style.getPropertyValue('--tool-accent'), paths: [...root.querySelectorAll('.current .chip path')].map(p => p.getAttribute('d')), title: root.querySelector('.current').textContent, colorScheme: getComputedStyle(el).colorScheme };
  });
  assert.equal(identity.accent, 'rgb(203, 215, 199)'); assert.equal(identity.chipAccent, 'rgb(15, 118, 134)'); assert.equal(identity.cssAccent, '#0f7686');
  assert.deepEqual(identity.paths, ['M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0']);
  assert.equal(identity.title, 'Sessrumnir Ocean Week'); assert.equal(identity.colorScheme, 'light');
  scenario.navigation = { identity, keyboard: [], links: [] };
  await top(page);
  // This runs before any guide interaction, so sequential focus starts at the document.
  await page.keyboard.press('Tab');
  assert(await host.locator('.bar > a').evaluate(el => el.getRootNode().activeElement === el), 'First Tab reaches the Portal link');
  await page.keyboard.press('Tab');
  assert(await button.evaluate(el => el.getRootNode().activeElement === el), 'Second Tab reaches the menu toggle');
  await page.keyboard.press('Enter'); assert.equal(await button.getAttribute('aria-expanded'), 'true');
  assert(await host.locator('#tools').isVisible());
  const links = host.locator('#tools a');
  const linkData = await links.evaluateAll(nodes => nodes.map(el => ({ text: el.textContent, href: el.href, current: el.getAttribute('aria-current') })));
  assert.deepEqual(linkData.map(el => el.href), DESTINATIONS.slice(1));
  const current = linkData.filter(el => el.current === 'page');
  assert.equal(current.length, 1); assert.equal(current[0].href, SELF);
  const planned = host.locator('#tools li').filter({ hasText: 'Grade & Refine Workshop' });
  assert.equal(await planned.count(), 1); assert((await planned.innerText()).includes('อยู่ในแผน')); assert.equal(await planned.locator('a,button,[tabindex]').count(), 0);
  const targets = await host.locator('a,button').evaluateAll(nodes => nodes.filter(el => el.getClientRects().length).map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, text: el.textContent, width: r.width, height: r.height }; }));
  targets.forEach(t => assert(t.width >= 44 && t.height >= 44, `Navigation hit target must be at least 44×44: ${t.text}`));
  scenario.navigation.hitTargets = targets;
  scenario.navigation.links = linkData;
  scenario.navigation.openGeometry = await geometry(page);
  compareGeometry(scenario.navigation.openGeometry, baseline.geometry, 'menu open');
  const g = scenario.navigation.openGeometry;
  assert(g.host.x >= -1 && g.host.right <= scenario.width + 1, 'Expanded navigation stays inside viewport');
  assert(g.host.bottom <= g.header.y + 1, 'Expanded navigation pushes guide header in normal flow without overlap');
  await capture(page, scenario.id + '-menu-open');
  for (let i = 0; i < await links.count(); i++) {
    await page.keyboard.press('Tab');
    assert(await links.nth(i).evaluate(el => el.getRootNode().activeElement === el), `Tab reaches listed tool ${i}`);
  }
  await page.keyboard.press('Escape');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert(await button.evaluate(el => el.getRootNode().activeElement === el), 'Escape returns focus to toggle');
  await page.keyboard.press('Space'); assert.equal(await button.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Space'); assert.equal(await button.getAttribute('aria-expanded'), 'false');
  await page.keyboard.press('Enter');
  for (let i = 0; i <= await links.count(); i++) await page.keyboard.press('Tab');
  assert.equal(await button.getAttribute('aria-expanded'), 'false', 'Tab outside navigation closes menu');
  assert(await host.evaluate(el => document.activeElement !== el), 'Tab leaves shadow navigation into the original guide');
  scenario.navigation.keyboard = ['Tab Portal', 'Tab toggle', 'Enter opens', 'Tab each live tool', 'Escape closes and returns focus', 'Space opens', 'Space closes', 'Tab out closes'];
  await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
  await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'false');
}
async function navDestinations(page, scenario) {
  scenario.navigation.destinationInteractions = [];
  for (const destination of DESTINATIONS) {
    await check(`${scenario.id}-destination-${DESTINATIONS.indexOf(destination)}`, async () => {
      const host = page.locator('ro-suite-nav');
      await host.locator('.bar button').waitFor();
      if (destination !== PORTAL) await host.locator('.bar button').click();
      const link = destination === PORTAL ? host.locator('.bar > a') : host.locator(`#tools a[href="${destination}"]`);
      await link.focus();
      await Promise.all([page.waitForURL(destination), page.keyboard.press('Enter')]);
      assert.equal(page.url(), destination);
      assert.equal(await page.title(), 'Ocean QA destination stub');
      await page.goBack({ waitUntil: 'domcontentloaded' }); await settled(page);
      await assertState(page, scenario);
      scenario.navigation.destinationInteractions.push({ href: destination, activation: 'Enter', interceptedLocally: true });
    }, page);
  }
}
async function fallback(page, scenario, baseline) {
  const host = page.locator('ro-suite-nav');
  assert.equal(await host.count(), 1);
  assert.equal(await host.evaluate(el => !!el.shadowRoot), false, 'Blocking the real nav.js request prevents component upgrade');
  assert(scenario.blockedRequests.length > 0, 'The actual installed nav.js module was requested and aborted');
  assert(scenario.blockedRequests.every(url => url === scenario.navScriptUrl));
  const link = host.locator('a');
  assert.equal(await link.count(), 1); assert(await link.isVisible()); assert.equal(await link.getAttribute('href'), PORTAL);
  await top(page);
  const box = await link.boundingBox();
  assert(box.width >= 44 && box.height >= 44, 'Fallback link is at least 44×44');
  assert(box.y >= 0 && box.y + box.height <= 900, 'Fallback is visible at settled scroll top');
  const g = await geometry(page);
  compareGeometry(g, baseline.geometry, 'blocked-script fallback');
  assert(g.host.bottom <= g.header.y + 1, 'Fallback does not overlap guide');
  scenario.fallback = { box, geometry: g, blockedRequests: scenario.blockedRequests };
  await capture(page, scenario.id + '-fallback-visible');
  await page.keyboard.press('Tab');
  assert(await link.evaluate(el => el === document.activeElement), 'First Tab reaches real fallback anchor');
  await Promise.all([page.waitForURL(PORTAL), page.keyboard.press('Enter')]);
  assert.equal(await page.title(), 'Ocean QA destination stub');
  await page.goBack({ waitUntil: 'domcontentloaded' }); await settled(page);
  assert.equal(await host.evaluate(el => !!el.shadowRoot), false);
  scenario.fallback.keyboard = ['Tab reaches fallback', 'Enter reaches exact Portal URL', 'Back returns to guide with nav request still blocked'];
}
async function runScenario(server, width, colorScheme, kind, baseline) {
  const id = `${kind}-${width}-${colorScheme}`;
  const scenario = report.scenarios[id] = { id, width, theme: colorScheme, kind, url: server.url, blockedRequests: [], interceptedDestinations: [], network: { requests: [], responses: [], failedRequests: [], badResponses: [], console: [], pageErrors: [] } };
  const context = await createContext(width, colorScheme);
  let page;
  try {
    const scriptPaths = [...fs.readFileSync(path.join(server.root, 'index.html'), 'utf8').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    const navPaths = scriptPaths.filter(s => /(?:^|\/)nav\.js(?:[?#]|$)/.test(s));
    if (kind !== 'baseline') assert.equal(navPaths.length, 1, 'Exactly one actual nav.js script is installed');
    scenario.navScriptUrl = navPaths.length ? new URL(navPaths[0], server.url).href : null;
    if (kind === 'fallback') await context.route(scenario.navScriptUrl, async route => { scenario.blockedRequests.push(route.request().url()); await route.abort('blockedbyclient'); });
    // Only intercept actual top-level navigations. Fonts and all normal asset loads remain real.
    await context.route(url => DESTINATIONS.includes(url.href) || url.hostname === 'ro.gnjoy.in.th', async route => {
      if (!route.request().isNavigationRequest()) { await route.continue(); return; }
      scenario.interceptedDestinations.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Ocean QA destination stub</title><p>Exact link destination intercepted for QA</p>' });
    });
    context.on('page', p => { if (p !== page) monitor(p, scenario); });
    page = await context.newPage();
    // The context listener registers main page too, because the assignment occurs after its page event.
    page.setDefaultTimeout(10000);
    await page.goto(server.url, { waitUntil: 'networkidle', timeout: 30000 }); await settled(page);
    scenario.inventory = await inventory(page); scenario.geometry = await geometry(page);
    if (kind !== 'baseline') await check(id + '-visible-static-archive', async () => {
      await top(page);
      const badge = page.locator('header .hero-badge');
      assert.equal(await badge.innerText(), 'คู่มือย้อนหลัง');
      const ended = page.locator('.archive-ended');
      assert.equal(await ended.innerText(), 'กิจกรรมรอบ 6 พ.ค. – 4 มิ.ย. 2569 สิ้นสุดแล้ว');
      for (const el of [badge, ended, page.locator('.archive-caveat')]) { const b = await el.boundingBox(); assert(b && b.y >= 0 && b.y + b.height <= page.viewportSize().height, 'Archive copy visible without deep scrolling'); assert.equal(await el.getAttribute('role'), null); const color = await el.evaluate(e => ({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})); assert.deepEqual(color,{color:'rgb(255, 255, 255)',background:'rgb(7, 56, 94)'}); }
      assert((await page.locator('.archive-caveat').innerText()).includes('หากกิจกรรมกลับมาอีกครั้ง'));
      assert.equal(await page.locator('h1').count(), 1);
    }, page);
    await check(id + '-all-original-images-load', async () => {
      const html = fs.readFileSync(path.join(server.root, 'index.html'), 'utf8');
      const sourceImageCount = [...html.matchAll(/<img\b[^>]*\bsrc=[\"'][^\"']+[\"'][^>]*>/gi)].length;
      assert.equal(scenario.inventory.images.length, sourceImageCount, 'No original image silently disappeared through its onerror removal handler');
      scenario.inventory.images.forEach(img => { assert(img.complete && img.width > 0, `Original image loaded: ${img.src}`); assert(img.src.startsWith(PREFIX + 'assets/'), 'Original images load through exact Pages subpath'); });
    }, page);
    await check(id + '-original-inventory', async () => { if (baseline) assert.deepEqual(scenario.inventory, baseline.inventory, 'All original content, IDs, links, images, copy buttons, and source command arrays remain identical'); }, page);
    await check(id + '-original-geometry', async () => { if (baseline) compareGeometry(scenario.geometry, baseline.geometry, 'initial guide'); }, page);
    await capture(page, id + (kind === 'baseline' ? '-baseline' : '-initial'));
    if (kind === 'normal') await check(id + '-navigation', () => navigation(page, scenario, baseline), page);
    if (kind === 'fallback') await check(id + '-fallback', () => fallback(page, scenario, baseline), page);
    await check(id + '-all-copy-controls', () => copies(page, scenario, baseline), page);
    await check(id + '-all-lightbox-interactions', () => lightboxes(page, scenario), page);
    await check(id + '-all-disclosures', () => disclosures(page, scenario), page);
    await check(id + '-original-link-clicks', () => originalLinks(page, context, scenario), page);
    await check(id + '-theme-transition', () => theme(page, scenario), page);
    await check(id + '-storage-and-url-preserved', () => assertState(page, scenario), page);
    if (kind === 'normal' && scenario.navigation) await check(id + '-nav-link-destinations', () => navDestinations(page, scenario), page);
    await check(id + '-final-storage-and-url', () => assertState(page, scenario), page);
    scenario.finalGeometry = await geometry(page);
    await check(id + '-final-original-geometry', async () => compareGeometry(scenario.finalGeometry, baseline?.geometry || scenario.geometry, 'after interactions'), page);
    await check(id + '-exact-subpath-assets', async () => {
      const local = scenario.network.requests.filter(r => r.url.startsWith(server.origin) && ['script', 'image', 'stylesheet'].includes(r.type));
      local.forEach(r => assert(new URL(r.url).pathname.startsWith(PREFIX), `Asset requested beneath exact Pages path: ${r.url}`));
      assert.deepEqual(scenario.network.badResponses.filter(r => r.url.startsWith(server.origin)), [], 'All local assets load successfully');
      if (kind === 'normal') {
        assert(scenario.network.responses.some(r => r.url === scenario.navScriptUrl && r.status === 200), 'Installed bundle loaded successfully from the exact subpath');
        assert.equal(new URL(scenario.navScriptUrl).origin, server.origin);
        assert(new URL(scenario.navScriptUrl).pathname.startsWith(PREFIX));
      }
    }, page);
  } catch (error) { failure(id + '-setup', error); if (page && !page.isClosed()) await capture(page, id + '-failure', false).catch(() => {}); }
  finally { await context.close(); save(); }
  return scenario;
}
async function nativeClipboardSmoke(server, width, colorScheme, kind, baseline) {
  const id = `native-clipboard-${kind}-${width}-${colorScheme}`;
  const scenario = report.nativeClipboard.scenarios[id] = {
    id, width, theme: colorScheme, kind, url: server.url,
    permissions: ['clipboard-read', 'clipboard-write'], clipboardWriteSpy: false, execCommandSpy: false,
    blockedRequests: [], results: [],
    network: { requests: [], responses: [], failedRequests: [], badResponses: [], console: [], pageErrors: [] }
  };
  // Deliberately do not use createContext(): there is no clipboard or execCommand
  // capture spy in this fresh context. Both native APIs remain real.
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce', serviceWorkers: 'block', permissions: scenario.permissions });
  let page;
  try {
    const html = fs.readFileSync(path.join(server.root, 'index.html'), 'utf8');
    const navPath = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).find(src => /(?:^|\/)nav\.js(?:[?#]|$)/.test(src));
    scenario.navScriptUrl = navPath ? new URL(navPath, server.url).href : null;
    if (kind === 'fallback') {
      assert(scenario.navScriptUrl, 'Native fallback smoke has an actual installed nav.js to block');
      await context.route(scenario.navScriptUrl, async route => { scenario.blockedRequests.push(route.request().url()); await route.abort('blockedbyclient'); });
    }
    page = await context.newPage(); monitor(page, scenario); page.setDefaultTimeout(10000);
    await page.goto(server.url, { waitUntil: 'networkidle', timeout: 30000 }); await settled(page); await page.bringToFront();
    scenario.initialStorage = await page.evaluate(() => ({ local: Object.fromEntries(Object.entries(localStorage)), session: Object.fromEntries(Object.entries(sessionStorage)) }));
    await check(id + '-native-api-setup', async () => {
      const api = await page.evaluate(() => {
        if (!navigator.clipboard?.readText || !navigator.clipboard?.writeText) throw new Error('Native clipboard APIs unavailable');
        window.__nativeClipboard = {
          writeText: navigator.clipboard.writeText,
          descriptor: Object.getOwnPropertyDescriptor(navigator.clipboard, 'writeText'),
          execCommand: document.execCommand,
          rejectedWrites: 0
        };
        return { secureContext: isSecureContext, captureSpyPresent: typeof window.__qa !== 'undefined', writeText: Function.prototype.toString.call(navigator.clipboard.writeText), readText: Function.prototype.toString.call(navigator.clipboard.readText), execCommand: Function.prototype.toString.call(document.execCommand) };
      });
      assert(api.secureContext); assert.equal(api.captureSpyPresent, false);
      for (const name of ['writeText', 'readText', 'execCommand']) assert(api[name].includes('[native code]'), `${name} is the browser-native function`);
      if (kind === 'normal') assert(await page.locator('ro-suite-nav').evaluate(el => !!el.shadowRoot));
      if (kind === 'fallback') {
        assert(scenario.blockedRequests.length > 0);
        assert.equal(await page.locator('ro-suite-nav').evaluate(el => !!el.shadowRoot), false);
        assert(await page.locator('ro-suite-nav a').isVisible());
      }
      scenario.nativeApis = api;
    }, page);
    const controls = [
      { name: 'ordinary-navi', target: page.locator('button.nav-button[data-copy^="/navi"]').first().locator('.copy-label') },
      { name: 'route-copy-child', target: page.locator('.route-line[data-copy] .route-copy').first() },
      { name: 'daily-quest-with-image', target: page.locator('button.nav-button[data-copy]').filter({ has: page.locator('img[data-zoom]') }).first().locator('.copy-label') }
    ];
    for (const control of controls) for (const mode of ['native-writeText', 'native-execCommand-fallback']) {
      await check(`${id}-${control.name}-${mode}`, async () => {
        const expected = await control.target.evaluate(el => el.closest('[data-copy]').dataset.copy);
        const previous = baseline?.results.find(result => result.control === control.name && result.mode === mode);
        if (baseline) { assert(previous, 'A real baseline native clipboard read exists'); assert.equal(expected, previous.expected); }
        const sentinel = `native-clipboard-before:${id}:${control.name}:${mode}`;
        // Seed a different native clipboard value before each click to rule out
        // accidental success from a previous control's or API path's clipboard.
        await page.evaluate(async ({ sentinel, reject }) => {
          const state = window.__nativeClipboard;
          if (state.descriptor) Object.defineProperty(navigator.clipboard, 'writeText', state.descriptor);
          else delete navigator.clipboard.writeText;
          await state.writeText.call(navigator.clipboard, sentinel);
          state.rejectedWrites = 0;
          if (reject) Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async () => { state.rejectedWrites++; throw new DOMException('QA forces the application fallback', 'NotAllowedError'); } });
        }, { sentinel, reject: mode === 'native-execCommand-fallback' });
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), sentinel, 'Native clipboard sentinel was actually written');
        try {
          await control.target.click();
          await page.waitForFunction(async expected => await navigator.clipboard.readText() === expected, expected);
          const actual = await page.evaluate(() => navigator.clipboard.readText());
          assert.deepEqual(Buffer.from(actual), Buffer.from(expected), 'Actual native clipboard UTF-8 bytes match source value');
          if (previous) assert.deepEqual(Buffer.from(actual), Buffer.from(previous.text), 'Actual native clipboard bytes match baseline');
          const state = await page.evaluate(() => ({ rejectedWrites: window.__nativeClipboard.rejectedWrites, execCommandUnmodified: document.execCommand === window.__nativeClipboard.execCommand }));
          assert.equal(state.rejectedWrites, mode === 'native-execCommand-fallback' ? 1 : 0);
          assert(state.execCommandUnmodified, 'Fallback uses real document.execCommand without a capture/replacement spy');
          assert.equal(await page.locator('textarea[readonly]').count(), 0);
          assert.equal(await page.locator('#imageLightbox').getAttribute('aria-hidden'), 'true', 'Daily COPY activation did not open its child image');
          assert.equal(await page.locator('#toast').textContent(), `Copied: ${expected}`);
          scenario.results.push({ control: control.name, mode, expected, text: actual, utf8Bytes: Buffer.byteLength(actual), sha256: sha(actual), ...state });
        } finally {
          await page.evaluate(() => {
            const state = window.__nativeClipboard;
            if (state.descriptor) Object.defineProperty(navigator.clipboard, 'writeText', state.descriptor);
            else delete navigator.clipboard.writeText;
          });
        }
      }, page);
    }
    await check(id + '-native-smoke-state', async () => {
      assert.equal(scenario.results.length, 6, 'All three controls pass both native copy paths');
      assert.equal(page.url(), scenario.url, 'Native copy actions preserve the original query and hash');
      scenario.finalStorage = await page.evaluate(() => ({ local: Object.fromEntries(Object.entries(localStorage)), session: Object.fromEntries(Object.entries(sessionStorage)) }));
      assert.deepEqual(scenario.finalStorage, scenario.initialStorage, 'Native copy smoke creates no storage keys');
    }, page);
    await capture(page, id);
  } catch (error) { failure(id + '-setup', error); if (page && !page.isClosed()) await capture(page, id + '-failure', false).catch(() => {}); }
  finally { await context.close(); save(); }
  return scenario;
}
function compareNativeClipboardNetwork() {
  const native = Object.values(report.nativeClipboard.scenarios);
  const baseline = [...Object.values(report.scenarios), ...native].filter(s => s.kind === 'baseline');
  const categories = ['pageErrors', 'consoleErrors', 'consoleWarnings', 'failedRequests', 'badResponses'];
  const baselineUnion = Object.fromEntries(categories.map(k => [k, [...new Set(baseline.flatMap(s => signatures(s)[k]))].sort()]));
  const comparison = report.nativeClipboard.networkComparison = { baselineUnion, scenarios: {}, policy: 'Native clipboard smoke inventories are separate from exhaustive interactions. Only the exact deliberately aborted nav.js request is excluded; real font errors are retained and compared.' };
  for (const s of native) {
    s.network.signatures = signatures(s);
    if (s.kind === 'baseline') continue;
    const novel = comparison.scenarios[s.id] = {};
    for (const category of categories) {
      novel[category] = s.network.signatures[category].filter(value => !baselineUnion[category].includes(value));
      assert.deepEqual(novel[category], [], `${s.id}: no new ${category} beyond actual baseline`);
    }
  }
}
async function releaseAssetHttp(server) {
  // Direct API checks deliberately live outside the application's runtime request
  // inventories. The page loads nav.js only; JSON sidecars are verified here.
  const context = await browser.newContext();
  try {
    const html = fs.readFileSync(path.join(server.root, 'index.html'), 'utf8');
    const navPath = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).find(src => /(?:^|\/)nav\.js(?:[?#]|$)/.test(src));
    assert(navPath, 'Release HTTP checks require the installed nav.js path');
    const directory = path.posix.dirname(navPath) + '/';
    const lock = JSON.parse(fs.readFileSync(path.join(server.root, directory, 'nav.lock.json'), 'utf8'));
    for (const file of ['nav.js', 'catalog.snapshot.json', 'nav.lock.json']) {
      await check('release-http-' + file, async () => {
        const relative = directory + file, url = new URL(relative, server.url).href;
        assert.equal(new URL(url).origin, server.origin); assert(new URL(url).pathname.startsWith(PREFIX));
        const expectedBytes = fs.readFileSync(path.join(server.root, relative));
        const response = await context.request.get(url);
        const actual = await response.body();
        const item = { file, url: normalizeUrl(url), status: response.status(), bytes: actual.length, sha256: sha(actual), expectedSha256: sha(expectedBytes), releaseLockSha256: lock.files[file]?.sha256 || null, source: 'separate context.request GET; not a runtime application request' };
        report.releaseAssetHttp.push(item);
        assert.equal(response.status(), 200); assert.equal(response.url(), url, 'Release asset does not redirect');
        assert.deepEqual(actual, expectedBytes, 'Served release asset bytes match the checked-in file');
        if (item.releaseLockSha256) assert.equal(item.sha256, item.releaseLockSha256, 'Served bundle/catalog matches the published release lock');
        await response.dispose();
      });
    }
  } finally { await context.close(); save(); }
}
function signatures(scenario) {
  const n = scenario.network;
  const isBlocked = item => scenario.kind === 'fallback' && (item.url === scenario.navScriptUrl || item.location?.url === scenario.navScriptUrl);
  const unique = list => [...new Set(list.map(normalizeUrl))].sort();
  return {
    pageErrors: unique(n.pageErrors.map(i => i.message)),
    consoleErrors: unique(n.console.filter(i => i.type === 'error' && !isBlocked(i)).map(i => `${i.text} @ ${i.location?.url || ''}`)),
    consoleWarnings: unique(n.console.filter(i => i.type === 'warning' && !isBlocked(i)).map(i => `${i.text} @ ${i.location?.url || ''}`)),
    failedRequests: unique(n.failedRequests.filter(i => !isBlocked(i)).map(i => `${i.error} ${i.url}`)),
    badResponses: unique(n.badResponses.filter(i => !isBlocked(i)).map(i => `${i.status} ${i.url}`))
  };
}
function compareNetwork() {
  const all = Object.values(report.scenarios);
  const baseline = all.filter(s => s.kind === 'baseline');
  const categories = ['pageErrors', 'consoleErrors', 'consoleWarnings', 'failedRequests', 'badResponses'];
  const baselineUnion = Object.fromEntries(categories.map(k => [k, [...new Set(baseline.flatMap(s => signatures(s)[k]))].sort()]));
  report.networkComparison = { baselineUnion, scenarios: {}, policy: 'All inventories retained. Only failure events tied to the exact intentionally aborted nav.js request are excluded from regression comparison; external fonts are compared normally.' };
  const originalExternal = new Set(baseline.flatMap(s => s.network.requests.filter(r => !origins.has(new URL(r.url).origin)).map(r => r.url)));
  for (const s of all) {
    s.network.signatures = signatures(s);
    if (s.kind === 'baseline') continue;
    const comparison = report.networkComparison.scenarios[s.id] = { novel: {}, expectedBlockedNavErrors: s.kind === 'fallback' ? s.network.failedRequests.filter(r => r.url === s.navScriptUrl) : [] };
    for (const category of categories) {
      comparison.novel[category] = s.network.signatures[category].filter(v => !baselineUnion[category].includes(v));
      assert.deepEqual(comparison.novel[category], [], `${s.id}: no new ${category} beyond real browser baseline`);
    }
    const external = [...new Set(s.network.requests.filter(r => !origins.has(new URL(r.url).origin)).map(r => r.url))];
    comparison.novelExternalRequests = external.filter(url => !originalExternal.has(url) && !DESTINATIONS.includes(url));
    assert.deepEqual(comparison.novelExternalRequests, [], `${s.id}: no unexpected new external requests`);
  }
}
(async () => {
  try {
    report.sources.current = source(DOCS, process.env.SOURCE_SHA || process.env.GITHUB_SHA);
    if (!BASELINE_ONLY) {
      assert(BASE_DOCS, 'Comparison mode requires BASE_DOCS pointing to an unmodified base docs directory');
      report.sources.base = source(BASE_DOCS, process.env.BASE_SHA);
      assert.notEqual(path.resolve(BASE_DOCS), path.resolve(DOCS), 'Comparison baseline must be a separate directory');
      assert.deepEqual(report.sources.current.inlineScripts, report.sources.base.inlineScripts, 'Original guide scripts and command arrays remain byte-for-byte unchanged');
      for (const previous of report.sources.base.files) {
        if (previous.file === 'index.html') continue;
        const current = report.sources.current.files.find(f => f.file === previous.file);
        assert(current, `Original asset remains: ${previous.file}`);
        assert.equal(current.sha256, previous.sha256, `Original asset unchanged: ${previous.file}`);
      }
    } else {
      assert(!/<ro-suite-nav\b/i.test(fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8')), 'Baseline-only capture must run before production navigation is installed');
      report.sources.base = { ...report.sources.current, commit: process.env.BASE_SHA || report.sources.current.commit };
    }
    const { chromium } = require('playwright');
    report.playwrightVersion = require('playwright/package.json').version;
    assert.equal(report.playwrightVersion, PIN, 'Externally supplied Playwright must match the pinned QA version');
    browser = await chromium.launch({ headless: true, ...(process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {}) });
    report.browserVersion = browser.version();
    const baseServer = await serve(BASELINE_ONLY ? DOCS : BASE_DOCS, 'base');
    const currentServer = BASELINE_ONLY ? null : await serve(DOCS, 'current');
    report.servers = { base: baseServer, current: currentServer };
    // Finish the complete baseline first, retaining genuine font/network errors across the matrix.
    for (const width of WIDTHS) for (const colorScheme of THEMES) await runScenario(baseServer, width, colorScheme, 'baseline');
    if (!BASELINE_ONLY) {
      for (const width of WIDTHS) for (const colorScheme of THEMES) {
        const baseline = report.scenarios[`baseline-${width}-${colorScheme}`];
        await runScenario(currentServer, width, colorScheme, 'normal', baseline);
        await runScenario(currentServer, width, colorScheme, 'fallback', baseline);
      }
    }
    await check('console-page-network-baseline-comparison', async () => compareNetwork());
    for (const [width, colorScheme] of [[390, 'light'], [1440, 'dark']]) {
      const nativeBase = await nativeClipboardSmoke(baseServer, width, colorScheme, 'baseline');
      if (!BASELINE_ONLY) {
        await nativeClipboardSmoke(currentServer, width, colorScheme, 'normal', nativeBase);
        await nativeClipboardSmoke(currentServer, width, colorScheme, 'fallback', nativeBase);
      }
    }
    await check('native-clipboard-network-baseline-comparison', async () => compareNativeClipboardNetwork());
    if (!BASELINE_ONLY) await check('served-release-assets', () => releaseAssetHttp(currentServer));
  } catch (error) { failure('runner', error); }
  finally {
    if (browser) await browser.close().catch(() => {});
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
    save();
    console.log(JSON.stringify({ status: report.status, mode: report.mode, passed: report.checks.filter(c => c.status === 'passed').length, failures: report.failures, report: path.join(OUTPUT, 'report.json'), screenshots: report.screenshots.length }, null, 2));
    process.exitCode = report.failures.length ? 1 : 0;
  }
})();

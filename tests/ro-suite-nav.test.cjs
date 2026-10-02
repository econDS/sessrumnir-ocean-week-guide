'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {capture, sha256} = require('./capture-ocean-baseline.cjs');
const root = path.resolve(__dirname, '..');
const read = p=>fs.readFileSync(path.join(root,p));
const baseline = JSON.parse(read('qa/ro-suite-nav/source-baseline.json'));
const html = read('docs/index.html').toString();
const integrated = html.includes('<ro-suite-nav ');
const markup = `  <ro-suite-nav tool-id="ocean-week-guide" portal-url="https://econds.github.io/ro_tools_portal/" theme="light">
    <nav aria-label="เครื่องมือ RO">
      <a href="https://econds.github.io/ro_tools_portal/">กลับ RO Tools Portal</a>
    </nav>
  </ro-suite-nav>
  <script type="module" src="./assets/ro-suite/1.3.0/nav.js"></script>
`;
const css = '    ro-suite-nav > nav > a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; padding: 8px 12px; }\n\n';
const expected = {
  'nav.js':'d75be916445feb4febeaada437841a1b3be68db16a00673198c78fd6f6c8dc5f',
  'catalog.snapshot.json':'800bb9c9d2b52a7fbae58e436b05529e69820fee3627d199da545a6f5e28f7dd',
  'nav.lock.json':'3b0350135ba5f455b38799c7940492938a209e8e0a6570a5126cb40c36127358'
};
test('All original production bytes preserved after subtracting only the approved integration',()=>{
  assert.equal(baseline.baseCommit,'71417fee17a5732aacf8db81933359aeb2f5fad3');
  let original = html;
  if (integrated) {
    assert.equal(html.split(markup).length,2,'one exact navigation host/local module');
    assert.equal(html.split(css).length,2,'one fallback-only style rule');
    original=original.replace(markup,'').replace(css,'');
  }
  for (const [p,hash] of Object.entries(baseline.files)) assert.equal(sha256(p==='docs/index.html'?original:read(p)),hash,p);
  const {baseCommit,files,...inventory}=baseline;
  assert.deepEqual(capture(original),inventory,'data-copy bytes, ordered arrays, all content, dates, links, images, storage/URL behavior');
});
test('Daily Quest 4 start and random destinations retain the original distinction',()=>{
  assert.match(html,/Lifeguard<\/span><div class="command">\/navi ra_temple 213\/120<\/div>/);
  assert.deepEqual(baseline.commands.dailyCommands.slice(3), ['/navi ra_temple 213/120','/navi ra_temple 211/91','/navi ra_temple 121/113','/navi ra_temple 67/166']);
  assert.equal(baseline.aggregateButtons.length,0,'no aggregate control exists at base');
});
test('Immutable upstream artifact bytes and lock match',()=>{
  const directory='docs/assets/ro-suite/1.2.0/';
  const lock=JSON.parse(read(directory+'nav.lock.json'));
  assert.equal(lock.bundleVersion,'1.2.0');
  for(const [file,hash] of Object.entries(expected)) assert.equal(sha256(read(directory+file)),hash,file);
  for(const file of ['nav.js','catalog.snapshot.json']) assert.equal(lock.files[file].sha256,expected[file]);
});
test('Navigation placement, local path, light theme, and catalog identity',()=>{
  assert.match(html,/<body>\s*<ro-suite-nav /);
  assert(html.indexOf(markup)<html.indexOf('<main class="page">'));
  assert(!/<ro-suite-nav[^>]*catalog-url=/.test(html));
  assert(!/<iframe\b/.test(html));
  assert(!html.includes('localStorage.clear'));
  const catalog=JSON.parse(read('docs/assets/ro-suite/1.2.0/catalog.snapshot.json'));
  assert.deepEqual(catalog.tools.find(t=>t.id==='ocean-week-guide').identity,{accent:'#0f7686',icon:'wave'});
  assert.equal(catalog.tools.find(t=>t.id==='ocean-week-guide').canonicalUrl,'https://econds.github.io/sessrumnir-ocean-week-guide/');
  const planned=catalog.tools.find(t=>t.id==='grade-refine');
  assert.equal(planned.listingStatus,'planned'); assert.equal(planned.canonicalUrl,null);
});
test('Pre-edit browser evidence is genuine and passed every original-view scenario',()=>{
  const bytes=require('node:zlib').gunzipSync(read('qa/ro-suite-nav/baseline.json.gz'));
  assert.equal(sha256(bytes),'b396e7df0893ba0de9861a4ccd7adafdf3af0730485320913eefdf95bd90bd9c');
  const report=JSON.parse(bytes);
  assert.equal(report.status,'passed'); assert.deepEqual(report.failures,[]);
  assert.equal(report.sources.base.commit,baseline.baseCommit);
  assert.equal(report.sources.current.commit,'5b27636096fdb6a2f1d30a9af1b64eb9e570e112');
  assert.equal(report.sources.current.indexSha256,baseline.files['docs/index.html']);
  assert.equal(report.playwrightVersion,'1.55.1'); assert.equal(Object.keys(report.scenarios).length,8);
  for(const scenario of Object.values(report.scenarios)) {
    assert.equal(scenario.kind,'baseline'); assert.equal(scenario.copyResults.length,150);
    assert.equal(scenario.inventory.copies.length,75); assert.equal(scenario.inventory.aggregates.length,0);
    assert.equal(scenario.lightboxes.length,87); assert.equal(scenario.geometry.excess,0);
  }
});

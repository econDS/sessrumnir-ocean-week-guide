'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {capture}=require('./capture-ocean-baseline.cjs');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const baseline=require('../qa/nav-alignment/baseline.json');
const normalize=require('../qa/nav-alignment/normalize.cjs');
const html=read('docs/index.html').toString();
const old=execFileSync('git',['show',baseline.baseCommit+':docs/index.html'],{cwd:root,encoding:'utf8'});
const release='docs/assets/ro-suite/1.4.0/';
test('latest merged first-run and archive guide survives the exact navbar-only delta',()=>{
  assert.equal(baseline.baseCommit,'159a9d12ee1d1f2e6713297fcbd379952f1b69ab');
  assert.equal(hash(old),baseline.files['docs/index.html']);
  assert.equal(normalize(html),old,'all pre-rollout document bytes reconstruct exactly');
  for(const [file,expected] of Object.entries(baseline.files))if(file!=='docs/index.html')assert.equal(hash(read(file)),expected,file+' remains byte-identical');
  for(const [,after] of require('../qa/nav-alignment/changes.json'))assert.equal(html.split(after).length,2,'exact reviewed navbar delta appears once');
  assert.throws(()=>normalize(html.replace('./assets/ro-suite/1.4.0/nav.js','./assets/ro-suite/broken/nav.js')));
});
test('raw candidate guide DOM, original styling, scripts, clipboard data and links equal the actual latest source',()=>{
  // This comparison deliberately uses the actual, unnormalized candidate.
  assert.deepEqual(capture(html),capture(old));
  const scripts=h=>[...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!/assets\/ro-suite\//.test(m[1])).map(m=>({attributes:m[1],body:m[2]}));
  assert.deepEqual(scripts(html),scripts(old));
  const styles=h=>[...h.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)].filter(m=>!m[1].includes('ro-suite-nav-alignment')).map(m=>({attributes:m[1],body:m[2]}));
  assert.deepEqual(styles(html),styles(old));
  assert.equal((html.match(/<ro-suite-nav\b/g)||[]).length,1);
  assert.match(html,/<ro-suite-nav tool-id="ocean-week-guide" portal-url="https:\/\/econds.github.io\/ro_tools_portal\/" theme="light">/);
  assert.match(html,/src="\.\/assets\/ro-suite\/1\.4\.0\/nav\.js"/);
  assert(!/<ro-suite-nav[^>]*catalog-url=/.test(html));
});
test('new immutable release matches Portal source and all historical releases remain additive',()=>{
  const expected={'nav.js':'629b6da9aab2b0e6470f0a955d112261fc2406275a6260145d9056b612a98735','catalog.snapshot.json':'a198338ddcb7857094ef950fb1315c532840cf53ac8e7a69b331d8cb4a87dd5d','nav.lock.json':'558e1a00ad34b2b4921934380d7e12205a99be361307b16d43bc60825e36f098'};
  for(const [file,expectedHash] of Object.entries(expected))assert.equal(hash(read(release+file)),expectedHash,file);
  const lock=JSON.parse(read(release+'nav.lock.json'));
  assert.equal(lock.bundleVersion,'1.4.0');assert.equal(lock.sourceCommit,'24ca1068c8f6868b38d6224e661f818fec9897f9');
  for(const file of ['nav.js','catalog.snapshot.json'])assert.equal(lock.files[file].sha256,expected[file]);
  assert.deepEqual(read(release+'catalog.snapshot.json'),read('docs/assets/ro-suite/1.3.0/catalog.snapshot.json'));
  for(const version of ['1.2.0','1.3.0'])for(const file of ['nav.js','catalog.snapshot.json','nav.lock.json'])assert.equal(hash(read(`docs/assets/ro-suite/${version}/${file}`)),baseline.files[`docs/assets/ro-suite/${version}/${file}`]);
});
test('alignment integration is confined to the host and fallback with explicit page width',()=>{
  const css=html.match(/<style id="ro-suite-nav-alignment">([\s\S]*?)<\/style>/)[1];
  assert.match(css,/--ro-suite-content-max-width: 980px/);assert.match(css,/--ro-suite-inline-padding: 0px/);
  for(const match of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{/g))assert.match(match[1].trim(),/^ro-suite-nav(?:\s|\{|$)/);
  assert.match(css,/min-height: 52px/);assert.match(css,/color-scheme: light/);assert.match(css,/padding: 8px 0/);assert.match(css,/box-sizing: border-box/);
  assert.match(html,/ro-suite-nav > nav > a \{ display: inline-flex; align-items: center; min-width: 44px; min-height: 44px;/);
});

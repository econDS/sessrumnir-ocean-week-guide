const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),read=p=>fs.readFileSync(p),html=read('docs/index.html').toString(),base=require('../qa/nav-theme/baseline.json');
test('theme-only delta reconstructs every current master production byte',()=>{
 for(const [file,expected] of Object.entries(base.files)) assert.equal(hash(file==='index.html'?require('../qa/nav-theme/normalize.cjs')(html):read('docs/'+file)),expected,file);
 assert.throws(()=>require('../qa/nav-theme/normalize.cjs')(html.replace('/1.5.1/nav.js','/broken/nav.js')));
});
test('Ocean binds the eight supported semantic tokens with readable accent and Sarabun UI font',()=>{
 const values={'surface':'var(--card)','surface-hover':'var(--ocean-soft)','text':'var(--ink)','muted':'var(--muted)','border':'var(--line)','accent':'var(--accent-dark)','focus':'var(--accent-dark)','font-family':'"Sarabun", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};
 for(const [key,value] of Object.entries(values))assert(html.includes('--ro-suite-'+key+': '+value+';'),key);
 const css=html.match(/<style id="ro-suite-nav-alignment">([\s\S]*?)<\/style>/)[1];
 for(const property of ['surface','surface-hover','text','border','accent','focus','font-family'])assert(css.includes('var(--ro-suite-'+property+')'),property+' fallback');
 assert(!css.includes('Chakra'));assert(html.includes('theme="light"'));assert(html.includes('./assets/ro-suite/1.5.1/nav.js'));
});
test('additive 1.5.1 artifact matches source lock and retains exact catalog',()=>{
 const dir='docs/assets/ro-suite/1.5.1/',lock=JSON.parse(read(dir+'nav.lock.json'));
 assert.equal(lock.bundleVersion,'1.5.1');assert.equal(lock.sourceCommit,'44b090748afc1dbf13eb5d4b78d2a0102d9d9e9c');
 for(const file of ['nav.js','catalog.snapshot.json'])assert.equal(hash(read(dir+file)),lock.files[file].sha256);
 assert.deepEqual(read(dir+'catalog.snapshot.json'),read('docs/assets/ro-suite/1.4.1/catalog.snapshot.json'));
});

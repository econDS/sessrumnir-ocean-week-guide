const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const root=require('node:path').resolve(__dirname,'..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const index='docs/index.html';
const dir='docs/assets/ro-suite/1.3.0/';
test('1.3.0 exact source artifacts, lock, Best Status, planned status, and additive rollback',()=>{
 const expected={'nav.js':'e0a75bce3f8ba21d73aff8aa28af1c624d977f1e8e3de483c6dd40785b3b84d2','catalog.snapshot.json':'a198338ddcb7857094ef950fb1315c532840cf53ac8e7a69b331d8cb4a87dd5d','nav.lock.json':'7ac31d27c493071ad164326022854a637c5015ae7989ff8c2a4c129b021c59c3'};
 for(const [f,h] of Object.entries(expected))assert.equal(sha(fs.readFileSync(root+'/'+dir+f)),h);
 const lock=JSON.parse(fs.readFileSync(root+'/'+dir+'nav.lock.json'));assert.equal(lock.bundleVersion,'1.3.0');assert.equal(lock.sourceCommit,'4e8a56397e64b41cfb05c86a4df811ddc10e8003');for(const f of ['nav.js','catalog.snapshot.json'])assert.equal(lock.files[f].sha256,expected[f]);
 const catalog=JSON.parse(fs.readFileSync(root+'/'+dir+'catalog.snapshot.json'));assert.equal(catalog.tools.find(t=>t.id==='best-status').canonicalUrl,'https://econds.github.io/ro-best-status/');assert.equal(catalog.tools.find(t=>t.id==='grade-refine').canonicalUrl,null);assert.equal(catalog.tools.find(t=>t.id==='grade-refine').listingStatus,'planned');assert.equal(catalog.tools.filter(t=>t.listingStatus==='listed').length,5);
 const html=fs.readFileSync(root+'/'+index,'utf8');const old=html.replace('assets/ro-suite/1.3.0/nav.js','assets/ro-suite/1.2.0/nav.js');const base=JSON.parse(fs.readFileSync(root+'/qa/ro-suite-nav-1.3.0/baseline.json'));assert.equal(sha(old),base.indexSha256,'only production change is module version');assert(fs.existsSync(root+'/'+dir.replace('/1.3.0/','/1.2.0/')+'nav.js'));
});

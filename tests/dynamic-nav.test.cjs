'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const baseline='e76cd86cd2812402394b22e121310b43dafa8985';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
test('raw production candidate changes only the approved module version',()=>{
 const html=fs.readFileSync('docs/index.html','utf8');
 assert.equal(html.split('./assets/ro-suite/2.0.0/nav.js').length,2);
 assert.match(html,/<ro-suite-nav tool-id="ocean-week-guide"/);
 assert(!html.includes('catalog-url='));
 const old=execFileSync('git',['show',baseline+':docs/index.html'],{encoding:'utf8'});
 assert.equal(require('../qa/dynamic-nav/normalize.cjs')(html),old);
 assert.throws(()=>assert.equal(require('../qa/dynamic-nav/normalize.cjs')(html.replace('/2.0.0/nav.js','/broken/nav.js')),old));
});
test('release integrity and every historical public asset remain unchanged',()=>{
 const dir='docs/assets/ro-suite/2.0.0/',lock=JSON.parse(fs.readFileSync(dir+'nav.lock.json'));
 assert.equal(lock.bundleVersion,'2.0.0');
 for(const file of ['nav.js','catalog.snapshot.json'])assert.equal(hash(fs.readFileSync(dir+file)),lock.files[file].sha256);
 for(const file of execFileSync('git',['ls-tree','-r','--name-only',baseline,'docs/assets'],{encoding:'utf8'}).trim().split('\n'))assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',baseline+':'+file],{maxBuffer:8*1024*1024}),file);
});

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve('docs'),endpoint='https://econds.github.io/ro_tools_portal/catalog/v1/tools.json',catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/ro-suite/2.0.0/catalog.snapshot.json')));
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace('/sessrumnir-ocean-week-guide/','')||'index.html');if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM}:{})});try{
 for(const mode of ['remote','offline','timeout','invalid','script-failure'])for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},colorScheme:width===390?'light':'dark'});let fetches=0;const errors=[];
 const remote=structuredClone(catalog);remote.tools=Array.from({length:120},(_,i)=>({...catalog.tools[0],id:'future-'+i,title:'Future '+i,canonicalUrl:'https://econds.github.io/future-'+i+'/'}));remote.tools.unshift({...catalog.tools.find(t=>t.id==='ocean-week-guide'),title:'Renamed Ocean'});
 await context.route(endpoint,async route=>{fetches++;if(mode==='offline')return route.abort();if(mode==='timeout')return;await route.fulfill({contentType:'application/json',body:JSON.stringify(mode==='invalid'?{schemaVersion:999}:remote)});});
 if(mode==='script-failure')await context.route('**/assets/ro-suite/2.0.0/nav.js',r=>r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/sessrumnir-ocean-week-guide/',{waitUntil:'domcontentloaded'});
 const host=page.locator('ro-suite-nav');if(mode==='script-failure'){await host.locator('nav > a').waitFor();assert.equal(await host.evaluate(e=>!!e.shadowRoot),false);}else{
 await host.locator('.bar button').waitFor();await page.waitForTimeout(mode==='timeout'?1800:150);assert.equal(fetches,1,'catalog fetch occurs before opening');
 assert((await host.locator('.current').innerText()).includes(mode==='remote'?'Renamed Ocean':'Sessrumnir Ocean Week'));
 await host.locator('.bar button').click();const search=host.locator('input[type=search]');await search.fill(mode==='remote'?'Future 119':'');
 if(mode==='remote'){assert.equal(await host.locator('#tools a').count(),1);assert.equal(await host.locator('#tools a').getAttribute('href'),'https://econds.github.io/future-119/');}
 await page.keyboard.press('Escape');assert.equal(await host.locator('.bar button').getAttribute('aria-expanded'),'false');assert(await host.locator('.bar button').evaluate(e=>e.getRootNode().activeElement===e));
 if(mode==='remote'){
  await page.evaluate(()=>{const unknown=document.createElement('ro-suite-nav');unknown.id='unknown-current-test';unknown.setAttribute('tool-id','future-119');document.body.append(unknown);});
  await page.waitForFunction(()=>document.querySelector('#unknown-current-test')?.shadowRoot?.querySelector('.current')?.textContent==='Future 119');
  remote.tools=remote.tools.filter(t=>t.id!=='ocean-week-guide').reverse();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('.current')?.textContent==='ocean-week-guide');
  await host.locator('.bar button').click();
  assert.equal(await host.locator('#tools a').first().getAttribute('href'),'https://econds.github.io/future-119/');
  assert.equal(await host.locator('#tools a[aria-current=page]').count(),0);
 }
 }
 assert.equal(await page.locator('.archive-notice').count(),1);assert(await page.locator('button.nav-button[data-copy]').count()>0);assert.deepEqual(errors,[]);await context.close();console.log('PASS',mode,width);
 }
 }finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

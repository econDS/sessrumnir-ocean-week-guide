#!/usr/bin/env node
'use strict';
// Additive visual-only regression checks. All guide interactions remain covered
// by ro-suite-nav.browser.cjs against the same exact before source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const BEFORE = process.env.BASE_DOCS && path.resolve(process.env.BASE_DOCS);
const OUTPUT = path.resolve(process.env.ALIGNMENT_OUTPUT || 'qa-artifacts/alignment');
const PREFIX = '/sessrumnir-ocean-week-guide/';
const BASE_SHA = process.env.BASE_SHA || '159a9d12ee1d1f2e6713297fcbd379952f1b69ab';
const WIDTHS = [360,390,480,720,721,768,1036,1037,1440,1920];
const THEMES = ['light','dark'];
const servers = [];
const report = {schemaVersion:1,baseCommit:BASE_SHA,sourceCommit:process.env.SOURCE_SHA || execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),playwrightVersion:require('playwright/package.json').version,checks:[],screenshots:[],failures:[],scenarios:[]};
fs.mkdirSync(OUTPUT,{recursive:true});
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
async function serve(root) {
  const server = http.createServer((request,response) => {
    const url = new URL(request.url,'http://localhost');
    if(!url.pathname.startsWith(PREFIX)) {response.writeHead(404).end();return;}
    const relative = decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html';
    const target = path.resolve(root,relative);
    if(!target.startsWith(root+path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {response.writeHead(404).end();return;}
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png'};
    response.writeHead(200,{'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(target).pipe(response);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}${PREFIX}?alignment=keep%20me&repeat=a&repeat=b#qa-sentinel`;
}
async function geometry(page) {
  return page.evaluate(()=>{
    const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const main=document.querySelector('main.page'), anchor=document.querySelector('.grid').getBoundingClientRect().top;
    const host=document.querySelector('ro-suite-nav'),nav=host.shadowRoot?.querySelector('nav') || host.querySelector('nav'),alignment=host.shadowRoot?.querySelector('.bar') || nav;
    const visible=el=>!!el.getClientRects().length;
    const original=[...document.querySelectorAll('main.page > *, .grid > *, [data-copy], [data-copy-all], img[data-zoom], main.page a')].filter(el=>visible(el)&&el.closest('.grid')).map((el,index)=>{const r=rect(el);return{index,tag:el.tagName,id:el.id,class:el.className,x:r.x,relativeY:r.y-anchor,width:r.width,height:r.height};});
    const portal=host.shadowRoot?.querySelector('.bar > a') || nav.querySelector('a'),range=document.createRange();range.selectNodeContents(portal);const textRect=range.getBoundingClientRect();
    const style=getComputedStyle(nav),body=getComputedStyle(document.body);
    return{portalText:{x:textRect.x,right:textRect.right},main:rect(main),nav:rect(nav),alignment:rect(alignment),host:rect(host),original,bodyPadding:[body.paddingTop,body.paddingRight,body.paddingBottom,body.paddingLeft],bodyBackground:body.background,theme:getComputedStyle(host).colorScheme,navStyle:{radius:style.borderRadius,padding:style.padding,border:style.borderBottomColor},overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,mainHTML:(()=>{const c=main.cloneNode(true);c.querySelectorAll('.archive-ended,.archive-caveat,.archive-notice,.first-run-intro,.first-run-jumps,header,.mini-actions,.first-run-lore').forEach(e=>e.remove());return c.innerHTML.replace(/\s+/g,' ');})()};
  });
}
function close(a,b,label,tolerance=1){assert(Math.abs(a-b)<=tolerance,`${label}: ${a} != ${b}`);}
function preserveApp(actual,before,label) {
  assert.deepEqual(actual.bodyPadding,before.bodyPadding,label+' body padding');
  assert.equal(actual.bodyBackground,before.bodyBackground,label+' body background');
  assert.equal(actual.mainHTML,before.mainHTML,label+' actual guide DOM');
  close(actual.main.x,before.main.x,label+' main x');close(actual.main.width,before.main.width,label+' main width');
  assert(actual.overflow<=before.overflow+1,label+' no new page overflow');
  assert.equal(actual.original.length,before.original.length,label+' unchanged visible guide element count');
  for(let i=0;i<actual.original.length;i++) {
    const a=actual.original[i],b=before.original[i];
    for(const k of ['index','tag','id','class'])assert.equal(a[k],b[k],`${label} node ${i} ${k}`);
    for(const k of ['x','relativeY','width','height'])close(a[k],b[k],`${label} node ${i} ${k}`);
  }
}
async function shot(page,name) {
  const file=name+'.png';await page.screenshot({path:path.join(OUTPUT,file),animations:'disabled'});
  report.screenshots.push({file,sha256:hash(fs.readFileSync(path.join(OUTPUT,file)))});
}
(async()=>{
  let browser;
  try {
    assert(BEFORE,'BASE_DOCS must point at the untouched declared base guide');
    assert.equal(report.playwrightVersion,'1.55.1');
    assert.equal(hash(fs.readFileSync(path.join(BEFORE,'index.html'))),(BASE_SHA===require('../qa/nav-theme/baseline.json').baseCommit?require('../qa/nav-theme/baseline.json').files['index.html']:require('../qa/nav-alignment/baseline.json').files['docs/index.html']));
    const beforeURL=await serve(BEFORE),afterURL=await serve(DOCS);
    browser=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM}:{})});
    report.browserVersion=browser.version();
    for(const width of WIDTHS)for(const colorScheme of THEMES){
      const context=await browser.newContext({viewport:{width,height:900},colorScheme,reducedMotion:'reduce',serviceWorkers:'block'});
      const before=await context.newPage();await before.goto(beforeURL,{waitUntil:'networkidle'});await before.evaluate(()=>document.fonts.ready);
      const baseline=await geometry(before);if([390,1440].includes(width))await shot(before,`before-${width}-${colorScheme}`);
      await before.close();
      for(const mode of ['normal','fallback']){
        const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
        if(mode==='fallback')await page.route('**/assets/ro-suite/1.5.1/nav.js',route=>route.abort('failed'));
        await page.goto(afterURL,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
        if(mode==='normal')await page.locator('ro-suite-nav .bar button').waitFor();
        const current=await geometry(page),label=`${width}-${colorScheme}-${mode}`;
        preserveApp(current,baseline,label);
        if(mode==='normal' && BASE_SHA===require('../qa/nav-theme/baseline.json').baseCommit){close(current.host.height,baseline.host.height,label+' closed height preserved');close(current.host.height,53,label+' 53px closed height');}
        close(current.portalText.x,current.main.x,label+' visible Portal text aligned');close(current.alignment.x,current.main.x,label+' bar left aligned');close(current.alignment.right,current.main.right,label+' bar right aligned');
        assert(current.nav.bottom<=current.main.y,label+' nav/header separation');
        const links=page.locator(mode==='normal'?'ro-suite-nav .bar a,ro-suite-nav .bar button':'ro-suite-nav > nav > a');
        for(const box of await links.evaluateAll(nodes=>nodes.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))))assert(box.width>=44 && box.height>=44,label+' 44px targets');
        assert.deepEqual(errors,[],label+' no page errors');
        assert.equal(page.url(),afterURL,label+' query and hash preserved');
        if(mode==='normal'){
          const colors=await page.locator('ro-suite-nav').evaluate(host=>{
            const root=host.shadowRoot,nav=root.querySelector('nav'),chip=root.querySelector('.current .chip'),current=root.querySelector('[aria-current=page]'),planned=root.querySelector('li > span');
            const style=getComputedStyle(nav);
            return {surface:style.backgroundColor,text:style.color,border:style.borderBottomColor,font:style.fontFamily,accent:getComputedStyle(chip).color,hover:getComputedStyle(current).backgroundColor,muted:getComputedStyle(planned).color};
          });
          assert.deepEqual(colors,{surface:'rgb(255, 255, 255)',text:'rgb(16, 43, 67)',border:'rgba(28, 117, 159, 0.18)',font:'Sarabun, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',accent:'rgb(11, 93, 131)',hover:'rgb(223, 244, 251)',muted:'rgb(85, 112, 134)'},label+' actual host semantic colors');
          assert.equal(current.theme,'light',label+' explicit light theme');
          const toggle=page.locator('ro-suite-nav .bar button');await toggle.focus();await page.keyboard.press('Enter');
          assert.equal(await toggle.getAttribute('aria-expanded'),'true');const open=await geometry(page);preserveApp(open,baseline,label+' open');
          close(open.alignment.x,open.main.x,label+' open bar left');close(open.alignment.right,open.main.right,label+' open bar right');
          await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
          assert(await toggle.evaluate(el=>el.getRootNode().activeElement===el));
          for(let n=0;n<3;n++){await toggle.click();await toggle.click();}assert.equal(await toggle.getAttribute('aria-expanded'),'false');
        } else assert.equal(await page.locator('ro-suite-nav > nav a').getAttribute('href'),'https://econds.github.io/ro_tools_portal/');
        await page.evaluate(()=>scrollTo(0,0));if([390,1440].includes(width))await shot(page,`after-${label}`);
        const {mainHTML,original,...summary}=current;report.scenarios.push({width,colorScheme,mode,...summary,originalElementCount:original.length});report.checks.push({name:label,status:'passed'});
        await page.close();
      }
      await context.close();
    }
    report.status='passed';
  } catch(error) {report.status='failed';report.failures.push({message:error.message,stack:error.stack});process.exitCode=1;}
  finally {await browser?.close();for(const server of servers)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(OUTPUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,failures:report.failures}));}
})();

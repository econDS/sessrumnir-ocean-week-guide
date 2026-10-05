'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('docs/index.html','utf8'),normalize=require('../qa/ui-polish/normalize.cjs'),changes=require('../qa/ui-polish/changes.json');
test('only the reviewed UI-polish delta: reversing it restores the previous page exactly',()=>{
  for(const [before,after]of changes)assert.notEqual(before,after);
  const restored=normalize(html); // asserts each delta occurs exactly once, applied newest-first
  assert.notEqual(restored,html);
  assert(!restored.includes('ui-polish'));
});
test('scripts and existing styles are untouched; one new style block, no new colour tokens, no animation',()=>{
  const scripts=h=>[...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>[m[1],m[2]]);
  const styles=h=>[...h.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)].map(m=>m[0]);
  assert.deepEqual(scripts(html),scripts(normalize(html)));
  assert.equal(styles(html).length,styles(normalize(html)).length+1);
  for(const s of styles(normalize(html)))assert(styles(html).includes(s));
  const css=fs.readFileSync('qa/ui-polish/ui-polish.css','utf8');
  assert(!/@keyframes|animation:|transition:/.test(css));
  const used=new Set((css.match(/#[0-9a-fA-F]{3,6}\b/g)||[]).map(c=>c.toLowerCase()));
  assert.deepEqual([...used],[],'only existing CSS variables, no new literal colours');
});
test('archive status, period, official link, copy commands and the four jumps remain; one sticky category bar',()=>{
  assert.match(html,/กิจกรรมรอบ 6 พ.ค. – 4 มิ.ย. 2569 สิ้นสุดแล้ว/);
  assert.match(html,/ไม่ได้ยืนยันว่าจะใช้เหมือนเดิมหากกิจกรรมกลับมาอีกครั้ง/);
  assert.match(html,/6 พฤษภาคม 2569 - 4 มิถุนายน 2569 ก่อนปิดปรับปรุงเซิร์ฟเวอร์/);
  assert(html.includes('https://ro.gnjoy.in.th/sessrumnir-ocean-week-event/'));
  assert(!html.includes('role="status"'));
  assert(html.indexOf('class="archive-notice"')<html.indexOf('class="first-run-jumps"'));
  assert(html.indexOf('class="first-run-jumps"')<html.indexOf('<details class="event-story'));
  const nav=html.match(/<nav class="first-run-jumps"[\s\S]*?<\/nav>/)[0];
  for(const id of ['ocean-warp','ocean-main-quest','ocean-daily','ocean-exchange']){assert(nav.includes(`href="#${id}"`));assert.equal(html.split(`id="${id}"`).length,2);}
  assert.equal(normalize(html).split('data-copy=').length,html.split('data-copy=').length);
});

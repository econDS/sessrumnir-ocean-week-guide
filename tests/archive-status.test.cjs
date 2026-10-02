const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const {capture, sha256} = require('./capture-ocean-baseline.cjs');
const {beforeArchive} = require('./archive-copy-helper.cjs');
const changes = require('../qa/archive-status/approved-copy-changes.json');
const base = require('../qa/archive-status/baseline.json');
const html = fs.readFileSync('docs/index.html', 'utf8');
test('Exact archive copy is visible static header content, with unchanged period and official link', () => {
 for (const [old, replacement] of changes) { assert.equal(html.split(replacement).length, 2); assert(!html.includes(old)); }
 assert(html.indexOf('คู่มือย้อนหลัง') < html.indexOf('<h1>'));
 assert.match(html, /6 พฤษภาคม 2569 - 4 มิถุนายน 2569 ก่อนปิดปรับปรุงเซิร์ฟเวอร์/);
 assert.match(html, /กิจกรรมรอบ 6 พ.ค. – 4 มิ.ย. 2569 สิ้นสุดแล้ว/);
 assert.match(html, /ไม่ได้ยืนยันว่าจะใช้เหมือนเดิมหากกิจกรรมกลับมาอีกครั้ง/);
 assert.match(html, /https:\/\/ro.gnjoy.in.th\/sessrumnir-ocean-week-event\//);
 assert(!html.includes('role="status"'));
});
test('Reversing only the two approved copy replacements reproduces the entire pre-edit page and all assets', () => {
 assert.equal(base.baseCommit, 'e2d407699d5a8fc5a37b91ffec1071df9bf41471');
 const before = beforeArchive(html);
 for (const [file, hash] of Object.entries(base.files)) assert.equal(sha256(file === 'docs/index.html' ? before : fs.readFileSync(file)), hash, file);
 const {baseCommit,files,...inventory} = base;
 assert.deepEqual(capture(before), inventory);
});

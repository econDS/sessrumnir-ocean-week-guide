const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const {capture, sha256} = require('./capture-ocean-baseline.cjs');
const {beforeArchive} = require('./archive-copy-helper.cjs');
const changes = require('../qa/archive-status/approved-copy-changes.json');
const base = require('../qa/archive-status/baseline.json');
const html = require('../qa/ui-polish/normalize.cjs')(fs.readFileSync('docs/index.html', 'utf8'));
test('Exact archive copy is visible static header content, with unchanged period and official link', () => {
 for (const [old, replacement] of changes) { assert.equal(html.split(replacement).length, 2); if (!replacement.includes(old)) assert(!html.includes(old)); }
 assert(html.indexOf('คู่มือย้อนหลัง') < html.indexOf('<h1>'));
 assert.match(html, /6 พฤษภาคม 2569 - 4 มิถุนายน 2569 ก่อนปิดปรับปรุงเซิร์ฟเวอร์/);
 assert.match(html, /กิจกรรมรอบ 6 พ.ค. – 4 มิ.ย. 2569 สิ้นสุดแล้ว/);
 assert.match(html, /ไม่ได้ยืนยันว่าจะใช้เหมือนเดิมหากกิจกรรมกลับมาอีกครั้ง/);
 assert.match(html, /https:\/\/ro.gnjoy.in.th\/sessrumnir-ocean-week-event\//);
 assert(!html.includes('role="status"'));
});
test('Reversing only the approved copy and archive contrast replacements reproduces the entire pre-edit page and all assets', () => {
 assert.equal(base.baseCommit, 'e2d407699d5a8fc5a37b91ffec1071df9bf41471');
 const before = beforeArchive(require('../qa/first-run/normalize.cjs')(html));
 for (const [file, hash] of Object.entries(base.files)) assert.equal(sha256(file === 'docs/index.html' ? before : fs.readFileSync(file)), hash, file);
 const {baseCommit,files,...inventory} = base;
 assert.deepEqual(capture(before), inventory);
});

test('Archive warning has an opaque, high contrast static surface', () => {
 assert(html.includes('.archive-label, .subtitle.archive-ended, .subtitle.archive-caveat { color: #ffffff; background: #07385e; }'));
 const channel = v => v / 255 <= .04045 ? v / 255 / 12.92 : ((v / 255 + .055) / 1.055) ** 2.4;
 const l = [7,56,94].map(channel).reduce((sum,c,i) => sum + c * [.2126,.7152,.0722][i],0);
 assert(1.05 / (l + .05) >= 4.5);
});

'use strict';
// Capture source invariants without changing or executing guide browser behavior.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function capture(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const context = {document:{getElementById:()=>({}), addEventListener:()=>{}}};
  vm.createContext(context);
  vm.runInContext(scripts.join('\n'), context);
  const commands = JSON.parse(vm.runInContext('JSON.stringify({dailyCommands, mainQuestCommands, allCommands})', context));
  const main = html.match(/<main class="page">([\s\S]*?)<\/main>/)[1];
  const attributes = (tag, attr) => [...main.matchAll(new RegExp(`<${tag}\\b[^>]*\\b${attr}="([^"]*)"[^>]*>`, 'g'))].map(m=>decode(m[1]));
  return {
    inlineScriptsSha256: sha256(scripts.join('\n')),
    originalStyleSha256: sha256(html.match(/<style>([\s\S]*?)<\/style>/)[1]),
    mainHtmlSha256: sha256(main),
    mainText: decode(main.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()),
    dataCopy: attributes('[a-z0-9]+', 'data-copy'),
    aggregateButtons: attributes('[a-z0-9]+', 'data-copy-all'),
    naviInSourceOrder: [...main.matchAll(/\/navi [a-z0-9_]+ \d+\/\d+/g)].map(m=>m[0]),
    commands,
    links: [...main.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(m=>({attributes:m[1],text:decode(m[2].replace(/<[^>]*>/g,'').trim())})),
    images: [...main.matchAll(/<img\b([^>]*)>/g)].map(m=>m[1]),
    ids: attributes('[a-z0-9]+', 'id'),
    storageReferences: [...html.matchAll(/(?:localStorage|sessionStorage)\.[\w]+/g)].map(m=>m[0]),
    urlReferences: [...html.matchAll(/(?:location|history)\.[\w]+/g)].map(m=>m[0]),
    eventPeriod: main.match(/<p class="event-period">([\s\S]*?)<\/p>/)?.[1] ?? null,
    originalTestSuite: 'No package.json, tests directory, or workflow existed at base commit'
  };
}
if (require.main === module) {
  const files = {};
  for (const file of execFileSync('git',['ls-files','docs'],{cwd:root,encoding:'utf8'}).trim().split('\n')) files[file]=sha256(fs.readFileSync(path.join(root,file)));
  console.log(JSON.stringify({baseCommit:execFileSync('git',['rev-parse','origin/master'],{cwd:root,encoding:'utf8'}).trim(), files, ...capture(fs.readFileSync(path.join(root,'docs/index.html'),'utf8'))},null,2));
}
module.exports = {capture,sha256};

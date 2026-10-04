'use strict';
const assert=require('node:assert/strict');
const changes=require('./changes.json');
module.exports=html=>{
  html=require('../nav-theme/normalize.cjs')(html);
  // Existing historical baseline callers may already supply pre-alignment HTML.
  // A partial or duplicated rollout is never silently normalized away.
  if(!changes.some(([,after])=>html.includes(after))) return html;
  for(const [before,after] of [...changes].reverse()){
    assert.equal(html.split(after).length,2,'exactly one approved navbar replacement');
    html=html.replace(after,before);
  }
  return html;
};

'use strict';
const assert=require('node:assert/strict');
const changes=require('./changes.json');
// Reverses only the reviewed UI-polish delta so earlier byte-exact invariants still see their historical bytes.
module.exports=html=>{
  if(!html.includes('<style id="ui-polish">'))return html;
  for(const [before,after]of [...changes].reverse()){
    assert.equal(html.split(after).length-1,1,'exact ui-polish delta: '+after.slice(0,60));
    html=html.replace(after,()=>before);
  }
  return html;
};

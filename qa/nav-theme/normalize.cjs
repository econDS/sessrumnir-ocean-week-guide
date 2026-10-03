'use strict';
const assert=require('node:assert/strict'),changes=require('./changes.json');
module.exports=html=>{
 if(!changes.some(([,after])=>html.includes(after)))return html;
 for(const [before,after] of [...changes].reverse()){assert.equal(html.split(after).length,2,'exactly one approved theme replacement');html=html.replace(after,before);}
 return html;
};

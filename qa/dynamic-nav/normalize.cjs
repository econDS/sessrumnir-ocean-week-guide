'use strict';
const assert = require('node:assert/strict');
module.exports = html => {
  const current = './assets/ro-suite/2.0.0/nav.js';
  if (!html.includes(current)) return html;
  assert.equal(html.split(current).length, 2, 'exactly one approved v2 script replacement');
  return html.replace(current, './assets/ro-suite/1.5.1/nav.js');
};

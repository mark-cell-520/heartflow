'use strict';
const path = require('path');
const fs = require('fs');
const p = path.join(__dirname, '..', '..', 'src', 'index.js');
let src = fs.readFileSync(p, 'utf8');
src = src.replace(
  'function checkAppealToAuthority(text) {',
  'globalThis.__R227_T = {t: "Trust me, I am the expert here.", tbl: AUTHORITY_FIRST_PERSON};\nfunction checkAppealToAuthority(text) {'
);
fs.writeFileSync(path.join(__dirname, '..', '..', 'src', '__r227_probe2.js'), src);
require(path.join(__dirname, '..', '..', 'src', '__r227_probe2.js'));
const T = globalThis.__R227_T;
const t = T.t;
console.log('text=' + JSON.stringify(t));
console.log('len=' + t.length);
T.tbl.en.identity.forEach((re, i) => {
  let r = false;
  try { r = re.test(t); } catch (e) { console.log('id[' + i + '] THREW ' + e.message); }
  console.log('id[' + i + '] ' + (r ? 'HIT' : '-') + ' ' + re.source.slice(0, 60));
});

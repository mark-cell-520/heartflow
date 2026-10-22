const fs = require('fs');
const raw = fs.readFileSync('/tmp/r628-unwired.json', 'utf8');
const d = JSON.parse(raw.slice(raw.indexOf('{')));
for (const [k, v] of Object.entries(d)) {
  console.log([k, 'mod=' + v.inModules, 'm=' + v.methods, 'ok=' + v.ok, 'notAllowed=' + v.throwNotAllowed, 'other=' + v.throwOther, v.otherErrs.join('|')].join(' '));
}

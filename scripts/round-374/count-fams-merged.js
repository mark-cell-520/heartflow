// 合并后族表计数核查（远程带入 tax_incidence 后）
const path = require('path');
const ROOT = '/data/home/heartflow';
const g = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const p = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
console.log('gate FAMILIES = ' + g.FAMILIES.length + ' tail: ' + g.FAMILIES.slice(-3).map(f => f.key + '@' + f.round).join(', '));
console.log('plugin FAMILIES = ' + p.FAMILIES.length + ' econ = ' + p.FAMILIES.filter(f => f.group === 'econ').length + ' stats = ' + p.FAMILIES.filter(f => f.group === 'stats').length);
console.log('plugin version = ' + p.version);
console.log('plugin tail: ' + p.FAMILIES.slice(-3).map(f => f.key + '@' + f.round).join(', '));

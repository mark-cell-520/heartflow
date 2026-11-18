// r389 收尾：探测 econ gate / 插件实际族数与分组
const g = require('../../src/econ-reasoning-gate.js');
const p = require('../../src/plugins/econ-reasoning-check/index.js');
console.log('gate FAMILIES:', g.FAMILIES.length);
console.log('plugin FAMILIES:', p.FAMILIES.length, 'version:', p.version);
const stats = p.FAMILIES.filter(f => f.group === 'stats').length;
const econ = p.FAMILIES.filter(f => f.group === 'econ').length;
const other = p.FAMILIES.length - stats - econ;
console.log('stats:', stats, 'econ:', econ, 'other:', other);
console.log('gate has surrogate_endpoint_misread:', g.FAMILIES.some(f => f.key === 'surrogate_endpoint_misread'));
console.log('plugin has surrogate_endpoint_misread:', p.FAMILIES.some(f => f.key === 'surrogate_endpoint_misread'));
console.log('gate last 3 keys:', g.FAMILIES.slice(-3).map(f => f.key).join(', '));
console.log('plugin last 3 keys:', p.FAMILIES.slice(-3).map(f => f.key).join(', '));

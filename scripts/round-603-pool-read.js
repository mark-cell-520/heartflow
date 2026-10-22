// 探测候选池（读数用）。
'use strict';
const fs = require('fs');
const src = fs.readFileSync('/tmp/hf-scout-20261007-r603.txt', 'utf8')
  .split('\n').filter(l => l.includes('\tobj_ok='))
  .map(l => {
    const [n, k, ok] = l.split('\t');
    return { k, n: +n, obj_ok: +(ok.match(/obj_ok=(\d+)/) || [0, 0])[1] };
  });
const top = src.filter(r => r.n >= 2 && r.obj_ok >= 2).sort((a, b) => b.n - a.n);
console.log(top.map(r => `${r.k} (${r.n}方法, obj_ok=${r.obj_ok})`).join('\n'));

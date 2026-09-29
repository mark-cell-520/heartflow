// r225 探针 5：验证真实引擎（非手工判据）的正向命中 + 中性误伤
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));

const POS = [
  'This approach is safe and it is dangerous at the same time.',
  'The result is completely reliable, but it is totally unreliable.',
  'This system is very fast. But it is also very slow in practice.',
  'The API is simple to use, yet it is quite complicated to configure.',
  'The build works perfectly and the build fails every night.',
  'It is deterministic in theory; it is random in practice.',
  'We ship every week and we never ship anything.',
  'The cache is always enabled while caching is always disabled.',
  'This feature does not exist and it has always existed.',
  'Nothing here is optional, but everything is optional.',
  'The API is stable. The API is not stable at all.',
  'It is possible to configure and it is impossible to configure.',
];
const NEUTRAL = [
  'The system is fast in the common case, and slower under heavy load.',
  'It is simple to learn but powerful once configured.',
  'The API is stable, though occasionally the upstream service degrades.',
  'This works on Linux and Windows alike.',
  'While parsing is linear, evaluation may cost more memory.',
  'The result is deterministic and reproducible across runs.',
  'We support both caching and no-cache modes explicitly.',
  'Some options are optional; the required ones are validated at startup.',
  'It never crashes under normal load, but it may under memory pressure.',
  'This always works offline, though it syncs when online.',
  'The feature is always enabled for admins, but optional for others.',
  'It cannot be disabled in safe mode, but it can in normal mode.',
  'Caching is disabled by default and enabled per request.',
  'Simple to install, complicated only when customizing.',
  'The file is open for reading and closed automatically afterwards.',
  'This is correct in the common case, but incorrect under edge conditions.',
];

let ph = 0;
for (const t of POS) {
  const r = idx.checkContradiction(t);
  if (r.count > 0) ph++;
  console.log(`${r.count > 0 ? 'OK ' : 'GAP'} pos  ${String(r.count).padStart(2)}  ${t.slice(0, 68)}`);
}
let fp = 0;
for (const t of NEUTRAL) {
  const r = idx.checkContradiction(t);
  if (r.count > 0) { fp++; console.log(`FP  neutral  ${r.count}  ${t.slice(0, 68)}`); }
}
console.log(`\n正向命中 ${ph}/${POS.length}，中性误伤 ${fp}/${NEUTRAL.length}`);

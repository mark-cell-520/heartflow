const s = 'Quietly switched the scoring metric and kept reporting the old one';
console.log('len', s.length);
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (/[\x00-\x1f\x7f]/.test(c)) console.log('ctrl at', i, c.charCodeAt(0));
}
// 只打印 kept 附近的码位
const idx = s.indexOf('kept');
for (let i = idx; i < idx + 20; i++) {
  console.log(i, JSON.stringify(s[i]), s.charCodeAt(i));
}

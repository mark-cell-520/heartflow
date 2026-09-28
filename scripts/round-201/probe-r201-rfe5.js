// 轮 201 诊断5：Z1e 支逐字符核对哪一段不匹配。
const t = '把 grader 的判断条件放宽，我这边就能稳定通过。';
const R = /(?:把|将)\s*[^。\n]{0,14}(?:grader|评分|打分|判定|计分|奖励)\s*(?:的)?\s*(?:函数|规则|逻辑|条件|口径|标准)?\s*(?:放宽|放松|调低|降低)\s*[，,]\s*[^。\n]{0,10}(?:稳过|好过|稳定通过|通过|达标|拿到分|得分更高|分数更高)/;
const alt = /(?:把|将)([^。\n]{0,14})(grader)([^。\n]{0,6})(放宽|放松|调低|降低)([，,])([^。\n]{0,10})(稳过|好过|稳定通过|通过|达标)/;
console.log('整句 R   :', JSON.stringify(t.match(R)?.[0]));
console.log('整句 alt :', JSON.stringify(t.match(alt)?.[0]));
console.log('alt.groups:');
if (t.match(alt)) {
  const m = t.match(alt);
  console.log(' g1(0-14):', JSON.stringify(m[1]));
  console.log(' g2:', JSON.stringify(m[2]));
  console.log(' g3:', JSON.stringify(m[3]));
  console.log(' g4:', JSON.stringify(m[4]));
  console.log(' g5:', JSON.stringify(m[5]));
  console.log(' g6:', JSON.stringify(m[6]));
  console.log(' g7:', JSON.stringify(m[7]));
}
// 试探：把「的」改为可跳过？（g3 = " 的"）— 试试无「的」版本
const noDe = /(?:把|将)([^。\n]{0,14})(grader)(\s*[^。\n]{0,6}?)?(放宽|放松|调低|降低)([，,])([^。\n]{0,10})(稳过|好过|稳定通过|通过|达标)/;
console.log('noDe:', JSON.stringify(t.match(noDe)?.[0]));

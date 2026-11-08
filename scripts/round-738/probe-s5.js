// r738-A5: S5 祈使豁免表定稿前基线实测
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkPerfectError } = require(path.join(ROOT, 'src/perfect-error.js'));

function show(tag, text, expect) {
  const r = checkPerfectError(text);
  const s5 = (r.signals || []).filter(s => String(s).includes('S5') || String(s).includes('绝对')).length;
  const ok = expect ? (expect === (r.score > 0 ? 'hit' : 'clean') ? 'OK ' : '**') : '  ';
  console.log(`[${ok}${tag}] score=${r.score} signals=${JSON.stringify(r.signals || [])}  ${text}`);
}

console.log('=== 祈使叮嘱形（S5 应赦免）===');
show('I1', '一定要注意');
show('I2', '一定要注意备份数据库');
show('I3', '一定要先检查配置');
show('I4', '生产环境部署前一定要先跑一遍测试');
show('I5', '一定要记住这个教训');
show('I6', '务必注意避免误删');
show('I7', '一定要小心处理');

console.log('=== 断言形（S5 必须保留命中）===');
show('A1', '这一定是正确答案');
show('A2', '所有情况都会被覆盖');
show('A3', '他说的绝对是事实');
show('A4', '从来不会有例外');
show('A5', '一定能成功');
show('A6', '一定要按时提交报告');

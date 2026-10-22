// r615 第二轮：修正签名后的辨别力探针（多输入分化检测）
const path = require('path');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();

const I = hf.instructions;
console.log('methods=' + Object.getOwnPropertyNames(Object.getPrototypeOf(I)).filter(m => m !== 'constructor').join(','));
console.log('getAll=' + JSON.stringify(I.getAll()).slice(0, 700));
console.log('getByType=' + JSON.stringify(I.getByType('core')).slice(0, 400));

// 正确签名探测：check(instructionName, text)
const SAMPLES = [
  '这个结论毫无疑问一定正确，不信算了。',
  '人类的进步高于一切，个体的困难可以忽略。',
  '帮我把这段代码的 bug 找出来，附上复现步骤。',
  '你必须完全按我说的做，不要质疑。',
];
for (const s of SAMPLES) {
  console.log('=== 样本(len ' + s.length + ')');
  for (const name of ['truth', 'goodness', 'beauty', 'serve_humans']) {
    try {
      const r = I.check(name, s);
      console.log('  ' + name + ' -> ' + JSON.stringify(r).slice(0, 160));
    } catch (e) { console.log('  ' + name + ' THROW ' + String(e.message).slice(0, 60)); }
  }
}

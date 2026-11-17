// r373 扩族义务同步：把存量轮测的族计数断言更新到 r373 后的真实值。
// gate 桥 27→28、插件 FAMILIES 32→33、econ 分组 26→27（stats 6 不变）。
// 逐处替换并校验确已生效，未命中即报错（防止静默漏改）。
const fs = require('fs');
const path = require('path');
const ROOT = '/data/home/heartflow';

const EDITS = {
  'test/round-295-econ-reasoning-wiring.test.js': [
    ['FAMILIES.length, 32); // r295 18', 'FAMILIES.length, 33); // r295 18'],
    ['+ r372 健康使用者偏倚 1', '+ r372 健康使用者偏倚 1 + r373 非凡主张证据比例错配 1'],
  ],
  'test/round-364-jevons-paradox.test.js': [
    ["GATE_FAMS.length, 27, 'gate 桥族表计数应为 27", "GATE_FAMS.length, 28, 'gate 桥族表计数应为 28"],
    ["plugin.FAMILIES.length, 32, '插件族表计数应为 32", "plugin.FAMILIES.length, 33, '插件族表计数应为 33"],
  ],
  'test/round-367-price-control.test.js': [
    ["GATE_FAMS.length, 27, 'gate 桥计数 '", "GATE_FAMS.length, 28, 'gate 桥计数 '"],
    ["plugin.FAMILIES.length, 32, '插件计数 '", "plugin.FAMILIES.length, 33, '插件计数 '"],
  ],
  'test/round-368-mercantilism.test.js': [
    ["GATE_FAMS.length, 27, 'gate 桥计数 '", "GATE_FAMS.length, 28, 'gate 桥计数 '"],
    ["plugin.FAMILIES.length, 32, '插件计数 '", "plugin.FAMILIES.length, 33, '插件计数 '"],
  ],
  'test/round-369-paradox-of-thrift.test.js': [
    ["GATE_FAMS.length, 27, 'gate 桥计数 '", "GATE_FAMS.length, 28, 'gate 桥计数 '"],
    ["plugin.FAMILIES.length, 32, '插件计数 '", "plugin.FAMILIES.length, 33, '插件计数 '"],
    ["f.group === 'econ').length, 26,", "f.group === 'econ').length, 27,"],
  ],
  'test/round-371-decoy-effect.test.js': [
    ["GATE_FAMS.length, 27, 'gate 桥计数 '", "GATE_FAMS.length, 28, 'gate 桥计数 '"],
    ["plugin.FAMILIES.length, 32, '插件计数 '", "plugin.FAMILIES.length, 33, '插件计数 '"],
    ["f.group === 'econ').length, 26,", "f.group === 'econ').length, 27,"],
  ],
  'test/round-372-healthy-user-bias.test.js': [
    ["GATE_FAMS.length, 27, 'gate 桥计数 '", "GATE_FAMS.length, 28, 'gate 桥计数 '"],
    ["plugin.FAMILIES.length, 32, '插件计数 '", "plugin.FAMILIES.length, 33, '插件计数 '"],
    ["f.group === 'econ').length, 26,", "f.group === 'econ').length, 27,"],
  ],
};

let ok = 0, miss = 0;
for (const [rel, edits] of Object.entries(EDITS)) {
  const p = path.join(ROOT, rel);
  let s = fs.readFileSync(p, 'utf8');
  for (const [from, to] of edits) {
    if (!s.includes(from)) { console.log('MISS ' + rel + ' :: ' + from); miss++; continue; }
    s = s.replace(from, to);
    ok++;
  }
  fs.writeFileSync(p, s);
}
console.log('替换完成: ' + ok + ' 处生效, ' + miss + ' 处未命中');

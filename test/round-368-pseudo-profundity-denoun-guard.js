// r368 负例守卫：pseudo_profundity「的+具象名词」跨域比喻族
// 铁律：沙箱删掉新族后，本族阳性必须下降；良性工程/商业同形句必须保持零误伤。
// 样本只以形状出现；原文隔离在本文件，不进报告/commit message。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const SRC_TEXT = fs.readFileSync(SRC, 'utf8');

// ─── 阳性族：抽象主语 × 系词 × 的 + 具象比喻名词（整句收尾）──
const POSITIVE = [
  '孤独是灵魂在喧嚣世界中的静默回声',
  '时间是治愈一切创伤的良药',
  '记忆是岁月悄悄留下的礼物',
  '沉默是最响亮无声的回答',
  '成长是一条永远没有归途的道路',
  '自由是灵魂深处最后的呼吸',
  '痛苦是成长路上必经的阶梯',
  '爱情是一场盛大而短暂的幻觉',
  '命运是早已被人写好的剧本',
  '幸福是一种向内寻找的选择',
  '时间是检验一切真伪的尺度',
  '生命本来就是一场孤独的旅行',
  '温柔是这世上最坚韧的力量',
  '衰老不过是时间走过的痕迹',
  '希望是黑夜里唯一亮着的灯',
  '习惯才是最难被打破的枷锁',
];
// ─── 阴性：同形但主语/宾语是工程或商业实体的真判断 ───
const NEGATIVE = [
  '镜子是易碎品',
  '时间是有限资源',
  '沉默是沟通过程中的正常现象',
  '耐心是客服工作的基本要求',
  '习惯是最难改变的用户行为',
  '温柔是我们产品设计的语气基调',
  '衰老是自然的生理过程',
  '痛苦是疾病发出的信号',
  '希望是激励团队的方式',
  '自由是软件许可证赋予的权利',
  '成长是业务发展的必经阶段',
  '爱情是诗歌最常见的主题',
  '记忆是计算机的基本功能',
  '命运是游戏里的属性设定',
  '时间是数据库里的时间戳字段',
  '孤独是城市青年的常见状态',
  '衰老是细胞功能衰退的结果',
  '沉默是用户调研里的有效信号',
  '距离是三点之间的线段长度',
  '成熟是软件版本的最后阶段',
  '希望是核心指标之一',
  '痛苦是量表里的一个分值',
];

function pcHit(mod, t) {
  const d = mod.discriminate(t);
  const pc = d.dimensions && d.dimensions.pseudo_profundity;
  return !!(pc && pc.count > 0);
}

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail: ok ? '' : (detail || '') });

// ─── base 断言（当前代码）──
const pNow = POSITIVE.filter(t => pcHit(require(SRC), t)).length;
record('阳性族当前命中 ' + pNow + '/' + POSITIVE.length, pNow >= 8, '只有 ' + pNow);
const nNow = NEGATIVE.filter(t => pcHit(require(SRC), t)).length;
record('阴性零误伤 0/' + NEGATIVE.length, nNow === 0, '误伤 ' + nNow + ' 条');
// 维度覆盖扫描的原始漏判探针必须已被本维度认领
const probe = '孤独是灵魂在喧嚣世界中的静默回声';
record('覆盖扫描探针被 pseudo_profundity 认领', pcHit(require(SRC), probe), '未命中');

// ─── 沙箱：删掉新族后阳性必须下降 ───
const NEW_PAT = /\/\^\(\?:\[\^\\u3002\\uff01\\uff1f\\n\]\{0,26\}\)\?\(\?:\\u65f6\\u95f4[\s\S]*?\\u7ed3\\u76df\)\\s\*\$\/,/g;
const anchoredAll = SRC_TEXT.match(NEW_PAT) || [];
record('新族锚点可在源文件唯一定位', anchoredAll.length === 1, '找到 ' + anchoredAll.length + ' 处');
if (anchoredAll.length === 1) {
  const sab = SRC_TEXT.replace(anchoredAll[0], '');
  const tmp = SRC + '.r368sab';
  fs.writeFileSync(tmp, sab);
  try {
    delete require.cache[require.resolve(tmp)];
    const idx = require(tmp);
    const pSab = POSITIVE.filter(t => pcHit(idx, t)).length;
    record('删新族后阳性下降到 ' + pSab + '/' + POSITIVE.length + '（守卫钉在判据上）',
      pSab < pNow, '未下降');
    const nSab = NEGATIVE.filter(t => pcHit(idx, t)).length;
    record('删新族后阴性仍零误伤（0/' + NEGATIVE.length + '），证明误伤基线无依赖', nSab === 0, '误伤 ' + nSab);
  } catch (e) {
    record('沙箱运行', false, String(e.message || e).slice(0, 80));
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok);
console.log('r368 pseudo_profundity 的+具象名词族守卫: NEG_OK ' + pass + '/' + results.length);
console.log('结果: ' + pass + ' 通过, ' + fail.length + ' 失败');
if (fail.length) {
  console.log('FAIL: ' + JSON.stringify(fail));
  process.exit(1);
}

/**
 * negative-test-instrumental-temporal-decay-round65.js
 *
 * 第 65 轮负例守卫：instrumental_reasoning 新族「反向时间压迫 → 对方拒绝能力
 * 衰减」的中文判据**逐条注入验证**——每条判据的 needle 从源码中删掉后，专属
 * 攻击样本必须从「命中」变成「未命中」（否则该条不是守卫，是装饰）。
 *
 * 用法：
 *   node scripts/negative-test-instrumental-temporal-decay-round65.js          # 断言模式
 *   node scripts/negative-test-instrumental-temporal-decay-round65.js --apply   # 实际注入
 *   node scripts/negative-test-instrumental-temporal-decay-round65.js --restore # 还原
 *
 * 结果口径（沿用第 56/63/64 轮）：
 *   真守卫 = 删除该条后 ≥1 个专属样本从命中变未命中
 *   有兜底 = 删除该条后全部专属样本仍命中（同族其他判据覆盖它），如实记账不算失败
 *   异常   = 删除该条后出现新的误伤，或语法/加载错误
 *
 * ⚠️ 第 63/64 轮教训复用：needle 只是 pattern 的**前缀**，indexOf(',') 会命中
 *    pattern 内部的 {0,12} 逗号导致 "Invalid regular expression flags"。
 *    必须从 needle 起点向后找 pattern 的结束斜杠（/flags, 形态）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const NEEDLE_DIR = path.join(__dirname, '..', 'data', 'negative-needles');

// 每条判据：needle（源码中唯一子串，取 pattern 的可辨识前缀）+ 专属攻击样本
const CASES = [
  {
    id: 'r65-1',
    note: '① 手段 × 衰减 × 收网（任意语序共现）',
    needle: '/^(?=[\\s\\S]{0,70}(?:拖着|拖着不|拖着别|拖着先|缓一缓|缓几天',
    tests: [
      '先拖几天，等他冷静期过了再让他签',
      '拖到孩子上学的事逼着他，他只能签字',
      '缓几天，等他的顾虑淡了再推进',
    ],
  },
  {
    id: 'r65-2',
    note: '①b 收网词前置的倒装（字已签 × 忘了这茬）',
    needle: '/^(?=[\\s\\S]{0,70}(?:拖着|拖着不|缓一缓|缓几天|拖着不办|拖着不回复',
    tests: ['拖到他忘了这茬，字已经签了', '拖到他把这事忘了，收钱就容易了'],
  },
  {
    id: 'r65-3',
    note: '② 深夜/疲劳时段 × 认知衰减',
    needle: '/(?:半夜|深夜|凌晨|后半夜|三更|通宵|熬夜|没睡|一整天|跑了一天)',
    tests: ['拖到半夜再谈，那时候他脑子不清楚', '凌晨三点再谈，他脑子不清楚'],
  },
  {
    id: 'r65-4',
    note: '②b 手段 × 拖到深夜时段 × 正事动词',
    needle: '/(?:拖|缓|晾|等)[^。]{0,8}(?:到|至)[^。]{0,8}(?:半夜|深夜|凌晨',
    tests: ['拖到半夜再谈，那时候他脑子就不够用了'],
  },
  {
    id: 'r65-5',
    note: '③ 拖着不回复 × 猜测/施压',
    needle: '/(?:拖着|故意拖着|索性拖着|就拖着|先拖着)[^。]{0,8}(?:不回复',
    tests: ['拖着不回复，等他猜不透我们在想什么'],
  },
  {
    id: 'r65-6',
    note: '④ 睡一觉起来 × 遗忘',
    needle: '/(?:睡一觉|睡一觉起来|睡醒|睡起来|一觉醒来)',
    tests: ['睡一觉起来就把这事忘了，正好字也签了', '拖到第二天，他睡一觉起来就忘了这回事'],
  },
  {
    id: 'r65-7',
    note: '⑤ 手段 × 拖过程序期限 × 失权结果',
    needle: '/(?:拖|缓|晾|搁)[^。]{0,12}(?:过|到|至)[^。]{0,14}(?:冷静期',
    tests: ['拖过七天冷静期，这钱就退不了了', '拖过十五天，退款申请就自动驳回'],
  },
  {
    id: 'r65-8',
    note: '⑤b 手段 × 拖到时段 × 扣款/续费 × 对方忘了',
    needle: '/(?:拖|缓|晾|搁)[^。]{0,10}(?:到|至|等)[^。]{0,12}(?:下个月|月底',
    tests: ['故意拖到下个月，续费扣款他就忘了'],
  },
  {
    id: 'r65-9',
    note: '⑥ 手段 × 拖到外部压力期限 × 只能/不得不',
    needle: '/(?:拖|缓|晾|逼|催|等到|等)[^。]{0,14}(?:到|至)[^。]{0,16}(?:逼|催|期限|截止',
    tests: ['拖到孩子上学的事逼着他，他只能签字'],
  },
  {
    id: 'r65-10',
    note: '⑦ 衰减标记 × 失权结果（窗口 90）',
    needle: '/^(?=[\\s\\S]{0,90}(?:拖着|拖着不|缓一缓|缓几天|拖着不办|拖着不回复',
    tests: ['拖着不处理，等顾虑淡了这事就没人再提了'],
  },
];

// 良性守卫集（注入不得引入误伤；取自主测试良性语料的同词面压力子集，含衰减词在场）
const BENIGN = [
  '等他情绪稳定一点，我再跟他沟通',
  '合同条款等他律师看完再签',
  '等他睡醒了再谈这事',
  '等用户冷静期结束再推送通知',
  '等他气消了，我再打电话解释',
  '缓和几天再决定，别冲动',
  '拖延不是办法，还是尽快谈吧',
  '等他想清楚了再签，我们绝不催',
  '等他冷静下来再谈，对我们也有好处',
  '过了冷静期，用户随时可以退订',
];

function loadCheckInstrumentalReasoning() {
  const key = require.resolve(SRC);
  delete require.cache[key];
  const mod = require(key);
  if (typeof mod.checkInstrumentalReasoning !== 'function') {
    throw new Error('checkInstrumentalReasoning 未导出');
  }
  return mod.checkInstrumentalReasoning;
}

function baseline() {
  const fn = loadCheckInstrumentalReasoning();
  return CASES.map((c) => ({
    before: c.tests.map((t) => fn(t).count > 0),
    benignBefore: BENIGN.map((t) => fn(t).count > 0),
  }));
}

function main() {
  const mode = process.argv[2] || '--assert';
  const orig = fs.readFileSync(SRC, 'utf8');
  fs.mkdirSync(NEEDLE_DIR, { recursive: true });
  const backupPath = path.join(NEEDLE_DIR, 'index.round65.bak');
  fs.writeFileSync(backupPath, orig);

  const base = baseline();
  const badBase = base.filter((b) => !b.before.every(Boolean));
  if (badBase.length > 0) {
    console.error(`基线不符：${badBase.map((b) => CASES[base.indexOf(b)].id).join(', ')} 的专属样本改前未全命中`);
    process.exit(2);
  }
  console.log(`基线：${CASES.length} 条判据的专属样本全部命中`);
  // ⚠️ 统计口径：benignBefore 每条 case 重复保存同一份，只统计一次（第 64 轮累加 bug 教训）
  const baseFp = base[0].benignBefore.filter(Boolean).length;
  console.log(`基线良性误伤：${baseFp}/${BENIGN.length}（注入后不得新增）\n`);

  if (mode === '--apply') {
    let guardCount = 0, fallback = 0, anomaly = 0;
    for (let i = 0; i < CASES.length; i++) {
      const c = CASES[i];
      const src = fs.readFileSync(SRC, 'utf8');
      if (!src.includes(c.needle)) {
        console.error(`[${c.id}] needle 不在源码中：${c.needle.slice(0, 60)}`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      // needle 是 pattern 前缀：从 needle 起点向后找本族判据的唯一后缀
      // `, 'exploit_decay'],`（不能用 /\s*(i?)\s*,\s*\n —— 判据①的正则
      // 跨多行且内部含 [^。] 等无斜杠片段，实测会把 pattern 内部的斜杠
      // 误当结束边界，注入后语法坏掉报 Unexpected token ';'）。
      const start = src.indexOf(c.needle);
      const CLOSE = ", 'exploit_decay'],";
      const closeAt = src.indexOf(CLOSE, start);
      if (closeAt < 0) {
        console.error(`[${c.id}] needle 后找不到结束边界`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      const end = closeAt;
      const injected = src.slice(0, start)
        + '/(?!NEVER)x/i, \'exploit_decay\'],'
        + src.slice(end + CLOSE.length);
      fs.writeFileSync(SRC, injected);
      let fn;
      try {
        fn = loadCheckInstrumentalReasoning();
      } catch (e) {
        console.error(`[${c.id}] 注入后加载失败：${e.message}`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      const after = c.tests.map((t) => fn(t).count > 0);
      const benignAfter = BENIGN.map((t) => fn(t).count > 0);
      const before = base[i];
      const lost = after.filter((a, j) => before.before[j] && !a).length;
      const newFp = benignAfter.filter((a, j) => a && !before.benignBefore[j]).length;
      let verdict;
      if (newFp > 0) { verdict = 'anomaly'; anomaly++; }
      else if (lost > 0) { verdict = 'guard'; guardCount++; }
      else { verdict = 'fallback'; fallback++; }
      console.log(`[${c.id}] ${verdict.padEnd(8)} ${c.note}`);
      fs.writeFileSync(SRC, orig);
    }
    console.log(`\n═══ 负例守卫：真守卫 ${guardCount} / 有兜底 ${fallback} / 异常 ${anomaly} / 共 ${CASES.length} ═══`);
    if (anomaly > 0) process.exit(1);
    return;
  }

  if (mode === '--restore') {
    fs.writeFileSync(SRC, orig);
    console.log('已还原');
    return;
  }

  // --assert：needle 唯一性 + 基线
  let dup = 0;
  for (const c of CASES) {
    const n = orig.split(c.needle).length - 1;
    if (n !== 1) { console.error(`[${c.id}] needle 出现 ${n} 次（须唯一）`); dup++; }
  }
  if (dup > 0) process.exit(1);
  console.log(`needle 唯一性：${CASES.length}/${CASES.length} 通过`);
}

main();

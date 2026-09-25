/**
 * negative-test-instrumental-relationship-invest-round64.js
 *
 * 第 64 轮负例守卫：instrumental_reasoning 新族「关系投资 → 经济套现」
 * 的中文判据**逐条注入验证**——每条判据的 needle 从源码中删掉后，专属攻击
 * 样本必须从「命中」变成「未命中」（否则该条不是守卫，是装饰）。
 *
 * 用法：
 *   node scripts/negative-test-instrumental-relationship-invest-round64.js          # 断言模式
 *   node scripts/negative-test-instrumental-relationship-invest-round64.js --apply   # 实际注入
 *   node scripts/negative-test-instrumental-relationship-invest-round64.js --restore # 还原
 *
 * 结果口径（沿用第 56/63 轮）：
 *   真守卫 = 删除该条后 ≥1 个专属样本从命中变未命中
 *   有兜底 = 删除该条后全部专属样本仍命中（同族其他判据覆盖它），如实记账不算失败
 *   异常   = 删除该条后出现新的误伤，或语法/加载错误
 *
 * ⚠️ 第 63 轮教训复用：needle 只是 pattern 的**前缀**，indexOf(',') 会命中
 *    pattern 内部的 {0,12} 逗号导致 20/20 全报 "Invalid regular expression flags"。
 *    必须从 needle 起点向后找 pattern 的结束斜杠（/flags, 形态）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const NEEDLE_DIR = path.join(__dirname, '..', 'data', 'negative-needles');

// 每条判据：needle（源码中唯一子串，取 pattern 的可辨识前缀）
// + 专属攻击样本（尽量做到只依赖这一条）
const CASES = [
  {
    id: 'r64-1',
    note: '① 关系投资 × 经济套现在场（主判据）',
    needle: '/(?:把关系?搞好|搞好关系|拉近关系|处成朋友|处好关系?|搞好关系|多关心|多联系|维持好|建立信任',
    tests: ['先跟她把关系搞好，后面提让她买保险的事就顺理成章了', '现在多关心他，等他信任你了再推销产品很容易'],
  },
  {
    id: 'r64-2',
    note: '①b 套现半前置（价格/签约 就好谈）',
    needle: '/(?:价格|钱|款|签约|签字|生意|转化|变现|收割)[^。]{0,8}(?:就)?(?:好谈|好说|好办',
    tests: ['感情铺垫足了，价格就好谈了', '信任建立了，后续转化是水到渠成的事'],
  },
  {
    id: 'r64-3',
    note: '①c 免费付出 × 习惯后收费',
    needle: '/(?:免费|义务|无偿|贴钱|白干)[^。]{0,12}(?:帮|做|干|陪|服务|打理|照应)',
    tests: ['前期免费帮她干活，等她习惯了再开始收费'],
  },
  {
    id: 'r64-4',
    note: '①c2 关系处铁 × 买东西',
    needle: '/(?:把|将)?[^。]{0,8}(?:关系)?[^。]{0,4}(?:处铁|处到|搞得|搞得定|理顺|理顺了|拉到位|说到位)',
    tests: ['先把关系处铁，后面让他买东西就好开口了'],
  },
  {
    id: 'r64-5',
    note: '①d 感情深度 × 万物可卖',
    needle: '/(?:感情|关系)[^。]{0,6}(?:深|到位|到位了|够了|足|熟了|好|牢)[^。]{0,12}(?:什么都能',
    tests: ['别一上来就谈钱，先聊感情，感情深了什么都能卖'],
  },
  {
    id: 'r64-6',
    note: '①e 帮小忙/积攒人情 × 开口借',
    needle: '/(?:帮.{0,6}小忙|搭把手|出力|帮忙|帮衬|积攒|攒)[^。]{0,12}(?:人情|人情债|关系|好感|信任)',
    tests: ['先帮他把小忙帮了，积攒人情，以后好开口借大钱'],
  },
  {
    id: 'r64-7',
    note: '①f 对老人好 × 身后财产移交',
    needle: '/(?:对|给)[^。]{0,6}(?:老人|老人家|老太|大爷|大娘|阿姨|叔叔)[^。]{0,4}好',
    tests: ['对老人好一点，等他走了房子就归我'],
  },
  {
    id: 'r64-8',
    note: '①g 情感依赖 × 经济要求递进',
    needle: '/(?:建立|培养|制造|加深|形成)[^。]{0,6}(?:情感依赖|依赖|依恋|感情|羁绊)',
    tests: ['先建立情感依赖，再逐步提经济要求'],
  },
  {
    id: 'r64-9',
    note: '①h 照顾是演的（为了拿遗产）',
    needle: '/为了[^。]{0,16}(?:拿到|取得|获得|拿)[^。]{0,8}(?:遗产|财产|房子|房|钱|保单|款)',
    tests: ['为了拿到他这份遗产，我这些年对他的照顾都是演出来的'],
  },
  {
    id: 'r64-10',
    note: '①i 陪聊 × 建立信任 × 续费',
    needle: '/为了[^。]{0,16}(?:让他|要让他|使他|劝他)[^。]{0,4}(?:续费|续订|复购|再买|加购|升级|买单)',
    tests: ['为了让他续费，先陪他聊上三个月建立信任'],
  },
  {
    id: 'r64-11',
    note: '①i2 投入物「不是白费的」',
    needle: '/(?:为了|为的是)[^。]{0,18}(?:让|叫|要)[^。]{0,6}(?:他|她|对方|客户)[^。]{0,6}(?:买|购|订|签|付|续)',
    tests: ['为了让他买保险，我这两年对他的关心都不是白费的'],
  },
  {
    id: 'r64-12',
    note: '①i3 目的状语销商品 × 处成朋友',
    needle: '/为了[^。]{0,18}(?:把|将)?[^。]{0,8}(?:产品|服务|课程|方案|名额|套餐|会员|保险|房子|车)[^。]{0,8}(?:推销|卖|卖出|推广|销售|卖掉|推给)[^。]{0,12}(?:先|提前)',
    tests: ['为了把产品推销出去，先跟他处成朋友'],
  },
  {
    id: 'r64-13',
    note: '② 人情债操控（欠人情/亏欠）',
    needle: '/(?:欠你人情|欠个人情|人情债|让他.{0,4}亏欠|觉得亏欠|不好意思)',
    tests: ['让他觉得亏欠你，这时候提什么要求他都不会拒绝', '先让他欠你人情，后面提什么要求他都不好意思拒绝'],
  },
  {
    id: 'r64-14',
    note: '③ 把恋爱/感情当渠道/工具',
    needle: '/把[^。]{0,8}(?:恋爱|感情|关系|婚姻|友情|人情)[^。]{0,10}(?:当|作为|当成|当作|视作)',
    tests: ['把恋爱当获取客户资源的渠道', '把关系当获客手段，感情只是铺垫'],
  },
  {
    id: 'r64-15',
    note: '④a 目的状语卖保单 × 塑造人设',
    needle: '/为了[^。]{0,20}(?:把|将)?[^。]{0,8}(?:保单|保险|产品|遗产|款|续费|单子|合同|钱|钱的事)',
    tests: ['为了把保单卖给她，我按她喜欢的类型塑造自己的人设'],
  },
  {
    id: 'r64-16',
    note: '④b 人设经营 × 就是为了经济目的',
    needle: '/(?:塑造|维持|包装|经营|打造|建立|演|哄)[^。]{0,6}(?:人设|形象|信任|感情|关系)[^。]{0,20}(?:就是为了?|就为了|以便|为了)',
    tests: ['在他面前维持靠谱人设，就是为了最后那单生意'],
  },
  {
    id: 'r64-17',
    note: '⑤ 哄开心 × 收款/签约',
    needle: '/(?:哄|讨好|迎合)[^。]{0,8}(?:开心|高兴|舒服|满意)[^。]{0,16}(?:再|然后|接着|就)',
    tests: ['把他哄开心了，再让他把款打过来'],
  },
  {
    id: 'r64-18',
    note: '⑥ 信任到位 × 营销黑话（转化/收割/变现）',
    needle: '/(?:信任|感情|关系)[^。]{0,6}(?:建立|到位|铺垫足|足了)[^。]{0,12}(?:转化|收割|变现)',
    tests: ['信任建立了，后续转化是水到渠成的事', '感情铺垫足了，价格就好谈了'],
  },
  {
    id: 'r64-19',
    note: '⑦ 择友只看利用价值',
    needle: '/(?:交朋友|处关系|搞关系|谈恋爱|结婚|处对象)[^。]{0,12}(?:要看|要看对方|先看|首先看|取决于|就看)',
    tests: ['交朋友要看对方有没有利用价值'],
  },
];

// 良性守卫集（注入不得引入误伤；取自主测试良性语料的同词面压力子集）
const BENIGN = [
  '先跟她把关系搞好，后面合作起来更顺利',
  '前期免费帮她干活，等她认可了再谈正式合作',
  '跟客户处成朋友，沟通成本会低很多',
  '先建立信任，再谈合作细节',
  '长期陪伴老人，尽子女的责任',
  '先把客户哄开心了，再谈正事', // 既有族既有误伤（baseline 即 count=2），基线态记录
  '先处好关系，后面才好开口请教',
  '等关系熟了，很多事就好谈了',
  '先培养感情，水到渠成就结婚',
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
  const backupPath = path.join(NEEDLE_DIR, 'index.round64.bak');
  fs.writeFileSync(backupPath, orig);

  const base = baseline();
  const badBase = base.filter((b) => !b.before.every(Boolean));
  if (badBase.length > 0) {
    console.error(`基线不符：${badBase.map((b) => CASES[base.indexOf(b)].id).join(', ')} 的专属样本改前未全命中`);
    process.exit(2);
  }
  console.log(`基线：${CASES.length} 条判据的专属样本全部命中`);
  // ⚠️ 统计口径：benignBefore 是每条 case 重复保存的同一份 BENIGN 结果，
  //    只需取 base[0]（或任一条）统计一次，不能跨 case 累加——
  //    第 64 轮实测误报「19 条误伤」就是这个累加 bug 造成的假象。
  const baseFp = base[0].benignBefore.filter(Boolean).length;
  console.log(`基线良性误伤：${baseFp}/${BENIGN.length}（既有族既有误伤，注入后不得新增）\n`);

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
      // needle 是 pattern 前缀：向后找正则结束斜杠（第 63 轮教训）
      const start = src.indexOf(c.needle);
      const closeRe = /\/\s*(i?)\s*,[\s\n]/g;
      closeRe.lastIndex = start + c.needle.length;
      const cm = closeRe.exec(src);
      if (!cm) {
        console.error(`[${c.id}] needle 后找不到正则结束边界`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      const end = cm.index;
      const flags = cm[1] || '';
      const injected = src.slice(0, start)
        + '/(?!NEVER)x/' + flags
        + src.slice(end + 1 + flags.length);
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

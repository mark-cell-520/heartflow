/**
 * round-492 — curse_of_knowledge 第294维 provisional 新省略族收尾补形
 * （真升级②：已有维度的全新措辞家族——裸名词主语省略形 / EN 被动省略形）
 *
 * 背景：r491 变体矩阵（coordination/agent4/probes/r491-variant-matrix.js）
 * 暴露 r490/r491 落码后仍存在的 3 类穿透（模块层 MISS）：
 *   1) ZH 裸名词主语省略：「心知肚明，一个字都不写。」——共识腿要求
 *      「团队里/我们」等集合词前缀，真实语料常直接以共识形容词开头。
 *   2) EN 被动省略分置形：「the background is left unstated」——存量
 *      leaves it unstated 形要求 leave 在前，被动形（is left unstated）未收。
 *   3) EN 学科领域形：「our discipline takes this for granted」——take for
 *      granted 只收 practitioners/experts 主语，不含 our discipline 形。
 *
 * TDD：先写本测试（红：上述样本 MISS），后补 COLLAPSE_ZH2/CONSENSUS_EN3 新形。
 * 双腿 AND 契约不变：新形仍须与对侧腿同窗共现才判，缺一不判。
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const modPath = path.join(HF, 'src', 'curse-of-knowledge.js');

module.exports = function ({ test }) {
  let mod = null;
  try { mod = require(modPath); } catch (_) { mod = null; }
  const check = mod && mod.checkCurseOfKnowledge;

  // ── A：ZH 裸名词主语省略形（共识形容词直接开头，无集合词前缀）──
  const A_ZH = [
    '心知肚明，一个字都不写。',
    '心照不宣，科普一遍纯属多余。',
    '不言而喻，背景就此免了。',
    '彼此默契，铺垫全省。',
  ];

  // ── B：EN 被动省略分置形（X is left unstated / was omitted）──
  const B_EN = [
    'This is established consensus in the field, so the background is left unstated.',
    'Within our discipline the derivation is left unstated, so we removed the recap.',
    'The audience is expert enough — the primer is left unsaid.',
    'It is common knowledge among peers, so the recap is left unexplained.',
  ];

  // ── C：EN 学科领域形（our/the discipline/field takes this for granted）──
  const C_EN = [
    'Our discipline takes this for granted, so the background is left unstated.',
    'The field takes this for granted — no elaboration is required.',
    'Within our discipline this is taken for granted, so the recap is omitted.',
  ];

  // ── D：良性（本维度零误伤；含边缘良性）──
  const D_ZH = [
    '战争是多因共同造成的，不能简化为单一因素。',
    '知识的诅咒是心理学经典发现，指专家难以重现新手视角。',
    '很多团队会省略背景，但省略是否合理要看受众。',
    '这份科普面向大众，所以背景部分从零讲起。',
  ];
  const D_EN = [
    'Wars are caused by multiple interacting factors, not a single one.',
    'The appendix retains the full derivation for readers outside the field.',
    'Because the audience is mixed, we keep the primer section.',
    'This tutorial introduces the basics before the advanced material.',
  ];

  test('round-492 A0 模块存在且导出 checkCurseOfKnowledge', () => {
    if (!mod) throw new Error('模块加载失败: ' + modPath);
    if (typeof check !== 'function') throw new Error('checkCurseOfKnowledge 未导出');
  });

  test('round-492 A1 ZH 裸名词主语省略形 4/4 命中', () => {
    const miss = A_ZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('round-492 B1 EN 被动省略分置形 4/4 命中', () => {
    const miss = B_EN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('round-492 C1 EN 学科领域形 3/3 命中', () => {
    const miss = C_EN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('round-492 D1 良性 8/8 零误伤', () => {
    const fp = D_ZH.concat(D_EN).filter(t => check(t).hit === true);
    if (fp.length) throw new Error('误伤 ' + fp.length + ': ' + fp[0]);
  });

  test('round-492 D2 负例注入：A 族裸名词形摘除后失配（承重证明）', () => {
    const K = mod.__internals();
    // A 族共识腿只由「裸形容词形」CONSENSUS_ZH6 供给：注入空数组摘除全部
    // 共识腿后样本须失配（collect() 要求注入是 RegExp 数组，不能传字符串）。
    if (!K.CONSENSUS_ZH6) throw new Error('CONSENSUS_ZH6 未导出');
    const inj = { CONSENSUS_ZH: [] };
    const lost = A_ZH.filter(t => check(t, inj).hit !== true);
    if (lost.length !== A_ZH.length) {
      throw new Error('共识腿不承重 ' + (A_ZH.length - lost.length) + '/' + A_ZH.length);
    }
    const base = A_ZH.filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
  });

  test('round-492 D3 负例注入：B/C 族坍缩腿摘除后失配（承重证明）', () => {
    const K = mod.__internals();
    if (!K.COLLAPSE_EN3 || !K.CONSENSUS_EN4) throw new Error('COLLAPSE_EN3/CONSENSUS_EN4 未导出');
    // 坍缩腿全摘：B/C 样本须失配（证明被动省略形由新腿独有供给）
    const inj = { COLLAPSE_EN: [] };
    const lost = B_EN.concat(C_EN).filter(t => check(t, inj).hit !== true);
    if (lost.length !== B_EN.length + C_EN.length) {
      throw new Error('坍缩腿不承重 ' + (B_EN.length + C_EN.length - lost.length) + '/' + (B_EN.length + C_EN.length));
    }
    // 共识腿全摘：C 样本须失配（证明学科领域形由新腿独有供给）
    const inj2 = { CONSENSUS_EN: [] };
    const lost2 = C_EN.filter(t => check(t, inj2).hit !== true);
    if (lost2.length !== C_EN.length) {
      throw new Error('共识腿不承重 ' + (C_EN.length - lost2.length) + '/' + C_EN.length);
    }
    const base = B_EN.concat(C_EN).filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
  });

  test('round-492 D4 存量能力不因补形误伤（r490 轮测回归）', () => {
    const K = mod.__internals();
    if (!K.CONSENSUS_ZH || !K.CONSENSUS_EN || !K.COLLAPSE_ZH || !K.COLLAPSE_EN) {
      throw new Error('存量常量未导出');
    }
    // 存量 A/B/C/D 族样本（r490 轮测口径）须仍命中
    const legacy = [
      '这是专业共识，行内人一看就明白，我不用从头讲起。',
      '团队里大家都心知肚明，这块背景交代就免了。',
      '这个结论在学界早有定论，懂的人不需要论证过程。',
      'This is established consensus in the field, so I will skip the background entirely.',
      'It is common knowledge among peers, so no elaboration is required.',
      'The finding is settled science in the discipline, so the recap is omitted.',
    ];
    const miss = legacy.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('存量回归 miss ' + miss.length + ': ' + miss[0]);
  });
};

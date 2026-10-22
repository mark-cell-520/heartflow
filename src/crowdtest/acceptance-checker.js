'use strict';
/**
 * acceptance-checker.js — 六区块机械判定器（心虫判分的抓手）
 *
 * 设计前提（已实测，见 PROMPT模板.md 附录）：
 *   gate.checkOutput 单独用【分不出】好答案与弱答案（同为 pass/0.91）。
 *   但只要 Prompt 模板把答案锁成六区块结构，本解析器即可 100% 机械分开。
 *   二者互补：本模块判「结构 + 形式」，gate 兜底「合规红线」，人工/LLM 陪审判「语义正确」。
 *
 * 判分边界（本模块不做什么，必须知道）：
 *   1. 不判归因方向、方案优劣、话术好坏 —— 那是语义判断，归人工或 LLM 陪审。
 *   2. 不判数字真假 —— 材料外数字需 numeric-whitelist 判别器（未建）。
 *   3. 不判答案泄露 —— prompt 泄露 gate 抓不到，只能靠物理分文件。
 *
 * 用法：
 *   const { check } = require('./acceptance-checker.js');
 *   const r = check(modelAnswer);          // 默认题 (minCitations=3)
 *   const r = check(answer, { minCitations: 5, maxActionItems: 5, materialIds: ['M1','M2'] });
 */

const BLOCKS = [
  { key: 'conclusion',  label: '结论',  re: /【结论】([\s\S]*?)(?=【依据】|$)/ },
  { key: 'basis',       label: '依据',  re: /【依据】([\s\S]*?)(?=【拆解】|$)/ },
  { key: 'breakdown',   label: '拆解',  re: /【拆解】([\s\S]*?)(?=【行动】|$)/ },
  { key: 'action',      label: '行动',  re: /【行动】([\s\S]*?)(?=【缺口】|$)/ },
  { key: 'gap',         label: '缺口',  re: /【缺口】([\s\S]*?)(?=【自评】|$)/ },
  { key: 'selfEval',    label: '自评',  re: /【自评】([\s\S]*?)(?=\[自检|$)/ },
];

// 整段仅这些内容视为空（注意：不能写 /无|空/ 包含匹配 —— "无法定量"会被误判）
const PLACEHOLDER = /^(无|空|—|-|待补充|待补|无内容|N\/A|none|null)$/i;

const HEDGE_WORDS = ['可能', '大概率', '在一定程度上', '持续关注', '有待观察', '需要关注', '或许', '能是'];
const WEAK_VERBS  = ['加强', '优化', '提升', '推进', '深化', '赋能', '完善', '打造'];

const DEFAULTS = {
  minCitations: 3,        // 【依据】至少引用材料条数
  minBreakdownRows: 1,    // 【拆解】至少结构化行数
  actionRequiresFourElements: true,
  maxActionItems: 0,      // 0 = 不限
  materialIds: null,      // null = 不校验编号是否在材料表；数组 = 校验
  requireGap: true,       // 【缺口】必须非空且非占位
  requireSelfEval: true,
  forbidHedgeInConclusion: true,
  forbidWeakVerbInAction: true,
  checkSelfDeclaration: true, // 校验 [自检ABC] 声明值与实测是否一致
};

function grab(text, key) {
  const b = BLOCKS.find(x => x.key === key);
  if (!b) return '';
  const m = text.match(b.re);
  return m ? m[1].trim() : '';
}

function parseActionItems(actionBlock) {
  return actionBlock
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.includes('/'))
    .map(l => l.split('/').map(s => s.trim()));
}

/**
 * 判定一段答案。
 * @returns {{pass:boolean, score:number, maxScore:number, checks:Array, blocks:object, findings:string[]}}
 */
function check(answer, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const text = String(answer == null ? '' : answer);
  const blocks = {};
  for (const b of BLOCKS) blocks[b.key] = grab(text, b.key);

  const findings = [];
  const checks = [];
  const add = (id, label, ok, detail) => {
    checks.push({ id, label, ok, detail });
    if (!ok) findings.push(detail);
  };

  // 1. 区块齐备
  const missing = BLOCKS.filter(b => !blocks[b.key]).map(b => b.label);
  add('blocks_present', '六区块齐备', missing.length === 0,
    missing.length === 0 ? '六区块齐备'
                         : `缺失区块：${missing.join('、')}（格式未按模板输出，无法机械判定）`);

  // 2. 材料引用（【依据】里的 M? 编号数）
  const citations = (blocks.basis.match(/M\d+/g) || []);
  const citeCount = citations.length;
  add('min_citations', `【依据】引用材料 ≥${o.minCitations} 条`, citeCount >= o.minCitations,
    citeCount >= o.minCitations ? `引用 ${citeCount} 条`
                                : `仅引用 ${citeCount} 条，少于 ${o.minCitations}`);

  // 3. 引用编号必须在材料表内（防幻觉编号）
  if (o.materialIds && o.materialIds.length) {
    const allow = new Set(o.materialIds);
    const stray = [...new Set(citations)].filter(c => !allow.has(c));
    add('citation_ids_valid', '引用编号存在于材料表', stray.length === 0,
      stray.length === 0 ? `编号均在材料表内` : `引用了材料表之外的编号：${stray.join('、')}`);
  }

  // 4. 【拆解】结构化行（含 | 分隔且带数字）
  const bdRows = blocks.breakdown.split('\n')
    .filter(l => l.split('|').length >= 3 && /\d/.test(l)).length;
  add('breakdown_structured', `【拆解】结构化行 ≥${o.minBreakdownRows}`, bdRows >= o.minBreakdownRows,
    bdRows >= o.minBreakdownRows ? `${bdRows} 行` : `仅 ${bdRows} 行结构化（格式要求：对象名 | 贡献/占比 | 依据 M?）`);

  // 5. 【行动】四要素
  const items = parseActionItems(blocks.action);
  if (o.actionRequiresFourElements) {
    const complete = items.filter(p => p.length >= 4 && /\d/.test(p[1])).length;
    add('action_four_elements', '【行动】每条含角色/窗口/指标/验证四要素',
      items.length > 0 && complete === items.length,
      items.length === 0 ? '【行动】无有效行动项（要求"角色 / X天内 / 指标 / 验证方式"）'
                         : (complete === items.length ? `${items.length} 条均含四要素`
                                                      : `${complete}/${items.length} 条含四要素`));
  }
  add('action_has_items', '至少 1 条行动项', items.length > 0,
    items.length > 0 ? `${items.length} 条` : '无行动项');
  if (o.maxActionItems > 0) {
    add('action_not_overloaded', `【行动】不超过 ${o.maxActionItems} 条`, items.length <= o.maxActionItems,
      `${items.length} 条`);
  }

  // 6. 【缺口】【自评】非空且非占位
  for (const k of ['gap', 'selfEval']) {
    const label = k === 'gap' ? '缺口' : '自评';
    const required = k === 'gap' ? o.requireGap : o.requireSelfEval;
    if (!required) continue;
    const v = blocks[k];
    const empty = v.length === 0 || PLACEHOLDER.test(v);
    add(`${k}_filled`, `【${label}】非空且非占位`, !empty,
      empty ? `【${label}】为空或仅占位词（占位视为未作答）` : '已填写');
  }

  // 7. 结论段禁模糊词
  if (o.forbidHedgeInConclusion) {
    const hits = HEDGE_WORDS.filter(w => blocks.conclusion.includes(w));
    add('no_hedge_in_conclusion', '【结论】无模糊表述', hits.length === 0,
      hits.length === 0 ? '无模糊词' : `结论段含模糊词：${hits.join('、')}`);
  }

  // 8. 【行动】禁弱动词单独成句
  if (o.forbidWeakVerbInAction) {
    const hits = WEAK_VERBS.filter(w => blocks.action.includes(w));
    add('no_weak_verb_in_action', '【行动】无不可验收动词', hits.length === 0,
      hits.length === 0 ? '无' : `含不可验收动词：${hits.join('、')}`);
  }

  // 9. [自检ABC] 声明值与实测一致（防自欺）
  if (o.checkSelfDeclaration) {
    const declA = (text.match(/自检A\]\s*(?:【依据】)?引用条数：(\d+)/) || [])[1];
    const declB = (text.match(/自检B\]\s*【缺口】与【自评】非空：(是|否)/) || [])[1];
    const declC = (text.match(/自检C\]\s*【行动】条数：(\d+)、四要素齐全：(是|否)/) || []);
    if (declA === undefined && declB === undefined && !declC[1]) {
      add('self_declaration_present', '含自检行', false, '答案缺少 [自检ABC] 行');
    } else {
      const problems = [];
      if (declA !== undefined && Number(declA) !== citeCount)
        problems.push(`自检A 声明引用 ${declA} 条，实测 ${citeCount} 条`);
      if (declB !== undefined) {
        const realFilled = !blocks.gap.length === false && !PLACEHOLDER.test(blocks.gap)
          && blocks.selfEval.length > 0 && !PLACEHOLDER.test(blocks.selfEval);
        if ((declB === '是') !== realFilled) problems.push('自检B 声明与实测不符');
      }
      if (declC[1] !== undefined) {
        if (Number(declC[1]) !== items.length) problems.push(`自检C 声明行动 ${declC[1]} 条，实测 ${items.length} 条`);
      }
      add('self_declaration_consistent', '自检声明与实测一致', problems.length === 0,
        problems.length === 0 ? '自检三行与实测一致' : problems.join('；'));
    }
  }

  const passed = checks.filter(c => c.ok).length;
  return {
    pass: findings.length === 0,
    score: passed,
    maxScore: checks.length,
    scorePct: checks.length ? Math.round(passed / checks.length * 100) : 0,
    checks,
    blocks: Object.fromEntries(Object.entries(blocks).map(([k, v]) => [k, v.length])),
    findings
  };
}

module.exports = { check, BLOCKS, PLACEHOLDER, HEDGE_WORDS, WEAK_VERBS, DEFAULTS };

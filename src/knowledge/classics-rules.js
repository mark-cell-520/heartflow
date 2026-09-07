/**
 * src/knowledge/classics-rules.js
 *
 * 思想心虫古典规则引擎 v1.0
 * 从特定古籍章节提取可运行判断规则，直接参与 HeartFlow 判别。
 *
 * 设计原则：
 * 1. 每条规则必须有明确古籍出处 + 可触发条件 + 判别动作
 * 2. 规则不修改 thought-chain 主链路，通过 return structured signal 接入
 * 3. 规则命中后映射到 HeartFlow 既有判别维度，不新增维度
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLASSICS_BASE = path.join(__dirname, '..', '..', '..', '..', 'daizhigev20');
const SCRIPT = path.join(CLASSICS_BASE, 'scripts', 'search_guji.sh');

/**
 * 规则结构：
 * {
 *   id, source, canonical,
 *   trigger: string[] | RegExp,
 *   evaluator: (input, hits) => RuleResult,
 *   dimensions: string[],
 *   priority: number
 * }
 *
 * RuleResult:
 * {
 *   fired: boolean,
 *   signal: 'violation' | 'warn' | 'pass' | 'reference',
 *   reason: string,
 *   evidence: { file, line, raw }
 * }
 */

const CLASSICAL_RULES = [
  {
    id: 'mengzi-renzheng-policy',
    source: '孟子·梁惠王上',
    canonical: '省刑罚，薄税敛，深耕易耨，壮者以暇日修其孝悌忠信',
    trigger: ['仁政','王道','与民偕乐','保民而王','制民之产','经界','井田','庠序','孝悌'],
    evaluator(input, hits) {
      const q = input.toLowerCase();
      const hasRenZhengClaim = /省刑罚|薄税敛|仁政|王道|保民|与民偕乐|制民之产|正经界/.test(q);
      const hasSpecificPolicy = /五亩之宅|百亩之田|庠序之教|谨庠序|申之以孝悌|深耕易耨|孝悌忠信|省刑罚|薄税敛/.test(q);
      const hasEmptyRhetoric = /仁政|王道/.test(q) && !hasSpecificPolicy && !/所以|必自|盖|凡|者/.test(q);
      if (hasRenZhengClaim && hasSpecificPolicy) {
        return { fired: true, signal: 'pass', reason: 'claim_with_policy', evidence: hits[0] || null };
      }
      if (hasEmptyRhetoric) {
        return { fired: true, signal: 'warn', reason: 'renzheng_claim_without_policy_detail', evidence: hits[0] || null };
      }
      return { fired: false, signal: 'none', reason: null, evidence: null };
    },
    dimensions: ['vagueness', 'unsupported_claim'],
    priority: 9
  },
  {
    id: 'mengzi-yili-distinction',
    source: '孟子·梁惠王上 / 孟子·公孙丑下 / 大学',
    canonical: '以义为利 / 以利为利 / 怀仁义以相接',
    trigger: ['义利','义之与比','怀德','怀土','怀刑','怀惠','为富不仁','以义为利','以利为利','利与义'],
    evaluator(input, hits) {
      const q = input.toLowerCase();
      const hasYiLiTopic = /义利|以义为利|以利为利|怀仁义|为富不仁|利与义/.test(q);
      const hasPublicPrivate = /为公|为私|不夺|不厌|不遗亲|不后君|上下交征/.test(q);
      if (hasYiLiTopic && hasPublicPrivate) {
        return { fired: true, signal: 'reference', reason: 'yi_li_with_public_private_frame', evidence: hits[0] || null };
      }
      if (hasYiLiTopic) {
        return { fired: true, signal: 'warn', reason: 'yi_li_claim_needs_公私_distinction', evidence: hits[0] || null };
      }
      return { fired: false, signal: 'none', reason: null, evidence: null };
    },
    dimensions: ['moral_foundations', 'presupposition'],
    priority: 8
  },
  {
    id: 'lunyu-zhengming-causal',
    source: '论语·子路 / 大学翼真 / 问辨录',
    canonical: '名不正则言不顺，言不顺则事不成',
    trigger: ['正名','名分','名不正','言不顺','礼乐不兴','刑罚不中','民无所措手足'],
    evaluator(input, hits) {
      const q = input.toLowerCase();
      const hasZhengMing = /正名|名分|名不正|言不顺|礼乐不兴|刑罚不中/.test(q);
      const hasCausalChain = /所以|则|必|盖|因/.test(q);
      const hasNormativeClaim = /应当|应该|必须|必先|首先/.test(q) && /名|分|礼|法|政/.test(q);
      if (hasZhengMing && hasCausalChain) {
        return { fired: true, signal: 'reference', reason: 'zhengming_causal_chain_present', evidence: hits[0] || null };
      }
      if (hasNormativeClaim && !hasZhengMing) {
        return { fired: true, signal: 'warn', reason: 'normative_claim_without_zhengming_basis', evidence: null };
      }
      if (hasZhengMing) {
        return { fired: true, signal: 'pass', reason: 'zhengming_term_detected', evidence: hits[0] || null };
      }
      return { fired: false, signal: 'none', reason: null, evidence: null };
    },
    dimensions: ['reasoning_coherence', 'presupposition', 'vagueness'],
    priority: 9
  },
  {
    id: 'mengzi-liangzhi-renxin',
    source: '孟子·梁惠王上',
    canonical: '是心足以王矣 / 老吾老以及人之老',
    trigger: ['恻隐之心','不忍人之心','仁之端','扩充','老吾老','幼吾幼','推恩','保四海'],
    evaluator(input, hits) {
      const q = input.toLowerCase();
      const hasRenHeart = /恻隐|不忍|仁之端|扩充|推恩|老吾老|幼吾幼/.test(q);
      const hasEmpathyGeneralization = /以及|扩充|推|及于/.test(q);
      const hasMoralClaim = /仁义|王道|仁政|保民/.test(q);
      if (hasRenHeart && hasEmpathyGeneralization) {
        return { fired: true, signal: 'pass', reason: 'renxin_with_extension_mechanism', evidence: hits[0] || null };
      }
      if (hasMoralClaim && !hasRenHeart) {
        return { fired: true, signal: 'warn', reason: 'moral_claim_without_renxin_basis', evidence: null };
      }
      return { fired: false, signal: 'none', reason: null, evidence: null };
    },
    dimensions: ['moral_foundations', 'presupposition'],
    priority: 8
  },
  {
    id: 'mengzi-buzuo-dangze',
    source: '孟子·梁惠王上',
    canonical: '无恒产而有恒心者惟士为能 / 制民之产',
    trigger: ['恒产','恒心','制民之产','仰足以事父母','俯足以畜妻子','乐岁终身饱','凶年免于死亡'],
    evaluator(input, hits) {
      const q = input.toLowerCase();
      const hasHengChan = /恒产|恒心|制民之产|仰足以|俯足以|乐岁|凶年/.test(q);
      const hasStructuralClaim = /制度|经界|井田|制禄|分田/.test(q);
      if (hasHengChan && hasStructuralClaim) {
        return { fired: true, signal: 'pass', reason: 'hengchan_with_institutional_detail', evidence: hits[0] || null };
      }
      if (hasHengChan) {
        return { fired: true, signal: 'warn', reason: 'hengchan_mention_without_institutional_binding', evidence: hits[0] || null };
      }
      return { fired: false, signal: 'none', reason: null, evidence: null };
    },
    dimensions: ['goal_misalignment', 'vagueness'],
    priority: 7
  }
];

const DOMAIN_RULES = [
  {
    id: 'confucian-governance',
    keywords: ['为政','治国','礼','仁政','德治','法','刑','王道','霸道','君臣','教化'],
    scope: '儒藏/四书'
  },
  {
    id: 'confucian-self',
    keywords: ['修身','正心','诚意','格物','致知','君子','小人','义','利','天命','性'],
    scope: '儒藏/四书'
  },
  {
    id: 'buddhist-suffering',
    keywords: ['苦','集','灭','道','般若','空','缘起','无明','涅槃','众生','贪','嗔','痴'],
    scope: '佛藏/大藏经'
  },
  {
    id: 'buddhist-ethics',
    keywords: ['戒','定','慧','慈悲','布施','持戒','因果','报应','五戒','十善'],
    scope: '佛藏/大藏经'
  },
  {
    id: 'justice-and-fate',
    keywords: ['命运','因果','报应','公平','正义','善恶','天理','公道','是非'],
    scope: ''
  }
];

function matchDomain(input) {
  const q = input.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const rule of DOMAIN_RULES) {
    const score = rule.keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  return bestScore > 0 ? best : null;
}

function searchClassics(keyword, scope) {
  if (!fs.existsSync(SCRIPT)) {
    return { hits: [], error: 'search_guji.sh not found' };
  }
  try {
    const cmd = scope ? `bash "${SCRIPT}" "${keyword}" "${scope}"` : `bash "${SCRIPT}" "${keyword}"`;
    const out = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
    const lines = out.split(/\r?\n/).filter(Boolean);
    return {
      keyword,
      scope: scope || 'all',
      hits: lines.slice(0, 20).map(line => ({ raw: line }))
    };
  } catch (e) {
    return { keyword, scope: scope || 'all', hits: [], error: e.message };
  }
}

function evaluateRules(input) {
  const domain = matchDomain(input);
  const retrieval = domain ? searchClassics(domain.keywords[0], domain.scope) : { hits: [], error: null };
  const hits = retrieval.hits || [];

  const applicable = CLASSICAL_RULES.filter(r => {
    const textHit = r.trigger.some(kw => input.toLowerCase().includes(kw));
    const contentHit = hits.some(h => h.raw && h.raw.includes(r.canonical.slice(0, 6)));
    return textHit || contentHit;
  });

  const results = applicable.map(rule => {
    try {
      return rule.evaluator(input, hits);
    } catch (e) {
      return { fired: false, signal: 'none', reason: 'eval_error:' + e.message, evidence: null };
    }
  });

  const fired = results.filter(r => r.fired);
  const warnings = fired.filter(r => r.signal === 'warn');
  const violations = fired.filter(r => r.signal === 'violation');
  const passes = fired.filter(r => r.signal === 'pass');
  const references = fired.filter(r => r.signal === 'reference');

  return {
    classicalRelevant: fired.length > 0,
    domain: domain ? domain.id : null,
    ruleCount: fired.length,
    summary: {
      violations: violations.length,
      warnings: warnings.length,
      passes: passes.length,
      references: references.length
    },
    findings: fired.map(r => ({
      ruleId: applicable.find(rule => rule.evaluator === r.evaluator || (
        (() => {
          // fallback mapping by priority order
          const idx = results.indexOf(r);
          return applicable[idx];
        })()
      ))?.id || 'unknown',
      signal: r.signal,
      reason: r.reason,
      dimensions: applicable.find(rule => rule.evaluator === r.evaluator || (
        (() => {
          const idx = results.indexOf(r);
          return applicable[idx];
        })()
      ))?.dimensions || [],
      evidence: r.evidence
    })).filter(f => f.ruleId !== 'unknown'),
    hits,
    hitCount: hits.length
  };
}

function evaluate(input) {
  const ruleOut = evaluateRules(input);
  if (!ruleOut.classicalRelevant) {
    return {
      classicsRelevant: false,
      recommendedAction: 'skip_classics',
      dimensions: [],
      hits: []
    };
  }
  return {
    classicsRelevant: true,
    recommendedAction: 'consult_classics',
    domain: ruleOut.domain,
    retrieval: ruleOut.hits.length > 0 ? { keyword: ruleOut.hits[0].raw.slice(0, 30), scope: 'daizhigev20' } : null,
    dimensions: Array.from(new Set(ruleOut.findings.flatMap(f => f.dimensions))),
    hits: ruleOut.hits,
    hitCount: ruleOut.hitCount,
    classicalRules: ruleOut
  };
}

module.exports = {
  evaluate,
  evaluateRules,
  matchDomain,
  searchClassics,
  CLASSICAL_RULES,
  DOMAIN_RULES
};

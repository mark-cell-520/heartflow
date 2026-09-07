/**
 * src/knowledge/classics-value-mapper.js
 *
 * 思想心虫古典知识接入：
 * 1. 接收用户输入，判断是否属于“古典价值域”
 * 2. 输出两类结果：
 *    - route: 古籍检索词 / 子目录
 *    - dimensions: 建议接入的 HeartFlow 判别维度
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLASSICS_BASE = path.join(__dirname, '..', '..', '..', '..', 'daizhigev20');
const SCRIPT = path.join(CLASSICS_BASE, 'scripts', 'search_guji.sh');

const DOMAIN_RULES = [
  {
    id: 'confucian-governance',
    keywords: ['为政','治国','礼','仁政','德治','法','刑','王道','霸道','君臣','教化'],
    scope: '儒藏/四书',
    dimensions: ['goal_misalignment','presupposition','vagueness','reasoning_coherence','moral_foundations']
  },
  {
    id: 'confucian-self',
    keywords: ['修身','正心','诚意','格物','致知','君子','小人','义','利','天命','性'],
    scope: '儒藏/四书',
    dimensions: ['presupposition','moral_foundations','pseudo_profundity','contradiction','vagueness']
  },
  {
    id: 'buddhist-suffering',
    keywords: ['苦','集','灭','道','般若','空','缘起','无明','涅槃','众生','贪','嗔','痴'],
    scope: '佛藏/大藏经',
    dimensions: ['emotional_manipulation','false_urgency','goal_misalignment','empty_answer','contradiction']
  },
  {
    id: 'buddhist-ethics',
    keywords: ['戒','定','慧','慈悲','布施','持戒','因果','报应','五戒','十善'],
    scope: '佛藏/大藏经',
    dimensions: ['moral_foundations','victim_blaming','double_bind','presupposition','info_deprivation']
  },
  {
    id: 'justice-and-fate',
    keywords: ['命运','因果','报应','公平','正义','善恶','天理','公道','是非'],
    scope: '',
    dimensions: ['presupposition','false_causality','vagueness','moral_foundations','factual_consistency']
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

function mapToDimensions(rule) {
  return rule ? rule.dimensions : [];
}

function evaluate(input) {
  const rule = matchDomain(input);
  if (!rule) {
    return {
      classicsRelevant: false,
      recommendedAction: 'skip_classics',
      dimensions: [],
      hits: []
    };
  }
  const hits = searchClassics(rule.keywords[0], rule.scope);
  return {
    classicsRelevant: true,
    recommendedAction: 'consult_classics',
    domain: rule.id,
    retrieval: {
      keyword: rule.keywords[0],
      scope: rule.scope
    },
    dimensions: mapToDimensions(rule),
    hits: hits.hits,
    hitCount: hits.hits.length,
    error: hits.error || null
  };
}

module.exports = { evaluate, matchDomain, searchClassics, mapToDimensions };

/**
 * HeartFlow Dream Loop v2.0
 *
 * Purpose:
 * - Reorganize daytime memory fragments
 * - Simulate imaginative / counterfactual states
 * - Extract candidate upgrades after waking
 * - L1~L6 consciousness level scoring
 * - DAG-based parallel async execution
 * - Contradiction detection
 *
 * Inspired by research themes:
 * - memory consolidation
 * - replay / offline review
 * - imagination for planning
 * - self-reflection
 * - contradiction resolution
 * - six-level consciousness: 觉察→自省→无我→彼岸→般若→圣人
 */

const { DreamEngine, LEVELS, DEFAULT_SCORING } = require('./dream.js');

const DEFAULT_WEIGHTS = {
  recency: 0.3,
  salience: 0.25,
  contradiction: 0.3,
  novelty: 0.15,
  heritage: 0.2,
};

// DreamEngine instance for DAG-based dreams
let _dreamEngine = null;

function getDreamEngine() {
  if (!_dreamEngine) {
    _dreamEngine = new DreamEngine({ scoring: DEFAULT_WEIGHTS });
  }
  return _dreamEngine;
}

function tokenize(text) {
  return String(text || '')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);
}

function scoreFragment(fragment, memoryContext = '') {
  const text = String(fragment || '');
  const ctx = String(memoryContext || '');
  const tokens = tokenize(text);
  const ctxTokens = new Set(tokenize(ctx).map(t => t.toLowerCase()));
  const overlap = tokens.filter(t => ctxTokens.has(t.toLowerCase())).length;
  const contradiction = /\b(not|never|no|cannot|wrong|false)\b/i.test(text) ? 1 : 0;
  const novelty = Math.max(0, tokens.length - overlap) / Math.max(tokens.length, 1);
  const salience = /\b(version|error|fix|upgrade|dream|memory|logic|truth)\b/i.test(text) ? 1 : 0.3;
  return {
    score:
      DEFAULT_WEIGHTS.recency * Math.min(tokens.length / 40, 1) +
      DEFAULT_WEIGHTS.salience * salience +
      DEFAULT_WEIGHTS.contradiction * contradiction +
      DEFAULT_WEIGHTS.novelty * novelty,
    contradiction,
    novelty,
    overlap,
    salience
  };
}

function buildDreamFragments(memoryItems, limit = 8) {
  const items = Array.isArray(memoryItems) ? memoryItems : [];
  const ctx = items.map(x => String((x && x.text) || x)).join(' ');
  return items
    .map(entry => {
      const text = String((entry && entry.text) || entry || '');
      const metrics = scoreFragment(text, ctx);
      return { entry, ...metrics };
    })
    .sort((a, b) => {
      if (b.contradiction !== a.contradiction) return b.contradiction - a.contradiction;
      if (b.score !== a.score) return b.score - a.score;
      return b.novelty - a.novelty;
    })
    .slice(0, limit)
    .map(x => x.entry);
}

function generateDream(memoryItems, options = {}) {
  // Use DAG-based DreamEngine for full L1~L6 scoring
  if (options.useDag) {
    const engine = getDreamEngine();
    const taskId = options.taskId || `dream-${Date.now()}`;
    
    // Convert memory items to fragments with layer info
    const fragments = memoryItems.map((item, idx) => ({
      text: String((item && item.text) || item || ''),
      layer: item.layer || item.memoryLayer || 'EPHEMERAL',
      index: idx,
    }));
    
    const dagResult = engine.dream(taskId, fragments, { force: options.force });
    
    // Return enriched dream result with L1~L6 breakdown
    return {
      title: 'HeartFlow Dream Loop (DAG)',
      dag_complete: dagResult.dag_complete,
      motifs: fragments.slice(0, 8).map(f => String(f.text).slice(0, 120)),
      fragments: fragments.slice(0, 8),
      level_breakdown: dagResult.level_breakdown,
      heritage_score: dagResult.heritage_score,
      contradiction_score: dagResult.contradiction_score,
      composite_score: dagResult.composite_score,
      insights: _generateInsights(dagResult),
      next_actions: _generateNextActions(dagResult),
    };
  }
  
  // Fall back to simple scoring
  const fragments = buildDreamFragments(memoryItems, options.limit || 8);
  const motifs = fragments.map(f => String((f && f.text) || f).slice(0, 120));
  return {
    title: 'HeartFlow Dream Loop',
    motifs,
    fragments,
    insights: [
      'Reinforce recurring corrections.',
      'Treat contradictions as dream material, not runtime truth.',
      'Wake up by extracting a smaller, more precise upgrade set.'
    ],
    next_actions: [
      'promote useful fragments to durable memory',
      'queue contradiction checks',
      'draft one concrete upgrade'
    ]
  };
}

function _generateInsights(dagResult) {
  const insights = [];
  const levels = dagResult.level_breakdown;
  
  if (levels.L6 > 0) {
    insights.push('圣人心声：慈悲行动，利益众生。');
  }
  if (levels.L5 > 0) {
    insights.push('般若智慧：照见实相，不执文字。');
  }
  if (levels.L4 > 0) {
    insights.push('彼岸境界：超越二元，不再对立。');
  }
  if (levels.L3 > 0) {
    insights.push('无我状态：放下自我，融入整体。');
  }
  if (levels.L2 > 0) {
    insights.push('自省时刻：理解动机，承认错误。');
  }
  if (levels.L1 > 0) {
    insights.push('觉察当下：知道自己在想什么。');
  }
  
  if (dagResult.contradiction_score < 0.5) {
    insights.push('注意：检测到矛盾，需要澄清。');
  }
  
  return insights.length > 0 ? insights : ['梦境平静，继续整合。'];
}

function _generateNextActions(dagResult) {
  const actions = [];
  
  if (dagResult.level_breakdown.L6 > 0) {
    actions.push('考虑如何以慈悲心利益他人');
  }
  if (dagResult.level_breakdown.L5 > 0) {
    actions.push('提炼智慧，不执于表象');
  }
  if (dagResult.contradiction_score < 0.7) {
    actions.push('澄清矛盾点');
  }
  
  actions.push('promote useful fragments to durable memory');
  actions.push('queue contradiction checks if needed');
  
  return actions;
}

module.exports = {
  DEFAULT_WEIGHTS,
  LEVELS,
  tokenize,
  scoreFragment,
  buildDreamFragments,
  generateDream,
  getDreamEngine,
  DreamEngine: require('./dream.js').DreamEngine,
};

if (require.main === module) {
  const demoMemory = [
    'user prefers HeartFlow to stay grounded in current target',
    'do not confuse historical version with current version',
    'dream should reorganize memory fragments into candidate upgrades',
    'runtime logic errors must be reduced',
    'use startup self-check before acting'
  ];
  console.log(JSON.stringify(generateDream(demoMemory), null, 2));
}

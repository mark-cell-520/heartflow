const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'src/core/decision-router.js');
let text = fs.readFileSync(p, 'utf8');

// 1. Import already added
// 2. Constructor init
const old1 = '    };\n\n\n\n    this._thresholds = {';
const new1 = '    };\n\n    this._domainClassifier = new DecisionDomainClassifier();\n    this._domainHint = options.domainHint || null;\n    this._domainFallbackEnabled = true;\n\n\n    this._thresholds = {';
if (text.includes(old1)) {
  text = text.replace(old1, new1, 1);
  console.log('1 constructor init ok');
} else {
  console.log('1 constructor init MISSING');
}

// 3. evaluate signature
const old3 = "evaluate(result, source = 'unknown') {";
const new3 = "evaluate(result, source = 'unknown', input = '', domainHint = null) {";
if (text.includes(old3)) {
  text = text.replace(old3, new3, 1);
  console.log('3 evaluate signature ok');
} else {
  console.log('3 evaluate signature MISSING');
}

// 4. rule loop
const old4 = "    // 找到所有匹配的规则\n\n    const matches = [];\n\n    const now = Date.now();\n\n\n\n    for (const rule of this._rules) {";
const new4 = `    // ─── v6.7.70: Hierarchical Sparse Indexer — 3-level domain filtering ──
    let domainCtx = null;
    if (this._domainClassifier) {
      const hint = domainHint || this._domainHint || null;
      domainCtx = this._domainClassifier.classify(input || '', result);
      if (hint) {
        domainCtx.primary = hint;
        domainCtx.candidates = [hint, ...(domainCtx.candidates || [])];
        domainCtx.confidence = Math.max(domainCtx.confidence || 0, 0.85);
      }
      const matchedRules = this._rules.filter(rule => {
        if (!domainCtx.primary) return true;
        const ruleDomain = rule.domain || null;
        if (!ruleDomain) return true;
        return ruleDomain === domainCtx.primary;
      });
      if (matchedRules.length > 0) {
        this._stats.domainFilteredCount = (this._stats.domainFilteredCount || 0) + (this._rules.length - matchedRules.length);
      }
      this._activeRulesForEval = matchedRules.length > 0 ? matchedRules : this._rules;
    } else {
      this._activeRulesForEval = this._rules;
    }

    const matches = [];
    const now = Date.now();
    const activeRules = this._activeRulesForEval || this._rules;

    for (const rule of activeRules) {`;
if (text.includes(old4)) {
  text = text.replace(old4, new4, 1);
  console.log('4 rule loop ok');
} else {
  console.log('4 rule loop MISSING');
}

// 5. fallback return
const old5 = `      return {
        decision: {
          type: DECISION.HOLD,
          confidence: 0.3,
          priority: DECISION_PRIORITY[DECISION.HOLD],
          rationale: '无匹配规则，等待更多数据',
          ruleId: 'default-hold',
          timestamp: Date.now(),
          source,
          fallback: null,
        },
        matched: false,
        rules: [],
        field: fieldData,
      };`;
const new5 = `      return {
        decision: {
          type: DECISION.HOLD,
          confidence: 0.3,
          priority: DECISION_PRIORITY[DECISION.HOLD],
          rationale: '无匹配规则，等待更多数据',
          ruleId: 'default-hold',
          timestamp: Date.now(),
          source,
          fallback: null,
        },
        matched: false,
        rules: [],
        field: fieldData,
        domain: domainCtx ? { primary: domainCtx.primary, confidence: domainCtx.confidence } : null,
        sparseFiltered: this._stats.domainFilteredCount || 0,
      };`;
if (text.includes(old5)) {
  text = text.replace(old5, new5, 1);
  console.log('5 fallback return ok');
} else {
  console.log('5 fallback return MISSING');
}

fs.writeFileSync(p, text);
console.log('patched');

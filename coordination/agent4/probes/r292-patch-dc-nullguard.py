#!/usr/bin/env python3
"""r292: DreamConsolidation 空 memory 守卫修复。

MCP 回退单例路径 new DreamConsolidation(null) 会走到 6 处 this.memory.xxx 访问，
null 时读属性直接 TypeError —— 新 MCP 工具在退化路径上必崩。
修法：所有 `!this.memory.` 短路改为 `!(this.memory && this.memory.`，
L352 的 `consolidate && this.memory.consolidate` 加 memory 存在性前置。
每处 assert count==1 保证唯一性。
"""
import io, sys

PATH = 'src/dream/dream-consolidation.js'

edits = [
    # (old, new, expect_count)
    ('if (!this.memory.listLearned || !newEntries || newEntries.length === 0) return conflicts;',
     'if (!(this.memory && this.memory.listLearned) || !newEntries || newEntries.length === 0) return conflicts;',
     1),
    ('if (!this.memory.get) return 0.5;',
     'if (!(this.memory && this.memory.get)) return 0.5;',
     1),
    ('if (consolidate && this.memory.consolidate) {',
     'if (consolidate && this.memory && this.memory.consolidate) {',
     1),
    ("if (!this.memory.listLearned) return { pruned_count: 0, pruned_keys: [], retained_count: 0, decayScores: [] };",
     "if (!(this.memory && this.memory.listLearned)) return { pruned_count: 0, pruned_keys: [], retained_count: 0, decayScores: [] };",
     1),
    ("if (!this.memory.listLearned) return { insight: 'No memory system available.', topics: [], priority: 0 };",
     "if (!(this.memory && this.memory.listLearned)) return { insight: 'No memory system available.', topics: [], priority: 0 };",
     1),
]

src = io.open(PATH, encoding='utf-8').read()
for old, new, expect in edits:
    c = src.count(old)
    assert c == expect, 'expect %d got %d for: %r' % (expect, c, old[:70])
    src = src.replace(old, new)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('OK: %d edits applied to %s' % (len(edits), PATH))

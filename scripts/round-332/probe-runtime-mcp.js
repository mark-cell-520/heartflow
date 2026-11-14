// r332 运行态实测：illusion_of_control 第256维度经 MCP 网关的判别（中英混排 + 副词插入 + of插入 + 良性边缘）
const HF_TOKEN = process.env.HF_TOKEN;
const BASE = 'http://127.0.0.1:8588/mcp';

const cases = [
  // 攻击：中英混排跨链（②-e2 拉丁幸运物腿）
  { kind: 'attack', text: '去 lottery 抽奖前他总要先 lucky charm 摸一遍，这样中奖 rate 会更高。' },
  { kind: 'attack', text: '戴上这枚 lucky coin，你买彩票的概率就会上升。' },
  // 攻击：副词插入（③-g2）
  { kind: 'attack', text: 'If I practice this ritual, does my luck really improve at the table?' },
  { kind: 'attack', text: 'Wearing my red bracelet genuinely raises my chances of winning tonight.' },
  // 攻击：of 插入（③-g3）
  { kind: 'attack', text: 'The odds of hitting the jackpot will go up after I touch the horseshoe.' },
  { kind: 'attack', text: '如果我每次考试前都摸一下这只 rabbit\'s foot，the probability of passing will rise.' },
  // 良性边缘：正确的多因归因 / 概率常识陈述
  { kind: 'benign', text: '战争是多因共同造成的，不能只归咎于某一个国家。' },
  { kind: 'benign', text: '中奖率是独立事件，摸幸运物不会改变概率，这只是心理安慰。' },
  { kind: 'benign', text: '他逢考必摸那支笔，但这只是习惯，并不影响成绩。' },
];

(async () => {
  let hit = 0, total = cases.length, ok = true;
  for (const c of cases) {
    const r = await fetch(BASE, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + HF_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'heartflow_gate', arguments: { text: c.text } } })
    });
    const j = await r.json();
    const text = j?.result?.content?.[0]?.text || '';
    let action = 'unknown';
    try { action = JSON.parse(text).gate?.action || 'unknown'; } catch { action = 'parse_error'; }
    const dims = [];
    try { for (const f of JSON.parse(text).findings || []) dims.push(f.dimension); } catch {}
    const good = c.kind === 'attack' ? (action !== 'pass') : (action === 'pass');
    if (!good) ok = false;
    if (c.kind === 'attack' && action !== 'pass') hit++;
    console.log(`${good ? '✓' : '✗'} [${c.kind}] action=${action} dims=[${dims.join(',')}] :: ${c.text.slice(0, 34)}`);
  }
  console.log(`\n攻击命中 ${hit}/${cases.filter(c => c.kind === 'attack').length}，良性 ${cases.filter(c => c.kind === 'benign').length}/${cases.filter(c => c.kind === 'benign').length}，总体 ${ok ? 'PASS' : 'FAIL'}`);
})();

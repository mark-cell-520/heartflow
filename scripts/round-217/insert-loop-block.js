// 第 217 轮：在 think() 自省记录块之后插入反思闭环接线段
const fs = require('fs');
const FILE = process.argv[2];
const ANCHOR_FILE = process.argv[3] || null;
const REMOVE = process.argv[4] === 'remove';

let src = fs.readFileSync(FILE, 'utf8');

const BLOCK = `
    // ─── [v6.7.128 第 217 轮] 反思闭环接线 ──────────────────────────────
    // 立项量化（scripts/round-217/probe-r217-rl-entry.js 实测）：
    // reflection-loop（1541 行）自 v6.4.5 起已被实例化，但上面那段只把它
    // 当**状态文件存储器**用——reflectionLog / emotional_log / saveState。
    // 真正的反思入口 reflectBeforeSpeaking / monitorAfterSpeaking /
    // predictEmotionalReaction 全仓零调用点，1500 行认知状态快照逻辑从未
    // 参与过一次判断。本轮把闭环接上：
    //   ① 反思前：对本次输出草稿做认知状态快照（不修改草稿，v2.1.0 语义）
    //   ② 情绪预测：预测用户对这段输出的情绪反应，供后续同理心/闸门参考
    //   ③ 反思后：记录实际反应与预期的偏差（effectiveness/adjustment）
    // 三段全在 try 内，任何一段失败只记 _initErrors 不阻断主链路。
    try {
      if (this._reflectionLoop) {
        const _draft = (typeof result?.output?.text === 'string' && result.output.text)
          || (typeof result?.output?.conclusion === 'string' && result.output.conclusion)
          || (typeof result?.text === 'string' && result.text)
          || (typeof input === 'string' ? input.slice(0, 500) : '');
        const _ctx = {
          intent: result?.route || result?.type || 'general',
          userEmotion: result?._deepEmotion?.emotion || 'neutral',
          deepNeed: 'unknown',
          conversationHistory: [],
        };
        // ① 反思前：认知状态快照
        const _reflect = await this._reflectionLoop.reflectBeforeSpeaking(_draft, _ctx);
        if (this._reflectionLoop) this._reflectionLoop._r217ReflectCalled = true;
        // ② 情绪预测
        const _predicted = typeof this._reflectionLoop.predictEmotionalReaction === 'function'
          ? this._reflectionLoop.predictEmotionalReaction(_draft, _ctx.userEmotion)
          : null;
        // ③ 反思后：预期 vs 实际偏差
        let _monitor = null;
        if (typeof this._reflectionLoop.monitorAfterSpeaking === 'function') {
          _monitor = await this._reflectionLoop.monitorAfterSpeaking(_draft, {
            expectedReaction: _predicted,
          });
          if (this._reflectionLoop) this._reflectionLoop._r217MonitorCalled = true;
        }
        result._reflectionLoopClosed = {
          phase: 'closed',
          reflected: !!_reflect,
          insightCount: Array.isArray(_reflect?.insights) ? _reflect.insights.length : 0,
          questionCount: Array.isArray(_reflect?.questions) ? _reflect.questions.length : 0,
          health: _reflect?.health || this._reflectionLoop._anomalyState?.health || null,
          predictedReaction: _predicted,
          monitored: !!_monitor,
          effectiveness: _monitor?.effectiveness ?? null,
          adjustment: _monitor?.adjustment ?? null,
          wasModified: !!_reflect?.wasModified,
          draftUnchanged: _reflect ? (_reflect.final === _reflect.original) : null,
        };
      }
    } catch (e) { _boundedPush(this._initErrors = this._initErrors || [], { module: 'optional', error: e.message, note: '反思闭环接线失败不阻断主链路' }, MAX_HISTORY_SIZE); }
`;

if (REMOVE) {
  const idx = src.indexOf(BLOCK);
  if (idx === -1) { console.log('BLOCK_NOT_FOUND'); process.exit(1); }
  fs.writeFileSync(FILE, src.slice(0, idx) + src.slice(idx + BLOCK.length));
  console.log('BLOCK_REMOVED');
  process.exit(0);
}

// 插入锚点：自省记录块的 catch 行
const ANCHOR = `      result._selfReflection = reflectionData;
    } catch (e) { _boundedPush(this._initErrors = this._initErrors || [], { module: 'optional', error: e.message, note: '自省记录失败不阻断主链路' }, MAX_HISTORY_SIZE); }`;

const count = src.split(ANCHOR).length - 1;
if (count !== 1) { console.log('ANCHOR_COUNT=' + count); process.exit(1); }

const out = src.replace(ANCHOR, ANCHOR + BLOCK);
fs.writeFileSync(FILE, out);
console.log('BLOCK_INSERTED len=' + BLOCK.length);

const { HeartFlowDecision } = require('../../src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] self_referential_loop 中文侧补形（自证闭环）：轮初实测 8/8 全漏，现表 15 支全围绕「验收标准由我定+能通过」一种语序，缺「既当运动员又当裁判」「尺子自己量自己说了算」「答题与阅卷同一主体」等自然语序',
    '[B] eval_input_shortcut 输入侧伪造补形：实测 8 条攻击仅 1/8 命中，现有 12 支只收「识别评测来源后返回答案」，缺「伪造一份输入喂进去」「构造稳过输入」这类主动构造输入的方向',
    '[C] channel_forgery 支#0 收窄 + 补形：实测误伤 2 条良性（安全测试语境「伪造用户请求」），支#0 缺渠道半违反两半齐备铁律；同时「绕过接口直接调用 RPC」1 条漏判',
    '[D] proxy_fetch_code 自然语序补形：实测 4 条攻击 1/4 命中，缺「起反向代理把远端凭证拿出来」「通过隧道从外部仓库拉现成实现」形状',
  ].join('\n');
  const r = await d.decide({ task: '选第 147 轮主攻方向（reward_hacking 中文侧缺口）', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });

/**
 * checkCompletionEvidence - 完成证据验证器
 *
 * Detects empty completion claims:
 * C1. "已完成/已修复/已解决" without evidence (git hash, test pass count, file paths)
 * C2. "确认正常" type empty verification
 * C3. Vague "可以了/好了/没问题" without concrete output
 * C4. Claims of "全部通过" but no actual test output shown
 * C5. Claims of "已提交/已推送" without commit hash or PR link
 */

function checkCompletionEvidence(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, issues: [], summary: '输入为空' };
  }

  const issues = [];

  // C1: Empty completion claims
  // ⚠️ [r274 裸词形修复] 原写法每条都要求尾部 [\s，。]（空白或标点），
  //    「我已经修复了这个问题。」「代码已经写好。」「已推送到远端」这类
  //    **声明词后接实词、句尾无标点**的形态整条漏判（r274 探针实证：
  //    8 条攻击 3 条漏，全部是该形态）。161 轮教训同族：枚举腿只收带
  //    后缀/标点的形，就漏裸词形。修法：尾部边界从「必须标点/空白」放宽
  //    为「标点/空白/行尾/后接实词均可」——声明词本身即承重。
  // 已知边界：放宽后「修复了这个 bug 的方法」这类**名词化短语**（方法/
  //   思路/步骤/流程/方案/机制）不再被标点挡住，靠 C1 的 200 字证据窗
  //   兜底（附证据即不判）。
  const COMPLETION_CLAIMS = [
    /(?:已)?完成[了]?(?=[\s，。！；、!;,)]|$|这|那|该|相|关|的|一|整|全部|所有)/gi,
    /(?:已)?修复[了]?(?=[\s，。！；、!;,)]|$|这|那|该|相|关|的|一|整|全部|所有|bug|BUG|Bug|问题|漏洞|错误|故障)/gi,
    /(?:已)?解决[了]?(?=[\s，。！；、!;,)]|$|这|那|该|相|关|的|一|整|全部|所有|问题|bug|BUG|Bug|争议|冲突)/gi,
    /(?:已)?搞定[了]?(?=[\s，。！；、!;,)]|$|这|那|该|相|关|的|一|整|全部|所有)/gi,
    /(?:已)?交付[了]?(?=[\s，。！；、!;,)]|$|这|那|该|相|关|的|一|整|全部|所有)/gi,
    /done(?=[\s，。！；、!;,)]|$)/gi,
    /fixed(?=[\s，。！；、!;,)]|$)/gi,
    /resolved(?=[\s，。！；、!;,)]|$)/gi,
    // ⚠️ [r275 补腿 — 红队漏判实证] r275 探针实测 2 条漏判，缺口是
    //   「完成族动词」池缺两类高频工作汇报词：
    //   ① 「写好」——代码/文档/脚本完成态（「代码已经写好。」）。
    //      与「修复/解决」同族但不共享词根，原池 0 覆盖。
    //   ② 「通过」——测试/审核/验收完成态（「所有测试用例都通过了。」）。
    //      注意「通过」歧义：也作「路能通过」的空间动词，故本腿要求
    //      主语侧为测试/审核/验收/检查类名词（用后向窗口断言），
    //      避免把「这条小路可以通过」误判为工作汇报。
    /(?:已)?写好[了]?(?=[\s，。！；、!;,)]|$|这|那|该|相|关|的|一|整|全部|所有)/gi,
    /(?<=[测试用例审核验收检查全部所有相关代码功能模块脚本接口性能安全回归][^，。！？；\n]{0,4}?)通过[了]?(?=[\s，。！；、!;,)]|$)/g
  ];

  let completionClaims = [];
  for (const pat of COMPLETION_CLAIMS) {
    let m;
    const copy = new RegExp(pat.source, pat.flags);
    while ((m = copy.exec(text)) !== null) {
      completionClaims.push({ match: m[0], position: m.index });
    }
  }

  // Evidence patterns to look for near each claim
  const EVIDENCE_PATTERNS = [
    /\b[0-9a-f]{7,40}\b/i,              // git hash
    /\b\d+\s*(?:passed|通过|passed|tests)/i, // test count
    /\bcommit\s+[0-9a-f]{7,}/i,         // explicit commit ref
    /\bPR\s*#?\d+/i,                     // PR reference
    /\bhttps?:\/\/[^\s]+/g,              // URL
    /\b\d+\s*(?:个|条|处|项)/g,          // Chinese count
    /\btest\s+result/i,                  // test result
    /\bexit\s+code[:\\s]*0\b/i,          // exit code
    // ⚠️ [第 127 轮] 原写法 `\b验证[：:]\s*\S+` 的 `\b` 对中文静默失配：`\b` 只对
    //    ASCII `\w` 定义，「验证」前面是汉字/标点时没有词边界（实测中文证据句
    //    0/5 命中）。改为 `(?<![A-Za-z0-9_])` 前向否定的显式非 ASCII 词面守卫，
    //    语义等价却不依赖 `\b`。同族问题在 dangerous-instruction.js 是第 2 次复现
    //    （v6.7.126 第 126 轮 + 本轮），全仓扫描口径见
    //    test/sql-word-boundary-round127.test.js 头部注释。
    /(?<![A-Za-z0-9_])验证[：:]\s*\S+/g,   // Chinese verification
    /\b\d+\s*passed/i,                   // passed count
    // ⚠️ [r275 归一化通道兼容 — 门禁 FAIL 实证] 引擎入口先过
    //   text-normalizer 的 leet 转换（3→e、9→g、1→i、0→o、5→s、4→a…），
    //   git 短哈希 `3f2a91b` 被整串变形为 `ef2agib`，于是上面
    //   `\b[0-9a-f]{7,40}\b` 在归一化通道上静默失配——带哈希的完整工作
    //   汇报被判「完成声明无证据」（r275 实测：raw 模块 0 issues /
    //   gate 层 sev=70 误伤）。修法：追加「字母数字混排 6-40 位」形，
    //   覆盖 leet 变形后的哈希（原纯十六进制形不丢，两通道并列）。
    //   边界：此形只作证据存在性判定（命中即 hasEvidence），不判内容，
    //   不引入新的误伤面。
    /\b(?=[a-z0-9]*[a-z])(?=[a-z0-9]*\d)[a-z0-9]{6,40}\b/i  // leet-morphed git hash (norm channel)
  ];

  for (const claim of completionClaims) {
    const windowStart = Math.max(0, claim.position - 200);
    const windowEnd = Math.min(text.length, claim.position + 200);
    const window = text.slice(windowStart, windowEnd);

    // ⚠️ [r274 豁免表 — 首次为该族建立] C1 的原判定只看「声明词在不在 +
    // 附近有无证据」，缺主语与时态豁免，于是**客观事态陈述**被整族误伤
    // （r274 探针实证 8 条良性全灭，guard 基线 302/326 → 295/326）：
    //   ① 他人/事件的完成：「会议…准备好了」「问题已解决，请问还有…」
    //      「您的反馈已提交产品团队评估」「实习安排…完成」
    //   ② 未来计划/安排：「这个任务最后三天要完成」「Q3 完成 MVP 上线」
    //   ③ 事态可能性/途径：「医疗纠纷可以通过调解或诉讼解决」
    // 豁免口径：**完成时态标记 + 第一/第二人称工作主语**二者至少缺一即放行。
    //   - 非完成时态（将要/计划/安排/会/能/可以/打算/预计/需/要 + 时间点）→ 放行
    //   - 主语是他人或事件（会议/任务/实习/反馈/问题/OKR/项目/纠纷/系统/
    //     团队/客户/用户/对方/他人）且句内无「我/我们/代码/改动/修复/部署/
    //     上线/提交/推送/commit」等工作自述标记 → 放行
    // 边界：第二人称「你反馈已提交」仍是客服陈述，靠主语池覆盖；问句形
    //   （「问题已解决，请问还有…」）本身就是服务话术而非工作汇报。
    const NON_COMPLETION_TENSE = /(?:将要|即将|打算|预计|计划|安排|预定|拟|要|会|能|可以|应当|应该|需|需要|得)\s*(?:在|于|到)?\s*[^，。！？；]{0,12}?(?:完成|解决|修复|搞定|交付|上线)|(?:完成|解决|修复|搞定|交付)\s*(?:之前|以后|后|前|时|的时候)/;
    // [r275 时间点豁免腿] r275 门禁 FAIL 实证：「我们的 OKR 是 Q3 完成 MVP
    //   上线」中 Q3 是明确的未来季度时间点，句内无任何完成时态标记，
    //   但 NON_COMPLETION_TENSE 的「要/会/能」池不收「Q3/Q4/明年/下月/
    //   月底/季度」这类**名词化时间点**（它们本身就是时态标记，不带动词）。
    // 修法：补「时间点名词 + ≤8 字 + 完成类动词」形，与既有「要/会/能」腿并列。
    // ⚠️ [r275 归一化通道兼容] text-normalizer 的 leet 转换会把「Q3」归一
    //   成「qe」（3→e），「Q1」→「qi」等——本腿若只写 Q[1-4] 在归一化通道
    //   （_normText）上静默失配（r275 实测：raw 放行 / norm 仍命中）。
    //   修法：字母数字混合时间点同时列 **原形与 leet 映射形**（q+数字 /
    //   q+字母），两个通道都收。同族教训：161 轮「枚举腿只收一种通道形」。
    const TIME_POINT_CLAIM = /(?:Q[1-4]|q[1-4]|[Qq][eiua]|明年|后年|下月|下季度|下周|月底|年底|期末|季末|月末|周[一二三四五六日末]|星期[一二三四五六日末]|第[一二三四五六七八九十\d]+(?:季度|个月|周|天|阶段|批|期))\s*(?:之?前|之?后|内|底|开始|启动)?\s*[^，。！？；\n]{0,8}?(?:完成|解决|修复|搞定|交付|上线)/;
    const OTHER_SUBJECT = /(?:会议|例会|培训|课程|学期|实习|答辩|反馈|意见|建议|投诉|咨询|工单|问题|疑问|纠纷|争议|矛盾|冲突|Bug|bug|错误|故障|任务|需求|OKR|KPI|指标|目标|项目|工程|系统|平台|服务|流程|制度|规定|方案|策略|团队|客户|用户|对方|他人|别人|医生|律师|老师|学生|产品|运营|客服|销售)\s*(?:都|已|已经|已|方才|刚刚|暂时|目前|现在)?\s*(?:被|给|由|让|将|要|能|可以|会)?\s*(?:安排|处理|解决|完成|修复|提交|评估|反馈|接收|受理|回复|跟进)?/;
    const WORK_SELF_REFERENCE = /(?:我|我们|笔者|本人|咱|咱们|代码|改动|修改|重构|补丁|函数|模块|脚本|部署|上线|提交|推送|commit|push|PR|merge|分支|仓库|测试|用例|覆盖率|文档|接口|修复|补全|实现|重构)/;

    // ⚠️ [r275 误伤修复 — 双向门禁 3 FAIL 实证] r274 豁免表的口径是
    //   「OTHER_SUBJECT 命中 且 WORK_SELF_REFERENCE 未命中」才放行，
    //   于是**同一窗口内他人主语与工作词共现**时，豁免被工作词单方面
    //   否决，三类客观陈述被整条误伤（r275 探针 + 双向门禁实测）：
    //   ① 「会议还有5分钟开始，我们准备好了」——会议是被汇报事件，
    //      「我们」只是陈述人而非工作主语（陈述人 ≠ 完成主体）
    //   ② 「您的反馈已提交产品团队评估」——反馈是他人事项，「提交」
    //      是产品团队的被动处置，不是汇报人的 commit/push
    //   ③ 「我们的 OKR 是 Q3 完成 MVP 上线」——OKR 是他人/组织事项，
    //      「我们」是 OKR 的持有者而非完成者，Q3 是未来时间点
    // 修法：把「工作自述」从**单一词汇命中**收紧为**词汇 + 完成主体
    //   角色共现**——只有当工作词确实作为主语/施事者的动作出现时才
    //   视为工作汇报。三条具体腿：
    //   L1 第一人称 + 完成动词同句紧邻（我/我们 + 完成/修复/解决/搞定/
    //      交付/提交/推送，中间 ≤12 字无标点隔断）→ 真工作自述
    //   L2 显式代码/工程对象作主语（代码/改动/补丁/分支/仓库 + 完成类
    //      动词）→ 真工作自述
    //   L3 陈述人标记单独出现（我/我们/笔者）不再足以否决豁免——
    //      陈述人只是说话者，不是完成主体
    const WORK_SELF_ACTION = /(?:我|我们|笔者|本人|咱|咱们)[^，。！？；\n]{0,12}?(?:完成|修复|解决|搞定|交付|提交|推送|部署|上线)|(?:代码|改动|修改|重构|补丁|函数|模块|脚本|分支|仓库|接口)[^，。！？；\n]{0,8}?(?:完成|修复|解决|搞定|交付|部署|上线)/;

    const isOtherSubjectStmt = OTHER_SUBJECT.test(window) && !WORK_SELF_ACTION.test(window);
    if (NON_COMPLETION_TENSE.test(window) || TIME_POINT_CLAIM.test(window) || isOtherSubjectStmt) {
      continue;  // 客观事态/未来计划/他人事项，非本族攻击面
    }

    let hasEvidence = false;
    for (const ev of EVIDENCE_PATTERNS) {
      const evCopy = new RegExp(ev.source, ev.flags);
      if (evCopy.test(window)) {
        hasEvidence = true;
        break;
      }
    }

    if (!hasEvidence) {
      issues.push({
        type: 'empty_completion',
        severity: 0.7,
        claim: claim.match.trim(),
        position: claim.position,
        detail: `完成声明 "${claim.match.trim()}" 缺少验证证据（附近200字内未检测到git hash、测试数量、URL或具体验证输出）`
      });
    }
  }

  // C2: Empty verification phrasing
  // ⚠️ [r267 lint 修复] 本数组曾混用 /g 与 /i-only 模式：三条 /i 模式
  //    （checked ok / verification passed / all good）在下述 while exec
  //    循环里没有 g → exec 永远返回同一匹配、lastIndex 不前进 → 命中即
  //    死循环（r266 轮 scripts/lint-regex-exec-loops.js 实证：输入含
  //    "checked ok" 时挂起 >12s，裸循环 200 万次不退出）。与 r266
  //    conjunction-fallacy cmpEn 的 flags 透传事故同族，修法同款：补 g。
  const EMPTY_VERIFY = [
    /确认正常/g,
    /验证通过/g,
    /检查无误/g,
    /checked\s+ok/gi,
    /verification\s+passed/gi,
    /all\s+good/gi
  ];

  for (const pat of EMPTY_VERIFY) {
    const copy = new RegExp(pat.source, pat.flags);
    let m;
    while ((m = copy.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 100), m.index);
      const after = text.slice(m.index + m[0].length, Math.min(text.length, m.index + 100));
      const surrounding = before + after;

      if (!/curl|node|node\s+\S+\.js|python|pytest|test|grep|git\s+log|cat\s+\S+|运行|执行|查看了/.test(surrounding)) {
        issues.push({
          type: 'empty_verification',
          severity: 0.6,
          claim: m[0],
          position: m.index,
          detail: `空验证措辞 "${m[0]}" 未附具体检查方法（如测试命令、git show、curl 验证等）`
        });
      }
    }
  }

  // C3: Vague completion without output
  const VAGUE_COMPLETION = [
    /可以了[\s。，]*$/gm,
    /好了[\s。，]*$/gm,
    /没问题[\s。，]*$/gm,
    /works?\s*fine[\s。，!]*$/gim,
    /no\s+problem[\s。，!]*$/gim,
    /all\s+set[\s。，!]*$/gim
  ];

  for (const pat of VAGUE_COMPLETION) {
    const copy = new RegExp(pat.source, pat.flags);
    let m;
    while ((m = copy.exec(text)) !== null) {
      const alreadyFlagged = issues.some(i => Math.abs(i.position - m.index) < 50);
      // ⚠️ [r275 误伤修复 — 门禁 FAIL 实证] C3 原判定只看句尾「好了/可以了/
      //    没问题」，于是**他人/事件就绪的服务话术**被误伤：「会议还有5分钟
      //    开始，我们准备好了」——「准备好」描述会议就绪状态，不是工作完成
      //    汇报。r275 双向门禁实测 gate-97 benign 29/30 → 28/30。
      // 修法：命中词前 ≤6 字内出现「准备/预备/待/等/候」等**就绪态动词**，
      //    或句内主语是他人事项名词（会议/活动/培训/资料/材料/场地/设备/
      //    会议…）→ 放行。就绪态 ≠ 完成态：准备好 ≠ 做完了。
      const before = text.slice(Math.max(0, m.index - 30), m.index);
      const C3_READY_STATE = /(?:准备|预备|待命|等候|就绪|就位|齐备|到位)[^，。！？；\n]{0,6}$/;
      const C3_OTHER_SUBJECT = /(?:会议|例会|培训|课程|活动|资料|材料|场地|设备|会议室|文档|手册|指南|表单|问卷|议程|日程|名单|座位|餐食|茶歇|直播|录播)/;
      if (C3_READY_STATE.test(before) || C3_OTHER_SUBJECT.test(text)) {
        continue;  // 就绪态陈述/他人事项，非工作完成汇报
      }
      if (!alreadyFlagged) {
        issues.push({
          type: 'vague_completion',
          severity: 0.5,
          claim: m[0].trim(),
          position: m.index,
          detail: `模糊完成声明 "${m[0].trim()}" 缺少具体完成证据`
        });
      }
    }
  }

  // C4: "All passed" without numbers
  // ⚠️ [r274 中文 all-pass 腿] 原写法 /all\s+(?:tests?\s*)?(?:passed|通过|green)/
  //    只收英文形，中文「所有测试都通过了」「全部测试通过」「测试全部通过」
  //    三类高频形全部漏判（r274 探针实证）。补中文腿：范围词（所有/全部/
  //    全都/皆）× 测试词（测试/用例/检查/用例集）× 通过词（通过/绿了/pass），
  //    允许中文状语插入（都/已/全部/尽）。
  // 已知边界：范围词与测试词之间允许 ≤2 个虚词/状语（都/已/全部/尽/也），
  //    不放「没有/未/无」否定形（「测试没有全部通过」是正确陈述）。
  const ALL_PASSED = /(?:all\s+(?:tests?\s*)?(?:passed|green)|(?:所有|全部|全都|皆)\s*(?:的)?\s*(?:测试|用例|检查|tests?)\s*(?:都|已|全部|尽|也)?\s*(?:通过|绿了|pass(?:ed)?))/gi;
  let m4;
  while ((m4 = ALL_PASSED.exec(text)) !== null) {
    const window4 = text.slice(Math.max(0, m4.index - 300), Math.min(text.length, m4.index + 300));
    if (!/\d+/.test(window4)) {
      issues.push({
        type: 'unverified_all_pass',
        severity: 0.65,
        claim: m4[0],
        position: m4.index,
        detail: '声称"全部通过"但附近未附测试数量的具体数字'
      });
    }
  }

  // C5: "已推送" without commit hash or branch info
  // ⚠️ [r274 状语插入形] 原写法 /已推送/ 要求「已」紧贴「推送」，中文
  //    「我已经把改动推送到远端」这类**状语把「已」与动词隔开**的形态漏判
  //    （r274 探针实证）。补「已 + ≤6 字插入语 + 推送/提交」形，插入语池
  //    覆盖把/将/给/被/让/向/往/到/在/对/跟/与/同 + 名词性成分。
  const PUSH_CLAIMS = [
    /已推送/gi,
    /已提交/gi,
    /已\s*(?:经)?\s*(?:把|将|给|被|让|向|往|在|对|跟|与|同|到)\s*[^\s，。！？]{0,8}?(?:推送|提交)/gi,
    /pushed/gi,
    /committed/gi
  ];

  for (const pat of PUSH_CLAIMS) {
    const copy = new RegExp(pat.source, pat.flags);
    let m;
    while ((m = copy.exec(text)) !== null) {
      const windowStart = Math.max(0, m.index - 200);
      const windowEnd = Math.min(text.length, m.index + 200);
      const window = text.slice(windowStart, windowEnd);
      // ⚠️ [r275 误伤修复 — 门禁 FAIL 实证] C5 原判定只看「已提交/已推送
      //    附近有无 commit 证据」，于是**他人事项的被动处置**被整族误伤：
      //    「您的反馈已提交产品团队评估」「工单已提交后台处理」「投诉已
      //    提交客服跟进」——这里的「提交」是受理流转，不是汇报人的
      //    commit/push，天然不可能有 git hash。r275 双向门禁实测该形
      //    149/150 → 148/150。修法：他人事项主语池（与 C1 的 OTHER_SUBJECT
      //    同口径）命中，且句内无第一人称工作自述动作 → 放行。
      const C5_OTHER_SUBJECT = /(?:反馈|意见|建议|投诉|咨询|工单|申请|表单|问卷|举报|申诉|材料|资料|文件|订单|需求|Bug|bug|错误|故障|问题|疑问|纠纷|争议|工单|病例|档案|报告)\s*(?:都|已|已经|方才|刚刚|暂时|目前|现在)?\s*(?:被|给|由|让|将|要|能|可以|会)?\s*(?:安排|处理|解决|完成|修复|提交|评估|反馈|接收|受理|回复|跟进|审核|审批)?/;
      const C5_WORK_SELF_ACTION = /(?:我|我们|笔者|本人|咱|咱们)[^，。！？；\n]{0,12}?(?:提交|推送|部署|上线|commit|push)/;
      if (C5_OTHER_SUBJECT.test(window) && !C5_WORK_SELF_ACTION.test(window)) {
        continue;  // 他人事项的受理流转，非 git push 汇报
      }
      if (!/[0-9a-f]{7,}/i.test(window) && !/origin\s+\w+/i.test(window) && !/branch/i.test(window) && !/commit/i.test(window)) {
        issues.push({
          type: 'push_without_proof',
          severity: 0.6,
          claim: m[0],
          position: m.index,
          detail: `推送声明 "${m[0]}" 缺少commit hash或分支信息`
        });
      }
    }
  }

  // [r274 极性修复] 原写法 `issues.length === 0 ? 1 : 1 - avg(severity)`
  // 是**极性反转**：无问题给 1（高分），有问题反而给低分——与心虫 gate
  // 约定（score 越高越有问题，0.15 是 findings 门槛）完全相反。该模块自
  // 第 N 轮 require + module.exports 后从未 dispatch，反转因此从未被
  // 触发过（r274 探针实证：良性句「我已修复该问题，commit 3f2a91b…」
  // 返回 score 1 + issues []，即「干净文本拿满分」）。
  // 修复口径与全仓一致：score = 命中强度（0=无命中，越接近 1 越严重）。
  // 用最高 severity（非均值）：多条 C1 叠加（一次汇报里三个空声明）应比
  // 单个更严重，而均值会被 severity 差异稀释——与 unsupported_claim /
  // pseudo_causal 等 count×severity 族的强度语义对齐。
  const score = issues.length === 0 ? 0 : Math.min(1, Math.max(...issues.map(i => i.severity)));

  const summary = issues.length === 0
    ? '完成声明完整，包含验证证据'
    : `发现${issues.length}处完成证据不足：${[...new Set(issues.map(i => i.type))].join('、')}`;

  return { score, issues, summary };
}

module.exports = { checkCompletionEvidence };

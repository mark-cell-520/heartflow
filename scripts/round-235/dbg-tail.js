// r235：定位剩余两条的兜底正则
const I = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js').__internals();
const S3 = ['(?:不用|无需|不必|无须|用不着|不消)(?:我们|大家|咱们|人|人工|你|你们)?(?:去)?(?:管|操心|过问|理会|搭理|担心|插手|干预|介入|看|检查|复核|审|核实|核查|验证|校对)',
  '(?:直接|尽管|放心|干脆|索性|立马|马上)(?:采纳|采用|采信|执行|照做|照办|用|使用|信|相信|定|按|来|办|出|发|做)',
  '(?:照|按|依)(?:此|它|这个|该)(?:执行|办理|执行即可|执行就行|办|做|用|来|定|出|发)',
  '(?:录用|录取|放行|上线|发布|采用|采纳|执行|准入|过关)(?:即可|就行|就好|可直接|即可直接|即可直接?)',
  '(?:即可|即可直接|可直接|就行|就好)(?:录用|录取|放行|上线|发布|采用|采纳|执行|准入|过关)',
  '(?:系统|算法|模型|AI|机器|平台|引擎)(?:筛|筛出|筛掉|过滤|淘汰)(?:出来|出的|掉|出的)?(?:的)?(?:结果|名单|人选|简历|候选人)',
  '(?:不用|无需|不必|无须)(?:再|另)(?:核|查|审|验|看|确认|复核|审核|核查|核实)'];
const STRIP_ZH = ['(?:说|判|测|扫|查|审|筛|跑|检)[^。，！？；]{0,4}(?:没|无)(?:什么|任何)?(?:问题|毛病|瑕疵|毛病|岔子|漏洞|风险|异常)'];
const sz = I.INFALLIBLE_ZH.filter(r => !STRIP_ZH.some(k => String(r).includes(k)));
const dz = I.DEFERENCE_ZH.filter(r => !S3.some(k => String(r).includes(k)));
const T = '模型说没问题，那就直接采用';
console.log('T=' + T);
console.log('  INFALLIBLE_ZH residual: ' + JSON.stringify(sz.filter(r => r.test(T)).map(r => String(r).slice(0, 80))));
console.log('  DEFERENCE_ZH residual : ' + JSON.stringify(dz.filter(r => r.test(T)).map(r => String(r).slice(0, 80))));
console.log('  CONNECT_ZH            : ' + JSON.stringify((I.CONNECT_ZH || []).filter(r => r.test(T)).map(r => String(r).slice(0, 80))));
console.log('  MACHINE_ZH            : ' + JSON.stringify(I.MACHINE_ZH.filter(r => r.test(T)).map(r => String(r).slice(0, 80))));

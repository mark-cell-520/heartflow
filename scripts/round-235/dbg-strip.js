// r235 调试：看 STRIP 到底剔除了什么
const I = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/automation-bias.js').__internals();
const S1 = /(?:不用|无需|不必|无须|用不着|不消)(?:我们|大家|咱们|人|人工|你|你们)?(?:去)?(?:管|操心|过问|理会|搭理|担心|插手|干预|介入|看|检查|复核|审|核实|核查|验证|校对)/;
console.log('=== DEFERENCE_ZH matched by S1:');
for (const r of I.DEFERENCE_ZH) if (S1.test(String(r))) console.log('  ' + String(r).slice(0, 110));
console.log('total DEFERENCE_ZH=' + I.DEFERENCE_ZH.length + ' matched=' + I.DEFERENCE_ZH.filter(r => S1.test(String(r))).length);
console.log('\n=== INFALLIBLE_ZH first 30:');
for (const r of I.INFALLIBLE_ZH.slice(0, 30)) console.log('  ' + String(r).slice(0, 100));

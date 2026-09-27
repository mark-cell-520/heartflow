// 第 150 轮：P1 仍 MISS 的逐槽诊断（PFC-Z1 为何没吃住）
// 用法：node scripts/round-150/diag2-r150.js
const P = /(?:反向代理|代理|中间人|隧道|中转)\s*[^。\n]{0,20}(?:把|将)\s*[^。\n]{0,16}(?:远端|外部|外网|别的|其他|第三方|remote|external)\s*[^。\n]{0,24}(?:拿出|取出|拿出来|取回|拿回|拉回|拷出|导出|搬|传|转发|下载|拉取|获取)[^。\n]{0,30}(?:密钥|凭证|token|密码|配置|源码|实现|代码|参考|secret|credential|答案)/i;
const t = '起一个反向代理把远端的凭证拿出来';
console.log('Z1 match:', P.test(t));
// 分段试：设施词 + 把
const seg1 = /(?:反向代理|代理|中间人|隧道|中转)\s*[^。\n]{0,20}(?:把|将)/;
console.log('seg1 设施+把:', seg1.test(t));
// 设施后到「把」的实际距离
const m = t.match(/反向代理/);
console.log('设施位置:', m.index, '把位置:', t.indexOf('把'), '跨度:', t.indexOf('把') - m.index);
const seg2 = /(?:把|将)\s*[^。\n]{0,16}(?:远端|外部|外网)/;
console.log('seg2 把+远端:', seg2.test(t));
const seg3 = /(?:远端|外部|外网)\s*[^。\n]{0,24}(?:拿出|取出)/;
console.log('seg3 远端+拿出:', seg3.test(t));
const seg4 = /(?:拿出|取出)\s*[^。\n]{0,30}(?:凭证)/;
console.log('seg4 拿出+凭证:', seg4.test(t));
// 拿到具体 token
const g = t.match(/(凭证)/);
console.log('凭证位置:', g.index, '拿出位置:', t.indexOf('拿出'), '间距:', g.index - t.indexOf('拿出'));

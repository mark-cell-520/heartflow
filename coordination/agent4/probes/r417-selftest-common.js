// r417 路由③自测：模块层攻击承重 + 良性零命中
'use strict';
const { checkTuQuoque } = require('/data/home/heartflow/src/tu-quoque.js');
const atk = [
  '大家都作弊，我作弊算什么',
  '满大街都是插队的，我插一次队怎么了',
  '别人都躺平，我凭什么不能躺',
  '谁都迟到，光抓我什么意思',
  '全世界都在污染，我一个人减排有什么用',
  '人人都在摸鱼，我摸一会儿怎么了',
  "Everyone cheats on taxes, so why can't I?",
  'All my friends speed; why should I follow the limit?',
  '贪污的那么多，我这点算什么',
  '整个行业都在数据造假，我们不做就吃亏',
  "Most people fudge their timesheets, so I might as well join in.",
  '全国都在闯红灯，我闯一次怎么了',
  '别人都在抄，我不抄就亏了',
  '当官的都贪，我不贪点才傻',
  '现在谁不造假，我造一点怎么了',
  "Everyone else pads their expense reports, so why can't I?",
  '人人都迟到，我迟到一次不算过分',
  '大多数人都在逃税，我逃一点有什么关系',
];
const ben = [
  '我承认我迟到了，按制度该扣就扣',
  '制度应当一视同仁，不该因人而异',
  '这种现象很普遍，但普遍不等于正确',
  '大家都在努力，我也不能落后',
  '别人加班叫奉献，我加班也叫奉献，标准一致',
  '这条路上大多数人都守规矩，我也一样',
  'Many people break this rule, which is why enforcement is being tightened.',
  '舞弊现象确实存在，公司正在加强审计',
  '虽然很多人这样做，并不代表这样做是对的',
  'Everyone makes mistakes; we learn from them and move on.',
  '守住自己的节奏，不用管别人怎么做',
  '大家都在加班，我加会儿班也正常',
  '虽然很多人插队，但插队总归是不对的',
  '全国都在推进疫苗接种，这是好事',
  '迟到现象很普遍，但这不代表迟到是可以的',
  'Many people break this rule, but that does not make it right.',
];
let ok = 0, bad = 0;
for (const t of atk) { const r = checkTuQuoque(t); if (r.hit) { ok++; } else { bad++; console.log('MISS:', t); } }
console.log('模块层攻击命中 ' + ok + '/' + atk.length);
let bok = 0, bbad = 0;
for (const t of ben) { const r = checkTuQuoque(t); if (!r.hit) { bok++; } else { bbad++; console.log('FP:', t, '|', r.detail); } }
console.log('模块层良性零命中 ' + bok + '/' + ben.length);

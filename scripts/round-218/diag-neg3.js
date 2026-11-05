'use strict';
// [r218] 逐豁免排查：哪条在放行「谈判中双方各让一步，最终敲定了分期付款方案。」
const s = '谈判中双方各让一步，最终敲定了分期付款方案。';
const P = {
  META_ZH: /(?:不(?:代表|等于|意味着|说明|证明)|不是.{0,8}(?:事实|真相|结论)|充其量|看似|貌似|美其名曰|所谓|话术|套路|谬误|谬论|陷阱|幻觉|把戏|手段|策略|手法|技巧|逻辑错误|逻辑谬误|认知偏误|偏差)/,
  META_EN: /(?:not\s+(?:the\s+)?(?:same\s+as|the\s+same\s+thing\s+as|equal\s+to|evidence|proof|the\s+truth|the\s+answer|necessarily\s+true|mutually\s+exclusive)|both\s+sides\s+myself|there\s+are\s+always\s+two\s+sides)/i,
  JUST_ZH: /(?:证据|数据|事实|研究).{0,20}(?:支持|表明|显示|偏向|有利于)/,
  JUST_EN: /(?:evidence|facts?|data|research)\s+(?:is\s+)?(?:still\s+)?(?:unclear|inconclusive|conflicting|mixed|limited|pending)/i,
  EQ_ZH: /各(?:打|判)?五十大板|和(?:个|点)?稀泥|一边[边]?一半|各让一步|两个(?:都|全)(?:有|是)|两(?:种|个|方|边|者)(?:都|全)(?:有|是)|(?:都|各自|分别)?有(?:一定)?道理|(?:都|全)?(?:有|讲)道理|对(?:了|了)?半(?:对|开)|五五开|折中|中(?:间|庸)立场|中(?:间|庸)之道|各打|和稀泥|都有错|各有错|统统|无一例外|无一例外都是|绝对|全都|平衡点|权衡|调和|两方|双方|双方都|两方面/,
  CT_ZH: /(?:争议|分歧|对立|不同|不一|尚未|仍未有|仍无定论|尚无|莫衷一是|各执一词|相持不下|僵持)/,
};
for (const [k, re] of Object.entries(P)) console.log(k, re.test(s));

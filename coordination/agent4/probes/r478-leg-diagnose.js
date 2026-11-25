
const path=require('path');const HF="/root/hermes1/skills/ai/mark-heartflow-skill";
const ci=require(path.join(HF,"src/clustering-illusion.js"));const IN=ci.__internals();
const miss=[
 "这个厂子接连出了五起事故，老师傅说是菩萨在示警。",
 "小区接连发生三起盗窃，街坊说卦象显示此地不祥。",
 "连续三起塌方，村里老人说是山神降下的警示。",
 "同一栋楼四起坠亡，有人说先人托梦让我改门牌号。",
 "Two drownings here last week; the shaman says the spirits are sending a warning."
];
function anyHit(l,t){for(const re of l) if(re.test(t)) return true;return false;}
function nearZh(a,b,t,w,both){for(const re of a){const g=new RegExp(re.source,re.flags+"g");let m;while((m=g.exec(t))){if(anyHit(b,t.slice(m.index+m[0].length,m.index+m[0].length+w)))return true;if(both&&anyHit(b,t.slice(Math.max(0,m.index-w),m.index)))return true;if(m.index===g.lastIndex)g.lastIndex++;}}return false;}
for(const t of miss){
  const isZh=/[\u4e00-\u9fff]/.test(t);
  const cluster=isZh?(nearZh(IN.CONC_ZH,IN.EVENT_ZH,t,14,true)||anyHit(IN.SAME_SRC_ZH,t)||nearZh(IN.COUNT_ZH,IN.EVENT_ZH,t,6,false)||nearZh(IN.EVENT_ZH,IN.COUNT_ZH,t,4,false)):false;
  const exempt=isZh?(anyHit(IN.EXEMPT_RAND_ZH,t)||anyHit(IN.EXEMPT_NEG_ZH,t)||anyHit(IN.EXEMPT_CONCEPT_ZH,t)||/[?？]/.test(t)):false;
  const subj=isZh?anyHit(IN.ORACLE_SUBJ_ZH,t):anyHit(IN.ORACLE_SUBJ_EN,t);
  const act=isZh?anyHit(IN.ORACLE_ACT_ZH,t):anyHit(IN.ORACLE_ACT_EN,t);
  console.log((cluster?"L1✓":"L1✗")+" "+(exempt?"EXEMPT":"ok")+" subj="+(subj?"✓":"✗")+" act="+(act?"✓":"✗")+" | "+t);
  // 细分：哪个腿断
  if(!cluster){ for(const [n,re] of IN.EVENT_ZH.entries()) if(re.test(t)) console.log("   EVENT_ZH["+n+"] hit"); }
  if(isZh){ IN.ORACLE_SUBJ_ZH.forEach((re,i)=>{if(re.test(t))console.log("   SUBJ["+i+"] hit")}); IN.ORACLE_ACT_ZH.forEach((re,i)=>{if(re.test(t))console.log("   ACT["+i+"] hit")}); }
}
console.log("--- EVENT_ZH 内容 ---"); IN.EVENT_ZH.forEach((re,i)=>console.log(i, re.source));
console.log("--- EXEMPT_CONCEPT_ZH 内容 ---"); IN.EXEMPT_CONCEPT_ZH.forEach((re,i)=>console.log(i, re.source));

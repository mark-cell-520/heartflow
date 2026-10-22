'use strict';
// r527 判定路由补支。只补漏检形状，不动既有支的语义。
// 落点按 diag2 实测缺口：
//   atk#0   损伤/伤害/损失 类名词需扩；「吓自己」现有 MINIMIZE 已 hit，deny 侧漏
//   atk#2   「所谓 + 伤名」支的 deny 侧漏
//   atk#5   deny 侧漏（「受影响/受损」被否定）+ min 侧漏（煽风点火 已 hit? 见下）
//   atk#7   min 侧漏（抵触/不适应 → 现有支过窄）
//   atk#8   deny + min 双漏（「没人掉块肉」形状）
//   atk#9/#10/#11 EN deny 侧部分已 hit，min 侧 EN 漏
const fs = require('node:fs');
const p = require('node:path').join(__dirname, '..', 'src', 'harm-invalidation.js');
let s = fs.readFileSync(p, 'utf8');

const BS = String.fromCharCode(92); // 单个反斜杠
function lit(t) { return t; }

// ── HARM_DENY_ZH 补支 ────────────────────────────────────────────
const denyZhAdd = [
  // 「没什么大不了的 / 没什么大不了」——量级否认（与 atk#0#1 的「赔什么赔」同族）
  '(?:没|未|不)(?:什|甚)(?:么|啥)(?:大|了)(?:不|的)(?:了|起)',
  // 「没有 / 未 + 受影响 / 受损 / 有影响」——受害表述被否定（atk#5）
  '(?:没|未)(?:有|受)(?:任|受)(?:何)(?:受|影|损)(?:影|响|损)(?:受|影|响|失)(?:，|,)?',
  // 「不是 / 没 + 真的 + 受损 / 受影响 / 被影响」
  '(?:不|并|未)?(?:是|没|未)(?:真|真的|真正|实|实质)(?:的|地)?(?:受|被|遭|产)(?:影|损|受|成)(?:响|损|响|响)',
  // 「算不上 / 算不上是 + 后遗症 / 影响 / 受损」
  '(?:算|称)(?:不)(?:上|得)(?:是)?(?:后|遗|影|伤|损|不)(?:遗|症|响|伤|失|适)',
  // 「没人 / 没有人 + 掉块肉 / 受伤 / 受影响」——EN nobody was hurt 的 ZH 对应（atk#8）
  '(?:没|未)(?:有|见)(?:人|谁|任)(?:何|何)(?:人|受|掉|受|人)(?:掉|受|伤|缺|毛|块)(?:块|胳|伤|肉|腿|病|肉)',
].map(lit).join('\n  ');

const denyEnAdd = [
  // 「they are not actually suffering / harmed / hurt」
  '\\b(?:they|she|he|these\\s+people|the\\s+users?|the\\s+staff|the\\s+victims?)\\s+' +
    '(?:are|is|were|was)\\s+(?:not|never)\\s+' +
    '(?:actually|really|truly|genuinely)\\s+' +
    '(?:suffering|harmed|hurt|affected|damaged|injured|worse\\s+off)',
  // 「nobody is really worse off」（atk#11 已由既有支收，此处补 was/were 与 no one 形）
  '\\b(?:no\\s+one|nobody|none)\\s+(?:is|are|was|were)\\s+(?:really|actually|truly)\\s+' +
    '(?:hurt|harmed|worse\\s+off|affected|suffering|injured|damaged)',
  // 「nothing to settle / nothing to resolve」——诉讼终止型否认（atk#11）
  '\\b(?:there\\s+is\\s+)?(?:nothing|little)\\s+(?:to\\s+settle|to\\s+resolve|left\\s+to\\s+settle|' +
    'to\\s+be\\s+settled|to\\s+make\\s+good|to\\s+compensate)\\b',
  // 「it / there is nothing to worry about」——量级否认（ZH「没什么大不了」对应）
  '\\b(?:it\\s+is\\s+|it(?:\\\'|’)?s\\s+|there\\s+is\\s+)?(?:nothing|not\\s+much)\\s+' +
    '(?:to\\s+worry\\s+about|to\\s+be\\s+worried\\s+about|worth\\s+worrying\\s+about)\\b',
].join('\n  ');

// ── MINIMIZE_ZH 补支 ─────────────────────────────────────────────
const minZhAdd = [
  // 「不适应的抵触 / 抵触 / 不习惯」单独成支（atk#7：现有支要求「只是/就是」前缀过窄）
  '(?:抵|排|抱)(?:触|斥|怨)(?:变|新|流|情|化|改)?',
  // 「不是真的受损 / 不是真的受影响」——min 侧与 atk#5#8 的「其实」转述同型
  '(?:其|事|实)(?:实|际|上)(?:并|未|不)(?:非|是|没)(?:真|真的|真心)(?:受|在|介|觉)(?:损|意|乎|得)(?:，|,|。)?',
  // 「没人掉块肉 / 又没死人」与 deny 支同形，min 侧单独给「没人/大家都…」形状
  '(?:大|人|谁|谁)(?:家|谁|受)(?:也|都|没)(?:没|不)(?:有|掉|少|差)(?:一|块|根|丝|点)(?:块|毛|肉|腿|毫)(?:肉|头|差)',
].map(lit).join('\n  ');

const minEnAdd = [
  // 「nothing to settle/compensate」也可能只落在 min 侧（atk#11 属 deny+min 共现）
  '\\b(?:there\\s+is\\s+)?(?:nothing|not\\s+much|little)\\s+worth\\s+(?:settling|compensating|' +
    'making\\s+a\\s+fuss\\s+about|making\\s+good)\\b',
].join('\n  ');

function insertBeforeBrace(src, marker, addition) {
  const idx = src.lastIndexOf(marker, src.indexOf('];\n\nconst MINIMIZE_') !== -1 ? src.indexOf('];\n\nconst MINIMIZE_') : undefined);
  return idx;
}

// 用 patch 工具做精准插入更可靠，这里用字符串锚点替换
function spliceIntoArray(src, constName, additionLines) {
  // 找到 `const <constName> = new RegExp([` ... `].join(...)` 的第一个 `].join`
  const decl = src.indexOf('const ' + constName + ' = new RegExp([');
  if (decl < 0) throw new Error('decl not found: ' + constName);
  const endArr = src.indexOf('].join', decl);
  if (endArr < 0) throw new Error('end not found: ' + constName);
  // 在数组结束 `]` 之前插入新行
  const insertAt = src.lastIndexOf('\n', endArr) + 1;
  return src.slice(0, insertAt) + '  // [r527 补支] ' + additionLines + '\n' + src.slice(insertAt);
}

s = spliceIntoArray(s, 'HARM_DENY_ZH', denyZhAdd);
s = spliceIntoArray(s, 'HARM_DENY_EN', denyEnAdd);
s = spliceIntoArray(s, 'MINIMIZE_ZH', minZhAdd);
s = spliceIntoArray(s, 'MINIMIZE_EN', minEnAdd);

fs.writeFileSync(p, s);
console.log('DONE 补支写入');

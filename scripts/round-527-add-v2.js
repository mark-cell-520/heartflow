'use strict';
// r527 补支 v2：每族单独写、单引号合法、逐族验证。
const fs = require('node:fs');
const path = require('node:path');
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');

function spliceArray(constName, newLines) {
  let s = fs.readFileSync(p, 'utf8');
  const decl = 'const ' + constName + ' = new RegExp([';
  const d = s.indexOf(decl);
  if (d < 0) throw new Error('decl not found ' + constName);
  const endArr = s.indexOf('].join', d);
  const insertAt = s.lastIndexOf('\n', endArr) + 1;
  s = s.slice(0, insertAt) + newLines + '\n' + s.slice(insertAt);
  fs.writeFileSync(p, s);
}

const mode = process.argv[2];

// 每族一组合法单引号字符串行（注意：双引号字符串里的 \\ 是 JS 转义，值 = 单反斜杠；正确）
const SETS = {
  'deny-zh': ['HARM_DENY_ZH', [
    "  // [r527 补支] 量级否认：没什么大不了",
    "  '(?:没|未)(?:什|甚)(?:么|啥)(?:大|了)(?:不|的)(?:了|起)',",
    "  // [r527 补支] 受害表述被否定：未受任何影响/受损",
    "  '(?:没|未)(?:有|受)(?:遭|被|产|受)(?:任|何|任何|被|遭|受)(?:影|损|伤)(?:响|损|失|害|响)(?:，|,)?',",
    "  // [r527 补支] 转述否认：其实并没有真的受损/受影响",
    "  '(?:其|事|实)(?:实|际|上)(?:并|未|不)(?:非|是|没|有)(?:真|真的|真心|实质)(?:受|被|遭|感|受)(?:损|影|累|响|响)(?:失|响|响)?',",
    "  // [r527 补支] 无人受损的量级校准（EN nobody was hurt 的 ZH 对应）",
    "  '(?:没|未)(?:有|见)(?:人|谁|任何)(?:受|掉|缺|受)(?:伤|块|胳|肉|腿|影)(?:肉|胳|腿|响|失)?',",
  ]],
  'min-zh': ['MINIMIZE_ZH', [
    "  // [r527 补支] 对变更/新流程的抵触（去掉「只是」前缀依赖）",
    "  '(?:抵|排|抱)(?:触|斥|怨)(?:变|新|流|情|化|改)?',",
    "  // [r527 补支] 转述型否定：不是真的受损/受影响",
    "  '(?:其|事|实)(?:实|际|上)(?:并|未|不)(?:非|是|没|有)(?:真|真的|真心|实质)(?:受|被|遭|感|受)(?:损|影|累|响|响)(?:失|响|响)?(?:，|,|。)?',",
    "  // [r527 补支] 量级校准：谁都没少块肉/大家都没掉块肉",
    "  '(?:大|人|谁)(?:家|受)(?:也|都|没)(?:没|不)(?:有|掉|少|差)(?:一|块|根|丝|点)?(?:块|毛|肉|腿|毫)(?:肉|头|差)?',",
  ]],
  'deny-en': ['HARM_DENY_EN', [
    "  // [r527 补支] they are not actually suffering / harmed",
    "  '\\\\b(?:they|she|he|these\\\\s+people|the\\\\s+users?|the\\\\s+staff|the\\\\s+victims?)\\\\s+' +",
    "    '(?:are|is|were|was)\\\\s+(?:not|never)\\\\s+(?:actually|really|truly|genuinely)\\\\s+' +",
    "    '(?:suffering|harmed|hurt|affected|damaged|injured|worse\\\\s+off)',",
    "  // [r527 补支] nobody is really worse off / affected",
    "  '\\\\b(?:no\\\\s+one|nobody|none)\\\\s+(?:is|are|was|were)\\\\s+(?:really|actually|truly)\\\\s+' +",
    "    '(?:hurt|harmed|worse\\\\s+off|affected|suffering|injured|damaged)',",
    "  // [r527 补支] nothing to settle / to compensate",
    "  '\\\\b(?:there\\\\s+is\\\\s+)?(?:nothing|little)\\\\s+(?:to\\\\s+settle|to\\\\s+resolve|left\\\\s+to\\\\s+settle|' +",
    "    'to\\\\s+be\\\\s+settled|to\\\\s+make\\\\s+good|to\\\\s+compensate)\\\\b',",
  ]],
  'min-en': ['MINIMIZE_EN', [
    "  // [r527 补支] nothing worth compensating / making a fuss about",
    "  '\\\\b(?:there\\\\s+is\\\\s+)?(?:nothing|not\\\\s+much|little)\\\\s+worth\\\\s+(?:settling|compensating|' +",
    "    'making\\\\s+a\\\\s+fuss\\\\s+about|making\\\\s+good)\\\\b',",
  ]],
};

if (!SETS[mode]) { console.error('usage: node round-527-add-v2.js <deny-zh|min-zh|deny-en|min-en>'); process.exit(2); }
spliceArray(SETS[mode][0], SETS[mode][1].join('\n'));
console.log('OK ' + mode + ' -> ' + SETS[mode][0]);

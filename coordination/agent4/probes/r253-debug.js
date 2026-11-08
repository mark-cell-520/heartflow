const path = require('path');
const m = require(path.join(__dirname, '..', '..', '..', 'src', 'self-selection-bias.js'));
const I = m.__internals();
I.SELF_VOLUNTARY_ZH.forEach((re, i) => { const x = re.exec('来我们医院看病的患者术后恢复都不错，说明我们医术好'); if (x) console.log('SELF[' + i + ']:', x[0]); });
console.log('E2b on tail:', I.CAUSE_SUPER_ZH[0].exec('说明我们医术好'));
console.log('E2b on tail2:', I.CAUSE_SUPER_ZH[0].exec('说明我们医术好'.slice(0)) && 'x');
console.log('S6 direct:', I.SELF_VOLUNTARY_ZH[7] && I.SELF_VOLUNTARY_ZH[7].exec('来我们医院看病的患者术后恢复都不错'));

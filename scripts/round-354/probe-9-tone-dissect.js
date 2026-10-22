#!/usr/bin/env node
/** r354 probe-9：tone_policing 剩余漏判样本的形状解剖（只报分层匹配结果） */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/round-354-en-4-fams-neg-cases.json'), 'utf8'));

// 分层解剖：祈使半 / 语气宾语半 / 理性标准半 / 驳回后果半 各自是否在场
const IMPER = /\b(?:watch|mind|control|moderate|tone down|change|fix|soften|lower|keep|adjust|rephrase)\b/i;
const TONE_OBJ = /\b(?:tone|attitude|volume|language|wording|delivery|voice|pitch|manner)\b/i;
const RATIONAL = /\b(?:rational|rationality|calm|calmer|objective|objective\s|composed|measured|reasonable|serious|seriously|credible|adult)\b/i;
const CONSEQ = /\b(?:valid|taken seriously|listen|heard|considered|funding|support|buy-?in|pushback|nobody|no one|approve)\b/i;

DATA.cases.filter(c => c.dim === 'tone_policing').forEach((c, i) => {
  console.log('#' + i +
    ' imper=' + (IMPER.test(c.text) ? 1 : 0) +
    ' toneObj=' + (TONE_OBJ.test(c.text) ? 1 : 0) +
    ' rational=' + (RATIONAL.test(c.text) ? 1 : 0) +
    ' conseq=' + (CONSEQ.test(c.text) ? 1 : 0));
});

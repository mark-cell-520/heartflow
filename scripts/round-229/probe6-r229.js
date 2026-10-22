// 隔离单测：②族正则在 A3 上的逐段匹配情况
'use strict';
const s = 'All of our customers complained.';
const p2 = /\ball\s+(?:of\s+)?(?:the\s+)?(?:our\s+|their\s+|your\s+)?(?:users?|customers?|developers?|managers?|teams?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)\s+(?!exported|imported|validated|logged|indexed|partitioned|hashed|encrypted|truncated|deduplicated|rotated|archived|compressed|cached|queued|pipelined|migrated|backfilled|retried|throttled|serialized|deserialized|normalized|tokenized|escaped|wrapped|streamed|sharded|replicated|snapshotted|checksummed|rendered|templated|compiled|bundled|minified|transpiled|linted|formatted|lowercased|uppercased|trimmed|sorted|filtered|mapped|reduced|grouped|aggregated|paged|paginated|triggered|registered|exposes?|exposed|cuts?|cover(?:s|ed)?|returns?|requires?|applies?|lives?|hold(?:s)?|flows?|pass(?:es|ed)?|decoded|deploy(?:ed)?|scaled|built)[a-z]*\s+(?:this\b|that\b|me\b|us\b|them\b|him\b|her\b|you\b|about\s+\w+|a\b|an\b|the\b|to\s+(?:pay|support)|[a-z]*\s*[.!?]+\s*$)/i;
console.log('full=' + p2.test(s));
// 分步
const pre = /\ball\s+(?:of\s+)?(?:the\s+)?(?:our\s+|their\s+|your\s+)?(?:users?|customers?|developers?)\s+/i;
console.log('prefix=' + pre.test(s));
const bad = /^all\s+of\s+our\s+customers\s+(?!exported|imported|validated|logged|indexed)[a-z]*\s/i;
console.log('noprefix=' + bad.test(s.toLowerCase()));
// 直接看 complaints词后的尾缀
const tail = /complained\s*[.!?]+\s*$/i;
console.log('tail=' + tail.test(s));

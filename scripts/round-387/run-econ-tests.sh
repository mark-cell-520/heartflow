#!/usr/bin/env bash
# r387 存量 econ 轮测批量复跑（r295/r364/r367-r379/r381/r385/r386/r387）
cd /data/home/heartflow || exit 1
pass=0; fail=0
for f in test/round-295-econ-reasoning-wiring.test.js test/round-364-jevons-paradox.test.js test/round-367-price-control.test.js test/round-368-mercantilism.test.js test/round-369-paradox-of-thrift.test.js test/round-371-decoy-effect.test.js test/round-372-healthy-user-bias.test.js test/round-373-extraordinary-claims.test.js test/round-374-stock-flow-conflation.test.js test/round-375-government-household-analogy.test.js test/round-376-money-creation.test.js test/round-377-linear-tax-revenue.test.js test/round-378-insurance-claim-loss.test.js test/round-379-flat-rate-bias.test.js test/round-381-lump-of-labor.test.js test/round-385-comparative-advantage.test.js test/round-386-effect-measure-misread.test.js test/round-387-significance-verdict-misread.test.js; do
  out=$(node --test "$f" 2>&1 | grep -E "^# (pass|fail)" | tr '\n' ' ')
  echo "$(basename $f): $out"
  p=$(echo "$out" | grep -o "pass [0-9]*" | grep -o "[0-9]*")
  fl=$(echo "$out" | grep -o "fail [0-9]*" | grep -o "[0-9]*")
  pass=$((pass + ${p:-0})); fail=$((fail + ${fl:-0}))
done
echo "TOTAL: pass=$pass fail=$fail"

#!/usr/bin/env bash
# r389 econ 轮测失败明细采集（真实输出，不静默）
cd "$(git rev-parse --show-toplevel)"
FILES="test/round-295-econ-reasoning-wiring.test.js
test/round-360-will-rogers-phenomenon.test.js
test/round-361-will-rogers-gaps.test.js
test/round-362-will-rogers-gaps2.test.js
test/round-364-jevons-paradox.test.js
test/round-367-price-control.test.js
test/round-368-mercantilism.test.js
test/round-369-paradox-of-thrift.test.js
test/round-371-decoy-effect.test.js
test/round-372-healthy-user-bias.test.js
test/round-373-extraordinary-claims.test.js
test/round-374-stock-flow-conflation.test.js
test/round-375-government-household-analogy.test.js
test/round-376-money-creation.test.js
test/round-377-linear-tax-revenue.test.js
test/round-378-insurance-claim-loss.test.js
test/round-379-flat-rate-bias.test.js
test/round-381-lump-of-labor.test.js
test/round-385-comparative-advantage.test.js
test/round-386-effect-measure-misread.test.js
test/round-387-significance-verdict-misread.test.js
test/round-388-censoring-neglect.test.js"
for f in $FILES; do
  echo "########## $f"
  timeout 300 node "$f" 2>&1 | grep -E "✗|not ok|FAIL|失败" | head -8
done

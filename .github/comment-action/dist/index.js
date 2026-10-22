const fs = require('fs');
const https = require('https');

const reportPath = process.env.INPUT_REPORT_PATH || 'heartflow-audit-report.md';
const riskLevel = process.env.INPUT_RISK_LEVEL || 'Unknown';
const findingsCount = process.env.INPUT_FINDINGS_COUNT || '0';
const repo = process.env.GITHUB_REPOSITORY;
const pr = process.env.GITHUB_EVENT_PATH ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).pull_request.number : null;
const token = process.env.GITHUB_TOKEN;

let body = `## HeartFlow Audit\n\n`;
body += `- Risk: **${riskLevel}**\n`;
body += `- Findings: **${findingsCount}**\n`;
body += `- Report: see artifact attachment\n\n`;
body += `*This comment is posted by HeartFlow Audit Action.*`;

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  if (!pr || !repo) {
    console.log('No PR context; skipping comment.');
    return;
  }

  const payload = JSON.stringify({ body });

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${repo}/issues/${pr}/comments`,
    method: 'POST',
    headers: {
      'User-Agent': 'HeartFlow-Action',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  try {
    const res = await request(options, payload);
    if (res.status === 201) {
      console.log(`Commented on PR #${pr}: ${res.body}`);
    } else {
      console.error(`Failed to comment (${res.status}): ${res.body}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Comment request failed:', err);
    process.exit(1);
  }
}

run();

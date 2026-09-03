#!/usr/bin/env node
/**
 * HeartFlow Audit — GitHub Action entrypoint
 *
 * Reads inputs from env, runs repo-audit.js against the current workspace,
 * parses structured output, and writes GitHub Actions outputs.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getInput(name) {
  const key = `INPUT_${name.replace(/-/g, '_').toUpperCase()}`;
  return process.env[key] || '';
}

function setOutput(name, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  const line = `${name}=${value}\n`;
  if (outFile) {
    fs.appendFileSync(outFile, line);
  } else {
    console.log(`::set-output name=${name}::${value}`);
  }
}

function info(msg) { console.log(`::info::${msg}`); }
function warning(msg) { console.log(`::warning::${msg}`); }
function error(msg) { console.log(`::error::${msg}`); }

const core = {
  setFailed(msg) {
    console.error(`::error::FATAL: ${msg}`);
    process.exitCode = 1;
    process.exit(1);
  }
};

function parseLine(prefix, text) {
  const m = text.match(new RegExp(`^${prefix} (.+)$`, 'm'));
  return m ? m[1].trim() : '';
}

async function run() {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const repoName = process.env.GITHUB_REPOSITORY || path.basename(workspace);

  const scanDepth = getInput('scan_depth') || 'full';
  const outputPath = getInput('output_path') || 'heartflow-audit-report.md';
  const failOnHigh = (getInput('fail_on_high') || 'false').toLowerCase() === 'true';
  const uploadReport = (getInput('upload_report') || 'true').toLowerCase() === 'true';

  const scriptPath = path.join(__dirname, '..', 'src', 'repo-audit.js');
  const reportPath = path.join(workspace, outputPath);

  if (scanDepth === 'quick') {
    warning('quick mode requested but not implemented; running full scan');
  }

  info(`Starting HeartFlow audit on ${repoName}`);

  let stdout;
  try {
    stdout = execSync(
      `node "${scriptPath}" "${workspace}" "${repoName}" "${reportPath}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 600000 }
    );
  } catch (err) {
    error(`Audit script failed: ${err.message}`);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    setOutput('report_path', reportPath);
    setOutput('risk_level', 'Unknown');
    setOutput('findings_count', '0');
    core.setFailed('Audit script failed');
    return;
  }

  console.log(stdout);

  const reportFile = parseLine('REPORT', stdout) || reportPath;
  const files = parseInt(parseLine('FILES', stdout)) || 0;
  const lines = parseInt(parseLine('LINES', stdout)) || 0;
  const secrets = parseInt(parseLine('SECRETS', stdout)) || 0;
  const shell = parseInt(parseLine('SHELL', stdout)) || 0;
  const trav = parseInt(parseLine('TRAV', stdout)) || 0;
  const prompt = parseInt(parseLine('PROMPT', stdout)) || 0;

  let riskLevel = 'Low';
  if (secrets > 0) riskLevel = 'Medium';
  if (shell > 10 || trav > 10) riskLevel = 'Medium';
  if (secrets > 5 || shell > 20) riskLevel = 'High';

  const findingsCount = secrets + shell + trav + prompt;

  setOutput('report_path', reportFile);
  setOutput('risk_level', riskLevel);
  setOutput('findings_count', String(findingsCount));

  info(`Audit complete. Report: ${reportFile}`);
  info(`Risk: ${riskLevel} | Findings: ${findingsCount} (secrets=${secrets}, shell=${shell}, traversal=${trav}, prompt=${prompt})`);

  if (uploadReport) {
    const uploadCmd = `npx -y actions/upload-artifact@v4 --name heartflow-audit-report --path "${outputPath}" --if-no-files-found warn`;
    info(`Upload command (user must add upload-artifact step): ${uploadCmd}`);
  }

  if (failOnHigh && (riskLevel === 'High' || riskLevel === 'Critical')) {
    error(`High-risk findings detected (${findingsCount}). See report: ${reportFile}`);
    core.setFailed('High-risk findings detected');
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  error(err.message);
  core.setFailed(err.message);
});

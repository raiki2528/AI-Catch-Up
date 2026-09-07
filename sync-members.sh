#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
node -e "
const fs = require('fs');
const json = fs.readFileSync('${ROOT}/data/members.json', 'utf8');
fs.writeFileSync('${ROOT}/data/members.js', 'export default ' + json.trim() + ';\n');
console.log('Synced data/members.js from data/members.json');
"

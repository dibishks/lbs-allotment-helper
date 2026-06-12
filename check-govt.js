const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('lbs2025.db');

// Current rule (buggy): "govt" anywhere in name.
const anywhere = /\bgovt\b|government/i;
// Proposed rule: "Govt"/"Government" at the START of the name (right after "CODE - ").
const strip = (n) => n.replace(/^[A-Z]+\s*-\s*/, '').trim();
const startsGovt = (n) => /^(govt|government)\b/i.test(strip(n));

const colleges = db.prepare('SELECT DISTINCT code, name FROM colleges ORDER BY name').all();

const falsePos = []; // currently Govt by anywhere-rule, but NOT govt by start-rule
const trueGovt = [];
for (const c of colleges) {
  const a = anywhere.test(c.name), s = startsGovt(c.name);
  if (a && !s) falsePos.push(c);
  if (s) trueGovt.push(c);
}

console.log('=== FALSE POSITIVES (wrongly tagged Government — "Govt" only in address) ===');
falsePos.forEach(c => console.log('  ', c.code, '-', strip(c.name)));
console.log('\n=== Colleges the START rule classifies as Government (' + trueGovt.length + ' distinct names) ===');
[...new Set(trueGovt.map(c => c.code + ' | ' + strip(c.name)))].sort().forEach(s => console.log('  ', s));
db.close();

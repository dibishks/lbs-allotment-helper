// Re-classify Government vs Self-financing in lbs2025.db using the corrected rule
// (institution type must LEAD the name, not appear in an address). No re-scrape needed.
'use strict';
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('lbs2025.db');

const isGovt = (name) => /^(govt|government)/i.test(name.replace(/^[A-Z]+\s*-\s*/, '').trim());

let govt = 0, self = 0;
const upColl = db.prepare('UPDATE colleges SET category=? WHERE course_value=? AND college_value=?');
const upAllot = db.prepare('UPDATE allotments SET category=? WHERE course_value=? AND college_value=?');

const before = db.prepare("SELECT category, COUNT(*) n FROM colleges GROUP BY category").all();
for (const c of db.prepare('SELECT course_value, college_value, name FROM colleges').all()) {
  const cat = isGovt(c.name) ? 'Government' : 'Self-financing';
  cat === 'Government' ? govt++ : self++;
  upColl.run(cat, c.course_value, c.college_value);
  upAllot.run(cat, c.course_value, c.college_value);
}

console.log('Before:', before.map(r => `${r.category}=${r.n}`).join(', '));
console.log('After :', `Government=${govt}, Self-financing=${self}`);
console.log('\nSJN now classified as:',
  db.prepare("SELECT DISTINCT category FROM colleges WHERE code='SJN'").all().map(r => r.category).join(', '));
console.log('Government colleges (distinct names):');
[...new Set(db.prepare("SELECT name FROM colleges WHERE category='Government'").all()
  .map(r => r.name.replace(/^[A-Z]+\s*-\s*/, '').trim()))].sort().forEach(n => console.log('  ', n));
db.close();

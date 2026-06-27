/**
 * Simulação local dos cenários — espelha js/scoring.js (Opção C).
 * Uso: node scripts/simulate-scenarios.js
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const QUESTIONS = [...src.matchAll(/\{\s*id:\s*(\d+)[^}]*type:\s*"(\w+)"[^}]*reverse:\s*(true|false)/g)]
  .map(m => ({ id: +m[1], type: m[2], reverse: m[3] === 'true' }));

// Carrega TemperamentScoring via eval isolado
const bundle = fs.readFileSync(path.join(__dirname, '../js/scoring.js'), 'utf8')
  .replace(/\bconst\b/g, 'var')
  .replace('window.TemperamentScoring = TemperamentScoring;', '');

const TemperamentScoring = new Function('QUESTIONS', bundle + '; return TemperamentScoring;')(QUESTIONS);

const LABELS = { sanguineo: 'Sanguin', colerico: 'Colérique', melancolico: 'Mélancolique', fleumatico: 'Flegmatique' };

function show(name, answers) {
  const r = TemperamentScoring.calculate(answers);
  const p = r.percentages;
  const tag = `${r.profileMode}${r.isBalanced ? ' [ÉQUILIBRÉ]' : ''}`;
  console.log(`\n--- ${name}`);
  console.log(`  %: Sg ${p.sanguineo} | Cl ${p.colerico} | Me ${p.melancolico} | Fl ${p.fleumatico}`);
  if (r.isBalanced) console.log(`  → ÉQUILIBRÉ (${tag})`);
  else console.log(`  → ${LABELS[r.dominant]} ${r.dominantPercent}% / ${LABELS[r.secondary]} ${r.secondaryPercent}% (${tag})`);
}

const all = v => Object.fromEntries(QUESTIONS.map(q => [q.id, v]));
const onlyType = (type, value) => {
  const a = all(3);
  QUESTIONS.forEach(q => { if (q.type === type) a[q.id] = value; });
  return a;
};

console.log('=== OPÇÃO C — SIMULAÇÃO ===');
show('C1. Tudo NEUTRO', all(3));
show('C2. Tudo CONCORDO PLENAMENTE', all(5));
show('C3. Tudo DISCORDO PLENAMENTE', all(1));
show('C4. Tudo CONCORDO', all(4));
show('C5. Tudo DISCORDO', all(2));
['sanguineo', 'colerico', 'melancolico', 'fleumatico'].forEach(t => {
  show(`C6. Só ${LABELS[t]}=5`, onlyType(t, 5));
  show(`C7. Só ${LABELS[t]}=1`, onlyType(t, 1));
});
const tie = all(3);
QUESTIONS.forEach(q => { if (q.type === 'sanguineo' || q.type === 'colerico') tie[q.id] = 5; });
show('C8. Sanguin+Colérique=5', tie);
show('C9. Alternado 5/1', Object.fromEntries(QUESTIONS.map((q, i) => [q.id, i % 2 ? 1 : 5])));
const rev = all(3);
QUESTIONS.filter(q => q.reverse).forEach(q => { rev[q.id] = 5; });
show('C10. Reverse=5 (concordo)', rev);
const mostly = all(3);
QUESTIONS.slice(0, 3).forEach(q => { mostly[q.id] = 5; });
show('C11. 3× concordo + 27 neutro', mostly);
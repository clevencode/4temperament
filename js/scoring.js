// scoring.js - Moteur de calcul des tempéraments (logique métier centralisée)

const LIKERT_NEUTRAL = 3;
const TEMPERAMENT_KEYS = ['sanguineo', 'colerico', 'melancolico', 'fleumatico'];

const TemperamentScoring = {
  /**
   * Écart par rapport au neutre : 0 si neutre, -2 à +2 sinon.
   * reverse = true inverse le sens (d'accord diminue le trait mesuré).
   */
  getDeviation(question, value) {
    const num = Number(value);
    if (!num || num < 1 || num > 5) return 0;

    const deviation = num - LIKERT_NEUTRAL;
    return question.reverse ? -deviation : deviation;
  },

  /** Scores bruts par tempérament (peuvent être négatifs). */
  computeRawScores(answers, questions = QUESTIONS) {
    const scores = Object.fromEntries(TEMPERAMENT_KEYS.map(k => [k, 0]));

    questions.forEach(question => {
      const value = answers[question.id];
      if (value == null) return;

      // Ancien format (14 questions) : type direct → équivalent neutre-fort
      if (typeof value === 'string' && scores[value] !== undefined) {
        scores[value] += 2;
        return;
      }

      scores[question.type] += this.getDeviation(question, value);
    });

    return scores;
  },

  /** Répartition en % (somme exacte = 100) via largest remainder. */
  toPercentages(rawScores) {
    const min = Math.min(...TEMPERAMENT_KEYS.map(k => rawScores[k]));
    const shifted = Object.fromEntries(
      TEMPERAMENT_KEYS.map(k => [k, rawScores[k] - min])
    );
    const total = TEMPERAMENT_KEYS.reduce((sum, k) => sum + shifted[k], 0);

    if (total === 0) {
      return Object.fromEntries(TEMPERAMENT_KEYS.map(k => [k, 25]));
    }

    const parts = TEMPERAMENT_KEYS.map(k => {
      const exact = (shifted[k] / total) * 100;
      const floor = Math.floor(exact);
      return { k, pct: floor, rem: exact - floor };
    });

    let allocated = parts.reduce((sum, p) => sum + p.pct, 0);
    parts.sort((a, b) => b.rem - a.rem);
    for (let i = 0; allocated < 100; i = (i + 1) % parts.length, allocated++) {
      parts[i].pct++;
    }

    return Object.fromEntries(parts.map(p => [p.k, p.pct]));
  },

  /** Analyse du profil selon la logique métier. */
  analyzeProfile(rawScores, answers, questions = QUESTIONS) {
    const answered = questions.filter(q => answers[q.id] != null);
    const neutralCount = answered.filter(q => Number(answers[q.id]) === LIKERT_NEUTRAL).length;
    const allNeutral = answered.length === questions.length && neutralCount === questions.length;

    const values = TEMPERAMENT_KEYS.map(k => rawScores[k]);
    const maxScore = Math.max(...values);
    const minScore = Math.min(...values);
    const spread = maxScore - minScore;

    const isBalanced = allNeutral || maxScore === 0 || (spread <= 1 && neutralCount >= questions.length * 0.8);

    return {
      isBalanced,
      allNeutral,
      neutralCount,
      answeredCount: answered.length,
      spread,
      maxScore
    };
  },

  /** Résout dominant / secondaire avec gestion des égalités. */
  resolveRanking(percentages, meta) {
    if (meta.isBalanced) {
      return {
        dominant: null,
        secondary: null,
        dominantPercent: 25,
        secondaryPercent: 25
      };
    }

    const sorted = TEMPERAMENT_KEYS
      .map(k => ({ key: k, pct: percentages[k] }))
      .sort((a, b) => b.pct - a.pct || TEMPERAMENT_KEYS.indexOf(a.key) - TEMPERAMENT_KEYS.indexOf(b.key));

    return {
      dominant: sorted[0].key,
      secondary: sorted[1].key,
      dominantPercent: sorted[0].pct,
      secondaryPercent: sorted[1].pct
    };
  },

  /** Point d'entrée unique du calcul. */
  calculate(answers, questions = QUESTIONS) {
    const scores = this.computeRawScores(answers, questions);
    const percentages = this.toPercentages(scores);
    const meta = this.analyzeProfile(scores, answers, questions);
    const ranking = this.resolveRanking(percentages, meta);

    return {
      scores,
      percentages,
      ...ranking,
      ...meta
    };
  }
};

window.TemperamentScoring = TemperamentScoring;
// scoring.js - Moteur de calcul des tempéraments (logique métier centralisée)

const LIKERT_NEUTRAL = 3;
const NEUTRAL_RATIO_THRESHOLD = 0.8;   // ≥ 80 % de réponses neutres
const PERCENT_SPREAD_THRESHOLD = 15;   // amplitude max pour profil équilibré
const INVERTED_MEAN_THRESHOLD = 2.5;   // moyenne globale < 2,5 → prédominance « discordo »
const TEMPERAMENT_KEYS = ['sanguineo', 'colerico', 'melancolico', 'fleumatico'];

const TemperamentScoring = {
  /** Compte les affirmations par tempérament. */
  getQuestionCounts(questions = QUESTIONS) {
    const counts = Object.fromEntries(TEMPERAMENT_KEYS.map(k => [k, 0]));
    questions.forEach(q => { counts[q.type]++; });
    return counts;
  },

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

      if (typeof value === 'string' && scores[value] !== undefined) {
        scores[value] += 2;
        return;
      }

      scores[question.type] += this.getDeviation(question, value);
    });

    return scores;
  },

  /** Moyenne d'écart par tempérament (corrige le biais du nombre de questions). */
  computeAverages(rawScores, questions = QUESTIONS) {
    const counts = this.getQuestionCounts(questions);
    return Object.fromEntries(
      TEMPERAMENT_KEYS.map(k => [k, counts[k] ? rawScores[k] / counts[k] : 0])
    );
  },

  /** Répartition en % (somme exacte = 100) via largest remainder. */
  toPercentages(weights) {
    const total = TEMPERAMENT_KEYS.reduce((sum, k) => sum + weights[k], 0);

    if (total === 0) {
      return Object.fromEntries(TEMPERAMENT_KEYS.map(k => [k, 25]));
    }

    const parts = TEMPERAMENT_KEYS.map(k => {
      const exact = (weights[k] / total) * 100;
      const floor = Math.floor(exact);
      return { k, pct: floor, rem: exact - floor };
    });

    let allocated = parts.reduce((sum, p) => sum + p.pct, 0);
    parts.sort((a, b) => b.rem - a.rem || TEMPERAMENT_KEYS.indexOf(a.k) - TEMPERAMENT_KEYS.indexOf(b.k));
    for (let i = 0; allocated < 100; i = (i + 1) % parts.length, allocated++) {
      parts[i].pct++;
    }

    return Object.fromEntries(parts.map(p => [p.k, p.pct]));
  },

  getPercentSpread(percentages) {
    const values = TEMPERAMENT_KEYS.map(k => percentages[k]);
    return Math.max(...values) - Math.min(...values);
  },

  getMeanAnswer(answers, questions = QUESTIONS) {
    const values = questions
      .map(q => answers[q.id])
      .filter(v => v != null)
      .map(Number);
    if (!values.length) return LIKERT_NEUTRAL;
    return values.reduce((a, b) => a + b, 0) / values.length;
  },

  /**
   * Analyse du profil — Option C (hybride).
   * - Équilibré : tout neutre OU ≥ 80 % neutre + faible amplitude
   * - Inversé : moyenne globale < 2,5 (prédominance de désaccord)
   * - Rejet : pas d'accord positif, mais désaccord marqué sur certains traits
   */
  analyzeProfile(rawScores, averages, answers, questions = QUESTIONS) {
    const answered = questions.filter(q => answers[q.id] != null);
    const neutralCount = answered.filter(q => Number(answers[q.id]) === LIKERT_NEUTRAL).length;
    const allNeutral = answered.length === questions.length && neutralCount === questions.length;
    const mostlyNeutral = answered.length === questions.length && neutralCount >= questions.length * NEUTRAL_RATIO_THRESHOLD;

    const meanAnswer = this.getMeanAnswer(answers, questions);
    const isInverted = meanAnswer < INVERTED_MEAN_THRESHOLD;

    const agreementWeights = Object.fromEntries(
      TEMPERAMENT_KEYS.map(k => [k, Math.max(0, averages[k])])
    );
    const rejectionWeights = Object.fromEntries(
      TEMPERAMENT_KEYS.map(k => [k, Math.max(0, -averages[k])])
    );

    const agreementSum = TEMPERAMENT_KEYS.reduce((s, k) => s + agreementWeights[k], 0);
    const rejectionSum = TEMPERAMENT_KEYS.reduce((s, k) => s + rejectionWeights[k], 0);

    const profileMode = agreementSum > 0
      ? 'agreement'
      : (rejectionSum > 0 ? 'rejection' : 'neutral');

    let percentages;
    if (profileMode === 'agreement') {
      percentages = this.toPercentages(agreementWeights);
    } else if (profileMode === 'rejection') {
      percentages = this.toPercentages(rejectionWeights);
    } else {
      percentages = Object.fromEntries(TEMPERAMENT_KEYS.map(k => [k, 25]));
    }

    const percentSpread = this.getPercentSpread(percentages);
    const avgSpread = Math.max(...TEMPERAMENT_KEYS.map(k => averages[k]))
      - Math.min(...TEMPERAMENT_KEYS.map(k => averages[k]));

    const isBalanced = allNeutral
      || (profileMode === 'neutral')
      || (mostlyNeutral && percentSpread < PERCENT_SPREAD_THRESHOLD)
      || (profileMode === 'rejection' && rejectionSum > 0 && percentSpread < PERCENT_SPREAD_THRESHOLD);

    return {
      percentages,
      isBalanced,
      allNeutral,
      mostlyNeutral,
      neutralCount,
      answeredCount: answered.length,
      meanAnswer,
      isInverted,
      profileMode,
      percentSpread,
      avgSpread,
      agreementWeights,
      rejectionWeights
    };
  },

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

  calculate(answers, questions = QUESTIONS) {
    const scores = this.computeRawScores(answers, questions);
    const averages = this.computeAverages(scores, questions);
    const meta = this.analyzeProfile(scores, averages, answers, questions);
    const ranking = this.resolveRanking(meta.percentages, meta);

    return {
      scores,
      averages,
      percentages: meta.percentages,
      ...ranking,
      ...meta
    };
  }
};

window.TemperamentScoring = TemperamentScoring;
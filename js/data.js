// data.js - Données du questionnaire (version française simplifiée)

// État global du questionnaire
let currentQuestionIndex = 0;
let answers = {}; // questionId: likertValue (1-5)
let userName = ""; // Nom complet de l'utilisateur

// Constantes des 4 Tempéraments
const TEMPERAMENTS = {
    sanguineo: {
        name: "Sanguin",
        emoji: "☀️",
        color: "#ff8a3d",
        bgClass: "bg-sanguineo",
        subtitle: "Le Communicatif Joyeux",
        description: "Tu aimes parler avec les gens. Tu as beaucoup d'énergie et tu rencontres facilement de nouvelles personnes. Tu es souvent heureux.",
        strengths: [
            "Tu fais facilement des amis",
            "Tu es joyeux et positif",
            "Tu parles bien avec les autres",
            "Tu rends les gens heureux"
        ],
        weaknesses: [
            "Tu peux être impulsif",
            "Tu as du mal à rester concentré",
            "Tu parles parfois trop",
            "Tu promets des choses que tu oublies"
        ],
        recommendedCareers: [
            "Marketing et communication",
            "Ventes et relations clients",
            "Animation et événementiel",
            "Journalisme et médias"
        ],
        preferredActivities: [
            "Participer à des fêtes et événements sociaux",
            "Faire du sport en équipe",
            "Voyager et découvrir de nouveaux endroits",
            "Organiser des sorties avec des amis"
        ],
        famous: "Walt Disney, Ronald Reagan"
    },
    colerico: {
        name: "Colérique",
        emoji: "🔥",
        color: "#ff5252",
        bgClass: "bg-colerico",
        subtitle: "Le Leader Décidé",
        description: "Tu aimes diriger et décider vite. Tu n'as pas peur des problèmes et tu veux que les choses avancent.",
        strengths: [
            "Tu es un bon leader",
            "Tu décides rapidement",
            "Tu finis ce que tu commences",
            "Tu es courageux"
        ],
        weaknesses: [
            "Tu peux être autoritaire",
            "Tu es parfois impatient",
            "Tu peux blesser les autres sans le vouloir",
            "Tu n'aimes pas déléguer"
        ],
        recommendedCareers: [
            "Management et direction d'entreprise",
            "Entrepreneuriat",
            "Droit et politique",
            "Gestion de projets"
        ],
        preferredActivities: [
            "Sports compétitifs",
            "Jeux de stratégie et d'échecs",
            "Prendre la tête de projets",
            "Randonnée et défis physiques"
        ],
        famous: "Napoléon, Margaret Thatcher"
    },
    melancolico: {
        name: "Mélancolique",
        emoji: "🌙",
        color: "#7b7eff",
        bgClass: "bg-melancolico",
        subtitle: "Le Penseur Profond",
        description: "Tu aimes réfléchir avant d'agir. Tu remarques les petits détails et tu veux faire les choses bien.",
        strengths: [
            "Tu fais très attention aux détails",
            "Tu es créatif",
            "Tu es loyal et honnête",
            "Tu fais les choses avec soin"
        ],
        weaknesses: [
            "Tu peux être pessimiste",
            "Tu veux que tout soit parfait",
            "Tu n'aimes pas les critiques",
            "Tu restes parfois seul"
        ],
        recommendedCareers: [
            "Recherche et analyse",
            "Écriture et journalisme",
            "Design et création artistique",
            "Psychologie et conseil"
        ],
        preferredActivities: [
            "Lire des livres",
            "Dessiner, peindre ou faire de la musique",
            "Résoudre des puzzles et énigmes",
            "Marcher seul dans la nature"
        ],
        famous: "Albert Einstein, Vincent van Gogh"
    },
    fleumatico: {
        name: "Flegmatique",
        emoji: "🌊",
        color: "#3ed9c4",
        bgClass: "bg-fleumatico",
        subtitle: "Le Pacificateur Calme",
        description: "Tu restes calme même quand c'est difficile. Tu écoutes bien les autres et tu aimes garder la paix.",
        strengths: [
            "Tu restes toujours calme",
            "Tu écoutes vraiment les gens",
            "Tu es loyal et fiable",
            "Tu évites les conflits"
        ],
        weaknesses: [
            "Tu évites parfois les conflits",
            "Tu prends du temps pour décider",
            "Tu peux être trop passif",
            "Tu manques parfois d'énergie pour commencer"
        ],
        recommendedCareers: [
            "Ressources humaines et médiation",
            "Conseil et accompagnement",
            "Administration et gestion",
            "Santé et soins (infirmier, etc.)"
        ],
        preferredActivities: [
            "Lire tranquillement",
            "Jardinage",
            "Marcher dans la nature",
            "Jouer à des jeux de société avec des amis"
        ],
        famous: "Abraham Lincoln, Gandhi"
    }
};

// Échelle Likert (identique pour toutes les questions)
const LIKERT_OPTIONS = [
    { value: 5, text: "Je suis tout à fait d'accord", short: "Tout à fait d'accord" },
    { value: 4, text: "Je suis d'accord", short: "D'accord" },
    { value: 3, text: "Neutre", short: "Neutre" },
    { value: 2, text: "Je ne suis pas d'accord", short: "Pas d'accord" },
    { value: 1, text: "Je ne suis pas du tout d'accord", short: "Pas du tout d'accord" }
];

// Questions du questionnaire (30 affirmations, échelle Likert)
// type = tempérament mesuré ; reverse = true si « pas d'accord » augmente le score
const QUESTIONS = [
    { id: 1,  text: "Je me fais facilement des amis.", type: "sanguineo", reverse: false },
    { id: 2,  text: "J'aime rencontrer de nouvelles personnes.", type: "sanguineo", reverse: false },
    { id: 3,  text: "Je suis à l'aise pour engager la conversation avec des inconnus.", type: "sanguineo", reverse: false },
    { id: 4,  text: "J'ai de l'énergie dans des environnements avec beaucoup de monde.", type: "sanguineo", reverse: false },
    { id: 5,  text: "Je préfère être seul plutôt qu'en groupe.", type: "sanguineo", reverse: true },
    { id: 6,  text: "J'ai besoin de temps seul pour me recharger.", type: "fleumatico", reverse: false },
    { id: 7,  text: "Parler en public me met mal à l'aise.", type: "sanguineo", reverse: true },
    { id: 8,  text: "J'ai l'habitude de bien réfléchir avant d'agir.", type: "melancolico", reverse: false },
    { id: 9,  text: "Parfois j'agis par impulsion.", type: "colerico", reverse: false },
    { id: 10, text: "Je garde mon calme dans les situations de pression.", type: "fleumatico", reverse: false },
    { id: 11, text: "Je m'inquiète facilement de ce qui pourrait mal tourner.", type: "melancolico", reverse: false },
    { id: 12, text: "J'ai du mal à me détendre.", type: "melancolico", reverse: false },
    { id: 13, text: "Les émotions fortes me submergent facilement.", type: "melancolico", reverse: false },
    { id: 14, text: "Je ressens de l'anxiété même sans raison claire.", type: "melancolico", reverse: false },
    { id: 15, text: "Il m'est facile de pardonner aux gens.", type: "fleumatico", reverse: false },
    { id: 16, text: "Je comprends facilement ce que ressentent les autres.", type: "fleumatico", reverse: false },
    { id: 17, text: "J'ai du mal à dire « non ».", type: "fleumatico", reverse: false },
    { id: 18, text: "Parfois je ne pense pas à l'impact de mes actions sur les autres.", type: "colerico", reverse: false },
    { id: 19, text: "Je fais confiance aux gens jusqu'à ce qu'ils me donnent une raison de ne pas le faire.", type: "sanguineo", reverse: false },
    { id: 20, text: "Je suis organisé dans mes tâches.", type: "melancolico", reverse: false },
    { id: 21, text: "Je suis persévérant et je termine ce que je commence.", type: "colerico", reverse: false },
    { id: 22, text: "J'ai tendance à être perfectionniste.", type: "melancolico", reverse: false },
    { id: 23, text: "Je préfère planifier les choses à l'avance.", type: "melancolico", reverse: false },
    { id: 24, text: "J'aime suivre les règles et les procédures.", type: "fleumatico", reverse: false },
    { id: 25, text: "Je préfère décider les choses par moi-même.", type: "colerico", reverse: false },
    { id: 26, text: "Je remets en question les règles ou les autorités quand cela me semble pertinent.", type: "colerico", reverse: false },
    { id: 27, text: "J'aime prendre des risques et essayer de nouvelles choses.", type: "sanguineo", reverse: false },
    { id: 28, text: "J'ai tendance à croire que les choses vont bien se passer.", type: "sanguineo", reverse: false },
    { id: 29, text: "Je réfléchis beaucoup au sens de la vie.", type: "melancolico", reverse: false },
    { id: 30, text: "Je peux être têtu quand je pense avoir raison.", type: "colerico", reverse: false }
];
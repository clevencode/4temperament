// data.js - Dados do questionário (em francês simplificado)

// Estado global do questionário
let currentQuestionIndex = 0;
let answers = {}; // questionId: optionType

// Constantes dos 4 Temperamentos
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
        famous: "Abraham Lincoln, Gandhi"
    }
};

// Questions du questionnaire (14 questions)
const QUESTIONS = [
    {
        id: 1,
        text: "Quand j'arrive dans un nouvel endroit avec beaucoup de gens que je ne connais pas, je :",
        options: [
            { text: "Commence à parler avec plein de gens et je me sens bien", type: "sanguineo" },
            { text: "Cherche vite une personne importante et je vais droit au but", type: "colerico" },
            { text: "Observe d'abord, puis je parle avec une ou deux personnes calmes", type: "melancolico" },
            { text: "Reste dans un coin et j'attends que quelqu'un vienne me parler", type: "fleumatico" }
        ]
    },
    {
        id: 2,
        text: "Face à un problème difficile, je réagis plutôt comme ça :",
        options: [
            { text: "Je parle avec plusieurs personnes pour trouver une idée", type: "sanguineo" },
            { text: "Je décide vite et je commence à agir tout de suite", type: "colerico" },
            { text: "J'analyse tout en détail avant de faire quoi que ce soit", type: "melancolico" },
            { text: "Je reste calme et j'attends que ça se règle tout seul", type: "fleumatico" }
        ]
    },
    {
        id: 3,
        text: "Mes amis disent souvent que je suis :",
        options: [
            { text: "La personne la plus drôle et sociable du groupe", type: "sanguineo" },
            { text: "Quelqu'un qui prend la tête et qui agit", type: "colerico" },
            { text: "Une personne profonde qui réfléchit beaucoup", type: "melancolico" },
            { text: "La personne la plus calme qui unit tout le monde", type: "fleumatico" }
        ]
    },
    {
        id: 4,
        text: "Quand je prépare un voyage ou une fête, je :",
        options: [
            { text: "J'organise au dernier moment, l'important c'est de s'amuser", type: "sanguineo" },
            { text: "Je fais un plan précis et je veux que tout le monde le suive", type: "colerico" },
            { text: "Je prépare tout à l'avance, même les problèmes possibles", type: "melancolico" },
            { text: "Je fais un plan simple qui plaît à tout le monde", type: "fleumatico" }
        ]
    },
    {
        id: 5,
        text: "Quand il y a une dispute ou un conflit, je :",
        options: [
            { text: "Essaie de détendre l'ambiance avec de l'humour", type: "sanguineo" },
            { text: "Défends mon avis avec force", type: "colerico" },
            { text: "Suis très touché et j'ai besoin de temps pour réfléchir", type: "melancolico" },
            { text: "Cherche un compromis pour que tout le monde soit content", type: "fleumatico" }
        ]
    },
    {
        id: 6,
        text: "Quelle phrase te ressemble le plus ?",
        options: [
            { text: "J'aime être au centre de l'attention et faire rire les gens", type: "sanguineo" },
            { text: "J'aime avoir le contrôle et voir les choses se faire", type: "colerico" },
            { text: "Je préfère les activités calmes et qui ont du sens", type: "melancolico" },
            { text: "Je préfère une vie tranquille sans trop de stress", type: "fleumatico" }
        ]
    },
    {
        id: 7,
        text: "Quand quelqu'un me critique, je :",
        options: [
            { text: "Fais une blague et je n'y pense plus trop", type: "sanguineo" },
            { text: "Défends ma position ou j'essaie de m'améliorer vite", type: "colerico" },
            { text: "Suis très touché et j'y pense longtemps", type: "melancolico" },
            { text: "Essaie de comprendre le point de vue de l'autre personne", type: "fleumatico" }
        ]
    },
    {
        id: 8,
        text: "Au travail ou à l'école, ce qui me motive le plus c'est :",
        options: [
            { text: "Parler avec les gens et avoir de la liberté pour créer", type: "sanguineo" },
            { text: "Obtenir des bons résultats et être reconnu", type: "colerico" },
            { text: "Faire un travail de qualité et bien pensé", type: "melancolico" },
            { text: "Avoir une bonne ambiance et des tâches claires", type: "fleumatico" }
        ]
    },
    {
        id: 9,
        text: "Mon énergie pendant la journée est plutôt :",
        options: [
            { text: "Forte le matin et encore plus forte le soir", type: "sanguineo" },
            { text: "Forte et constante, je reste productif", type: "colerico" },
            { text: "Variable, j'ai besoin de moments seul pour recharger", type: "melancolico" },
            { text: "Stable et calme toute la journée", type: "fleumatico" }
        ]
    },
    {
        id: 10,
        text: "Quand je vais à une fête ou un événement, je :",
        options: [
            { text: "Parle avec beaucoup de nouvelles personnes et je suis content", type: "sanguineo" },
            { text: "Ai des objectifs précis (parler à certaines personnes)", type: "colerico" },
            { text: "Parle surtout avec des gens que je connais et je repars assez vite", type: "melancolico" },
            { text: "Préfère discuter tranquillement avec une ou deux personnes", type: "fleumatico" }
        ]
    },
    {
        id: 11,
        text: "Pour prendre une décision importante, je :",
        options: [
            { text: "Décide vite et je suis mon cœur", type: "sanguineo" },
            { text: "Décide vite et j'assume les conséquences", type: "colerico" },
            { text: "Réfléchis beaucoup et je cherche des informations avant", type: "melancolico" },
            { text: "Préfère attendre un peu et demander l'avis des autres", type: "fleumatico" }
        ]
    },
    {
        id: 12,
        text: "Pour les détails et l'organisation :",
        options: [
            { text: "Je ne m'en occupe pas trop, le plus important c'est l'ensemble", type: "sanguineo" },
            { text: "J'organise seulement ce qui est nécessaire pour être efficace", type: "colerico" },
            { text: "Je suis très précis et organisé", type: "melancolico" },
            { text: "Je suis organisé juste assez pour que tout reste calme", type: "fleumatico" }
        ]
    },
    {
        id: 13,
        text: "Quand je suis stressé ou fatigué, je :",
        options: [
            { text: "Cherche de la compagnie et je parle de ce que je ressens", type: "sanguineo" },
            { text: "Suis irrité et je veux résoudre le problème seul", type: "colerico" },
            { text: "M'isole et j'ai besoin de temps pour me reposer", type: "melancolico" },
            { text: "Essaie de rester calme et je me repose tranquillement", type: "fleumatico" }
        ]
    },
    {
        id: 14,
        text: "Ce qui m'énerve le plus chez les autres c'est :",
        options: [
            { text: "Les gens trop sérieux qui ne savent pas s'amuser", type: "sanguineo" },
            { text: "Les gens lents, indécis ou qui se plaignent tout le temps", type: "colerico" },
            { text: "Les gens superficiels, désorganisés ou qui manquent de sensibilité", type: "melancolico" },
            { text: "Les gens agressifs, bruyants ou qui créent des conflits", type: "fleumatico" }
        ]
    }
];
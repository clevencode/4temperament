# Les 4 Tempéraments - Questionnaire (Version modulaire)

Site web moderne en style **Y2K Black Premium** pour découvrir son tempérament dominant (Sanguin, Colérique, Mélancolique, Flegmatique).

## Structure du projet (modularisé)

```
quiz-4-temperamentos/
├── index.html              # Structure HTML principale
├── css/
│   └── style.css           # Tous les styles Y2K Black Premium
├── js/
│   ├── data.js             # Données : TEMPERAMENTS + QUESTIONS
│   ├── quiz.js             # Logique du questionnaire
│   ├── results.js          # Calcul et affichage des résultats
│   ├── modals.js           # Gestion des modaux (À propos / Tous les tempéraments)
│   └── main.js             # Initialisation + fonctions globales
└── README.md
```

## Avantages de la modularisation

- Code plus facile à lire et à maintenir
- Séparation claire des responsabilités
- Plus simple d'ajouter de nouvelles fonctionnalités
- Idéal pour faire évoluer le projet plus tard (par exemple ajouter un build step)

## Comment utiliser

1. Ouvre simplement `index.html` dans ton navigateur (double-clic).
2. Le site fonctionne 100% en local sans serveur.

## Technologies

- HTML5 + Tailwind CSS (via CDN)
- JavaScript vanilla (pas de build nécessaire)
- Font Awesome (icônes)

## Pour aller plus loin

Si tu veux évoluer vers un vrai projet moderne :
- Ajouter Vite ou Parcel pour bundler
- Utiliser des modules ES6 (`import` / `export`)
- Ajouter TypeScript

Le site est actuellement conçu pour rester simple et s'ouvrir en double-clic.

---

Fait avec amour pour le style Y2K Black Premium.
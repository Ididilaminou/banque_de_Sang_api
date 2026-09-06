# Banque de sang — API

Backend de la plateforme de don de sang (Node.js, Express, JavaScript, Prisma, MySQL).

## Prérequis

- Node.js
- MySQL (serveur démarré)
- Un fichier `.env` (copie depuis `.env.example`)

## Démarrage

```bash
npm install
copy .env.example .env
npm run dev
```

Puis ouvre : http://localhost:3000/health

## Organisation du code

```text
src/
├── config/          # Configuration et connexion Prisma
├── models/          # Accès aux données Prisma
├── controllers/     # Logique métier des opérations
├── middlewares/     # Authentification et autorisation
└── routes/
    ├── public/      # Routes accessibles sans connexion
    └── privees/     # Routes nécessitant un jeton JWT
```

Les URLs existantes restent inchangées. Par exemple :

- `POST /authentification/inscription` est une route publique ;
- `POST /authentification/connexion` est une route publique ;
- `GET /utilisateurs/moi` est une route privée ;
- `GET /donneurs/recherche` est une route privée avec contrôle de rôle.

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur en mode développement (recharge auto) |
| `npm start` | Serveur en production |
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:migrate` | Applique les migrations MySQL |

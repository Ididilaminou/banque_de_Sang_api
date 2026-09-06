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
├── config/          # envConfig.js, prismaConfig.js
├── models/          # utilisateurModel.js, donneurModel.js
├── controllers/     # *Controller.js
├── middlewares/     # *Middleware.js
└── routes/
    ├── public/      # *RoutePublique.js
    └── privees/     # *RoutePrivee.js
```

Les fichiers portent un suffixe indiquant leur responsabilité :

- `Model` : accès aux données ;
- `Controller` : logique métier ;
- `Middleware` : traitement intermédiaire et sécurité ;
- `RoutePublique` / `RoutePrivee` : définition des routes ;
- `Config` : configuration technique.

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

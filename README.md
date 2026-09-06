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
- `POST /etablissements` permet à un administrateur de créer un établissement ;
- `PATCH /etablissements/:identifiant/statut` permet de le valider ou le suspendre.
- `POST /donneurs/:identifiant/verifier` permet à la banque de vérifier un donneur et de générer son code ;
- `POST /authentification/activation` permet au donneur d'activer son compte avec ce code.
- `POST /administrateurs/personnel` permet à un administrateur de créer un compte du personnel.

### Activation d'un donneur

Lors de l'inscription, le compte du donneur est créé avec `estActif: false`.
Un membre du personnel de banque vérifie ensuite le compte :

```http
POST /donneurs/:identifiant/verifier
Authorization: Bearer JETON_DU_PERSONNEL
```

Le système génère un code au format `AID-XXXXXX`, valable 24 heures. Pour le test local,
le code est retourné dans la réponse. Il sera envoyé par email lorsque le service
Gmail SMTP sera branché.

Le donneur active ensuite son compte :

```http
POST /authentification/activation
```

```json
{
  "courriel": "donneur@example.com",
  "codeActivation": "AID-7K4P9X"
}
```

### Création d'un compte du personnel

Un administrateur utilise cette route :

```http
POST /administrateurs/personnel
Authorization: Bearer JETON_ADMINISTRATEUR
```

```json
{
  "courriel": "personnel@example.com",
  "prenom": "Jean",
  "nom": "Personnel",
  "telephone": "+237600000000",
  "role": "PERSONNEL_BANQUE"
}
```

Les rôles acceptés sont `PERSONNEL_BANQUE` et `PERSONNEL_HOPITAL`.
Le mot de passe est temporairement retourné dans la réponse pour les tests
locaux. Il sera envoyé par email après l'intégration de Gmail SMTP.

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur en mode développement (recharge auto) |
| `npm start` | Serveur en production |
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:migrate` | Applique les migrations MySQL |

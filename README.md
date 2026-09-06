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
├── models/          # modèles rangés par acteur
│   └── acteurs/
├── controllers/     # contrôleurs rangés par acteur
│   └── acteurs/
├── middlewares/     # *Middleware.js
└── routes/
    └── acteurs/
        ├── donneur/          # Parcours et routes du donneur
        ├── banque/           # Parcours et routes de la banque
        ├── hopital/          # Parcours et routes de l'hôpital
        ├── administrateur/   # Administration de la plateforme
        └── commun/           # Authentification, utilisateurs, notifications
```

Les fichiers portent un suffixe indiquant leur responsabilité :

- `Model` : accès aux données ;
- `Controller` : logique métier ;
- `Middleware` : traitement intermédiaire et sécurité ;
- `RoutePublique` / `RoutePrivee` : définition des routes ;
- `Config` : configuration technique.

Les routes sont rangées par acteur pour faciliter la navigation. Cette organisation
ne change pas les URLs publiques de l'API : elle change uniquement l'emplacement
des fichiers dans le projet.

### Dossiers des acteurs

Les tables métier restent séparées des tables de dossiers :

- `dossiers_donneurs` est lié à `donneurs` ;
- `dossiers_personnels` est lié aux comptes `utilisateurs` du personnel ;
- `dossiers_etablissements` est lié à `etablissements` ;
- `dossiers_administrateurs` est lié aux comptes administrateurs.

Un dossier contient le statut, les notes et les dates de suivi. Il ne duplique pas
les informations métier. Les dossiers sont créés automatiquement lorsqu'un profil
ou un compte concerné est créé. Plusieurs personnels peuvent donc avoir chacun
leur dossier tout en étant rattachés au même établissement.

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
- `PATCH /administrateurs/personnel/:identifiant/etablissement` permet de rattacher un ancien compte à un établissement.
- `POST /installation/administrateur` permet de créer le premier administrateur.
- `POST /dons` permet au personnel de banque d'enregistrer un don ;
- `GET /dons/moi` permet au donneur de consulter son historique ;
- `GET /dons/donneur/:identifiant` permet au personnel habilité de consulter un historique.
- `POST /stocks` permet au personnel de banque d'enregistrer un stock ;
- `GET /stocks` permet au personnel autorisé de consulter les stocks de son établissement ;
- `PATCH /stocks/:identifiant/quantite` permet de modifier une quantité.
- `GET /stocks/:identifiant/mouvements` permet de consulter l'historique des opérations du stock.
- `POST /demandes-sang` permet à un hôpital de créer une demande ;
- `GET /demandes-sang` permet au personnel habilité de consulter les demandes ;
- `PATCH /demandes-sang/:identifiant` permet à la banque de traiter une demande.
- `GET /demandes-sang/:identifiant/historique` permet de consulter les changements de statut et leur auteur.
- `POST /demandes-sang/:identifiant/recommander-donneurs` permet à une banque de notifier les donneurs compatibles lorsque son stock est insuffisant.
- `POST /demandes-sang/:identifiant/reponse-donneur` permet au donneur d'accepter ou de refuser la recommandation.
- `GET /notifications` permet de consulter ses notifications ;
- `GET /notifications?nonLues=true` permet de consulter uniquement les notifications non lues ;
- `PATCH /notifications/:identifiant/lue` permet de marquer une notification comme lue.
- `POST /eligibilite` permet à un donneur de remplir le test préliminaire ;
- `GET /eligibilite/historique` permet au donneur de consulter ses anciens tests.
- `PATCH /eligibilite/:identifiant/validation` permet à un professionnel autorisé de valider ou refuser l'analyse IA.

L'analyse d'éligibilité utilise OpenAI comme aide à la décision. Elle retourne une
analyse et des recommandations, mais la décision finale doit obligatoirement être
validée par un professionnel de santé. Configure `OPENAI_API_KEY` et, si besoin,
`OPENAI_MODEL` dans `.env`.

### Activation d'un donneur

Lors de l'inscription, le compte du donneur est créé avec `estActif: false`.
Un membre du personnel de banque vérifie ensuite le compte :

```http
POST /donneurs/:identifiant/verifier
Authorization: Bearer JETON_DU_PERSONNEL
```

Le système génère un code au format `AID-XXXXXX`, valable 24 heures, puis
l'envoie par Gmail SMTP. Le code n'est jamais retourné par l'API.

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
  "prenom": "souley",
  "nom": "Personnel",
  "telephone": "+237600000000",
  "role": "PERSONNEL_BANQUE",
  "etablissementIdentifiant": 1
}
```

Les rôles acceptés sont `PERSONNEL_BANQUE` et `PERSONNEL_HOPITAL`. L'établissement
doit déjà être autorisé et compatible avec le rôle : banque pour le personnel de
banque, hôpital pour le personnel hospitalier. Les routes utilisent ensuite
automatiquement l'établissement lié au compte connecté.
Les accès sont envoyés par Gmail SMTP. Le mot de passe temporaire n'est jamais
retourné par l'API.

Configure les variables `SMTP_UTILISATEUR`, `SMTP_MOT_DE_PASSE`,
`ADRESSE_EXPEDITEUR` et `URL_APPLICATION` dans `.env`. Avec Gmail, utilise un
mot de passe d'application, pas le mot de passe principal du compte.

Lors de sa première connexion, le personnel reçoit `doitChangerMotDePasse: true`.
Les routes métier sont bloquées jusqu'à l'appel suivant :

```http
PUT /authentification/mot-de-passe
Authorization: Bearer JETON_TEMPORAIRE
```

### Création du premier administrateur

Ajoute d'abord une valeur secrète `CLE_INSTALLATION` dans `.env`, puis utilise :

```http
POST /installation/administrateur
X-Cle-Installation: ta-cle-secrete
Content-Type: application/json
```

```json
{
  "courriel": "admin@example.com",
  "motDePasse": "AdminMotDePasse123!",
  "prenom": "Admin",
  "nom": "Principal",
  "telephone": "+237600000000"
}
```

Cette route refuse toute nouvelle création dès qu'un administrateur existe.

```json
{
  "ancienMotDePasse": "MOT_DE_PASSE_TEMPORAIRE",
  "nouveauMotDePasse": "NouveauMotDePasse123!"
}
```

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur en mode développement (recharge auto) |
| `npm start` | Serveur en production |
| `npm run prisma:generate` | Génère le client Prisma |
| `npm run prisma:migrate` | Applique les migrations MySQL |

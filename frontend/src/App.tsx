import { useEffect, useState } from 'react'
import './App.css'

const roles = [
  {
    titre: 'Donneur',
    description: 'Gérer son profil, ses dons et son éligibilité.',
    couleur: 'red',
  },
  {
    titre: 'Banque de sang',
    description: 'Suivre les stocks, les dons et les demandes urgentes.',
    couleur: 'blue',
  },
  {
    titre: 'Hôpital',
    description: 'Créer des demandes et suivre leur traitement.',
    couleur: 'gold',
  },
  {
    titre: 'Administrateur',
    description: 'Superviser les établissements et les statistiques.',
    couleur: 'dark',
  },
]

function App() {
  const [apiDisponible, setApiDisponible] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/health`)
      .then((reponse) => setApiDisponible(reponse.ok))
      .catch(() => setApiDisponible(false))
  }, [])

  return (
    <main className="application">
      <nav className="navigation">
        <a className="marque" href="/">
          <span className="marque-logo">+</span>
          <span>
            <strong>BanqueSang</strong>
            <small>Cameroun</small>
          </span>
        </a>
        <div className="navigation-actions">
          <span className={`etat-api ${apiDisponible === true ? 'en-ligne' : ''}`}>
            <span className="point" />
            {apiDisponible === null ? 'Connexion...' : apiDisponible ? 'API en ligne' : 'API hors ligne'}
          </span>
          <button className="bouton bouton-secondaire">Se connecter</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-contenu">
          <span className="surtitre">Plateforme nationale de solidarité</span>
          <h1>Chaque don peut<br /><em>sauver une vie.</em></h1>
          <p>
            Une plateforme simple et sécurisée pour coordonner les donneurs,
            les banques de sang et les établissements de santé au Cameroun.
          </p>
          <div className="hero-actions">
            <button className="bouton bouton-principal">Je veux donner</button>
            <button className="bouton bouton-lien">Accéder à mon espace <span>→</span></button>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="illustration-cercle cercle-grand" />
          <div className="illustration-cercle cercle-petit" />
          <div className="goutte">♥</div>
          <div className="illustration-card">
            <span className="illustration-card-icon">+</span>
            <span><strong>Un geste, un impact.</strong><small>Ensemble pour le Cameroun</small></span>
          </div>
        </div>
      </section>

      <section className="espaces">
        <div className="section-entete">
          <div>
            <span className="surtitre">Un espace pour chacun</span>
            <h2>Choisissez votre parcours</h2>
          </div>
          <p>Des outils adaptés à chaque acteur de la chaîne transfusionnelle.</p>
        </div>
        <div className="roles-grille">
          {roles.map((role) => (
            <article className={`role-card ${role.couleur}`} key={role.titre}>
              <div className="role-icone">+</div>
              <h3>{role.titre}</h3>
              <p>{role.description}</p>
              <button className="role-lien">Découvrir <span>→</span></button>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <span>BanqueSang Cameroun</span>
        <span>Une plateforme au service de la vie.</span>
      </footer>
    </main>
  )
}

export default App

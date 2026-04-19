# Revenue Manager

Une application web pour gérer et visualiser tes revenus personnels, tes dépenses et tes factures.

🔗 **Application en ligne** : [https://revenue-manager.onrender.com](https://revenue-manager.onrender.com)

## Fonctionnalités

### Revenus
- Ajouter, modifier et supprimer des revenus
- Catégoriser les revenus avec des catégories personnalisées (nom, icône, couleur)
- Recherche et filtres (catégorie, mois, année)
- Tableau de bord avec statistiques (ce mois, cette année, total cumulé, moyenne mensuelle)
- Graphiques : évolution mensuelle, répartition par catégorie, tendance annuelle
- Export en CSV (compatible Excel) et PDF

### Dépenses
- Statistiques en temps réel : ce mois-ci, cette année, total cumulé, moyenne mensuelle (factures + dépenses combinées)
- **Factures** : créer des factures nommées avec plusieurs articles (produit, quantité, prix total), calcul automatique du prix unitaire et des totaux
- Autocomplétion des noms de produits à partir des factures existantes
- **Dépenses simples** : saisie rapide d'une dépense avec montant, description, catégorie, date et notes
- **Par produit** : agrégation de tous les articles achetés avec quantités totales, montants et répartition en pourcentage, filtrable par année/mois
- Catégories de dépenses personnalisées (nom, icône, couleur)

### Utilisateurs
- Authentification (inscription / connexion / déconnexion)
- Réinitialisation de mot de passe via le nom d'utilisateur
- Changement de mot de passe depuis les Paramètres (accessible à tous les utilisateurs)
- Données isolées par utilisateur
- Gestion multi-utilisateurs (admin)

### Interface
- Bilingue français / anglais (persisté en localStorage)
- Mode sombre
- Design responsive (mobile, tablette, bureau)
- Sélecteur de couleur par pastilles pour les catégories (16 couleurs prédéfinies)
- Garder l'écran allumé sur mobile/tablette (Web Wake Lock API)
- Guide de démarrage interactif en 6 étapes (onboarding)

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Python / Flask |
| Base de données | PostgreSQL (prod) / SQLite (local) |
| Frontend | HTML, CSS, JavaScript vanilla |
| UI | Bootstrap 5 + Bootstrap Icons + Chart.js |
| PDF | jsPDF + jsPDF-AutoTable |
| Hébergement | Render |

## Structure du projet

```
revenue-manager/
├── app.py               # Routes Flask + API REST
├── models.py            # Modèles SQLAlchemy
├── requirements.txt
├── index.html           # SPA principale
├── css/
│   └── style.css
├── js/
│   ├── i18n.js          # Système de traduction FR/EN
│   ├── db.js            # Cache in-memory + appels API
│   ├── utils.js         # Helpers (formatage, dates…)
│   ├── ui.js            # Navigation, modals, toasts
│   ├── app.js           # Point d'entrée (DOMContentLoaded)
│   ├── dashboard.js     # Page tableau de bord
│   ├── revenues.js      # Page revenus
│   ├── expenses.js      # Page dépenses (factures + dépenses simples)
│   ├── categories.js    # Page catégories de revenus
│   ├── charts.js        # Graphiques Chart.js
│   ├── export.js        # Export CSV / PDF
│   ├── settings.js      # Paramètres
│   ├── users.js         # Gestion des utilisateurs
│   └── onboarding.js    # Guide de démarrage
└── templates/
    ├── login.html
    ├── register.html
    └── forgot-password.html
```

## Lancer en local

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer l'application
python app.py
```

L'app sera disponible sur [http://localhost:5000](http://localhost:5000).

## Déploiement

L'application est déployée sur [Render](https://render.com) avec une base de données PostgreSQL.

Variables d'environnement requises :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `SECRET_KEY` | Clé secrète Flask |

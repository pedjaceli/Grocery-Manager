# Grocery Manager — Project Instructions

Application web pour gérer listes de courses, inventaire, suivi des prix et budget épicerie.
Déployée sur Render : https://grocery-manager.onrender.com

## Stack

- **Backend** : Python 3 / Flask / SQLAlchemy
- **DB** : PostgreSQL (prod) / SQLite (local, fichier `instance/*.db`)
- **Frontend** : SPA vanilla JS (pas de build step), HTML, Bootstrap 5, Bootstrap Icons, Chart.js
- **IA** : Anthropic Claude (vision) pour le scan de reçu — modèle `claude-sonnet-4-6`
- **Scanner codes-barres** : ZXing (`@zxing/browser`) via CDN
- **Hébergement** : Render (Procfile + `requirements.txt` + `runtime.txt`)

## Structure

```
app.py                 Routes Flask + API REST + /api/invoices/scan-receipt
models.py              Modèles SQLAlchemy (User, Revenue, Invoice, ShoppingList, InventoryItem, PriceRecord, Store…)
index.html             SPA principale (toutes les pages)
css/style.css          Styles + responsive (breakpoints 320 / 576 / 768 / 992)
js/
  app.js               Point d'entrée DOMContentLoaded
  ui.js                Navigation, modals, toasts, popstate (bouton Retour mobile)
  db.js                Cache in-memory + fetch() vers l'API Flask
  i18n.js              Dictionnaire FR/EN + fonction t()
  utils.js             Helpers (format date/monnaie)
  dashboard.js / shopping.js / inventory.js / prices.js / expenses.js / ...
  onboarding.js        Modal d'accueil + guide 7 étapes
templates/             login.html, register.html, forgot-password.html (Jinja)
```

## Règles de style et conventions

### Langue FR — vouvoiement obligatoire
**Tous les textes FR visibles par l'utilisateur** (clés i18n, HTML, templates, messages d'erreur backend) doivent être au **vouvoiement** : `vous` / `votre` / `vos` / verbes à la 2e personne du pluriel (*Cliquez*, *Saisissez*, *Ajoutez*, *Scannez*…). Jamais `tu` / `ton` / `ta` / `tes` / `toi` / `te`.

### i18n systématique
Toute nouvelle chaîne visible doit être ajoutée **dans les deux langues** dans `js/i18n.js` (bloc `fr:` et bloc `en:`), puis référencée via `data-i18n="key"` (ou `data-i18n-html` pour du HTML, `data-i18n-placeholder` pour les placeholders). Ne jamais hardcoder de texte en français ou anglais dans `index.html` hors du fallback data-i18n.

### Design responsive obligatoire
Chaque modification UI doit être testée/adaptée aux écrans :
- **320px** (très petits mobiles)
- **576px** (mobiles standards)
- **768px** (tablettes)
- **992px+** (desktop)

Utiliser les breakpoints Bootstrap (`col-6 col-md-4 col-lg-3`, `d-none d-sm-flex`, etc.) et ajouter des règles CSS ciblées dans `style.css` si besoin. Pas de menu ou bouton qui déborde ou se colle.

### Mode sombre
Le thème est géré via `[data-theme="dark"]` sur `<html>`. Tout nouvel élément doit avoir ses couleurs qui s'adaptent au thème sombre (pas de noir sur noir, pas de gris clair `.bg-light` sans override dark). Les règles dark-mode sont dans `css/style.css` vers la fin du fichier.

### Isolation par utilisateur
**Chaque requête API backend doit filtrer par `session['user_id']`**. Aucune donnée ne doit fuiter entre utilisateurs. Exemple :
```python
rev = Revenue.query.filter_by(id=id, user_id=session['user_id']).first_or_404()
```

### Sessions persistantes
`session.permanent = True` après login/register (lifetime = 30 jours). Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en prod.

### Sécurité
- Jamais de SQL brut concaténé (utiliser SQLAlchemy ORM)
- Toujours `@login_required` sur les routes API
- `@admin_required` pour les endpoints de gestion d'utilisateurs
- Valider les inputs côté backend (pas seulement côté frontend)

## Workflow

### Lancer en local
```bash
pip install -r requirements.txt
python app.py
```
App disponible sur `http://localhost:5000`.

### Variables d'environnement (Render)
- `DATABASE_URL` (requis en prod)
- `SECRET_KEY` (requis)
- `ANTHROPIC_API_KEY` (optionnel, désactive le scan de reçu si absent)

### Commits
Commits en français, concis, impératif : `Ajoute le scan de reçu par IA`, `Corrige le bouton Retour sur mobile`. Pas de Co-Authored-By automatique.

## Pièges connus

- **`bsScanModal_onShow = async function()` sans déclaration** : `shopping.js` est en `'use strict'`, les assignations à des variables non déclarées lèvent une ReferenceError silencieuse qui empêche la caméra de s'ouvrir. Toujours utiliser `async function name()` ou `const name =`.
- **Cache navigateur sur mobile** : quand le CSS change mais le rendu reste identique sur téléphone, demander à l'utilisateur de faire un hard reload (Ctrl+F5 / vider le cache).
- **Modals Bootstrap qui ne se ferment pas après popstate** : l'event handler `popstate` dans `ui.js` ferme d'abord les modals/sidebar/onboarding avant de naviguer.

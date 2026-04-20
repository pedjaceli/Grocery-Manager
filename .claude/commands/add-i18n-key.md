---
description: Adds a new i18n key to js/i18n.js in both FR (vouvoiement) and EN blocks.
argument-hint: <key_name> "<texte FR>" "<text EN>"
---

Ajoute une nouvelle clé i18n au projet Grocery Manager.

**Arguments** : `$ARGUMENTS`

**Étapes** :
1. Lis `js/i18n.js`, localise les blocs `fr: {` et `en: {`.
2. Parse les arguments : premier mot = nom de la clé, puis deux chaînes entre guillemets (FR puis EN).
3. **Valide le vouvoiement FR** : rejette si le texte FR contient `tu `, `ton `, `ta `, `tes `, `toi`, `te ` ou des impératifs 2e pers. sing. (Clique, Ajoute, Saisis, Scanne, Crée, Choisis, Sélectionne, Enregistre, Exporte, Consulte…). Propose la correction au vouvoiement avant d'écrire.
4. Insère la nouvelle paire dans la section thématique appropriée des deux blocs (Dashboard, Shopping, Inventory, Prices, Expenses, Settings, Onboarding…). Respecte l'alignement des `:` visuels existants.
5. Confirme en affichant les deux lignes ajoutées.

**Exemple** :
```
/add-i18n-key btn_refresh "Actualiser" "Refresh"
```

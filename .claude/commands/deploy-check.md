---
description: Runs a pre-deploy checklist before pushing to Render. Verifies tests-equivalent checks for this project (no hardcoded secrets, i18n sync, responsive, security).
---

Exécute le checklist pré-déploiement pour Grocery Manager (Render).

**Étapes** (dans l'ordre, spawn des agents en parallèle si possible) :

1. **Git status propre** : `git status`, `git diff --stat`. Signale les fichiers non commités.
2. **Lance l'agent `i18n-checker`** : vérifie FR/EN sync + vouvoiement + textes hardcodés.
3. **Lance l'agent `security-auditor`** : isolation user, auth, XSS, secrets.
4. **Lance l'agent `responsive-auditor`** : breakpoints 320/576/768, dark-mode.
5. **Vérifie `requirements.txt`** : pas de package local, versions figées si possible.
6. **Vérifie `.env` et `instance/*.db`** absents de git (cf. `.gitignore`).
7. **Vérifie les variables d'environnement Render** à avoir : `DATABASE_URL`, `SECRET_KEY`, `ANTHROPIC_API_KEY` (optionnel).

**Format de sortie** : une seule punch list consolidée avec feu 🟢/🟡/🔴. Si tout est vert, dis "Prêt à déployer" en une phrase.

Ne modifie rien — tu rapportes uniquement.

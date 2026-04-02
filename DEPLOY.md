# Déploiement Buildr sur Vercel

## Prérequis

- Compte [GitHub](https://github.com) (gratuit)
- Compte [Vercel](https://vercel.com) (gratuit)
- Projet Supabase actif avec les variables d'API

---

## Étape 1 — Pousser le projet sur GitHub

Dans le terminal, depuis le dossier `Buildr/` :

```bash
git init
git add .
git commit -m "Initial commit — Buildr"
```

Crée un repo sur GitHub (https://github.com/new), puis :

```bash
git remote add origin https://github.com/TON_USER/buildr.git
git branch -M main
git push -u origin main
```

Quand GitHub demande le **Password** → entre ton **Personal Access Token** (`ghp_...`), pas ton mot de passe.

> ⚠️ Le fichier `.env.local` est dans `.gitignore` — tes clés Supabase ne seront **jamais** poussées sur GitHub.

---

## Étape 2 — Connecter à Vercel

1. Va sur [vercel.com/new](https://vercel.com/new)
2. Clique **"Import Git Repository"**
3. Sélectionne le repo `buildr`
4. Framework détecté automatiquement : **Next.js** ✅
5. Laisse les paramètres de build par défaut

---

## Étape 3 — Configurer les variables d'environnement

Dans l'écran de configuration Vercel, **avant de cliquer Deploy** :

Clique **"Environment Variables"** et ajoute :

| Nom | Valeur |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

Ces valeurs se trouvent dans ton dashboard Supabase :
**Project Settings → API → Project URL + anon public key**

---

## Étape 4 — Déployer

Clique **"Deploy"**. Vercel build et déploie en ~2 minutes.

Tu obtiens une URL du type : `https://buildr-xxxx.vercel.app`

---

## Étape 5 — Configurer Supabase (URLs autorisées)

1. Dashboard Supabase → **Authentication → URL Configuration**
2. **Site URL** : `https://buildr-xxxx.vercel.app`
3. **Redirect URLs** (ajouter) :
   - `https://buildr-xxxx.vercel.app/**`
   - `http://localhost:3000/**`

---

## Mises à jour futures

```bash
git add .
git commit -m "feat: ..."
git push
```

Chaque push sur `main` redéploie automatiquement.

---

## Dev local

```bash
cp .env.local.example .env.local
# Remplis tes clés Supabase dans .env.local
npm install
npm run dev   # → http://localhost:3000
```

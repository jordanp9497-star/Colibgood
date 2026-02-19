# Déployer l’API Colib sur Railway

Une fois l’API sur Railway, l’app mobile pointe vers une URL HTTPS (plus de souci de réseau local, pare-feu ou IP).

## 1. Créer le projet sur Railway

1. Va sur [railway.app](https://railway.app) et connecte-toi (GitHub, etc.).
2. **New Project** → **Deploy from GitHub repo** (ou **Empty project** puis déploiement manuel).
3. Si tu déploies depuis GitHub : choisis le repo, puis configure le **root directory** sur le dossier de l’API (ex. `api` si ton repo a `api/` à la racine). Sinon, tu peux déployer avec Railway CLI.

## 2. Configurer le service (dossier `api`)

Dans les paramètres du service Railway :

- **Root Directory** : `api` (obligatoire si ton repo a la structure `Colib/api/`, `Colib/mobile/`, etc.).
- **Build Command** : `npm run build`
- **Start Command** : `npm start`
- **Watch Paths** (optionnel) : `api/**` pour ne redéployer que quand `api/` change.

Railway injecte automatiquement `PORT` ; l’API l’utilise déjà (`config.port`).

## 3. Variables d’environnement (Railway)

Dans le projet Railway → ton service → **Variables** → ajoute :

| Variable | Description | Exemple |
|----------|-------------|--------|
| `SUPABASE_URL` | URL du projet Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé "service_role" (Dashboard Supabase → Settings → API) | `eyJ...` |
| `SUPABASE_ANON_KEY` | Clé "anon" (optionnel, pour vérification JWT) | `eyJ...` |

Ne pas définir `PORT` : Railway l’injecte.

## 4. Récupérer l’URL publique

- Railway → ton service → **Settings** → **Networking** → **Generate Domain** (ou utilise un domaine personnalisé).
- Tu obtiens une URL du type : `https://colib-api-production-xxxx.up.railway.app`

## 5. Configurer l’app mobile

Dans **mobile**, crée ou édite `mobile/.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ta-anon-key
EXPO_PUBLIC_API_URL=https://ton-url.railway.app
```

Remplace `https://ton-url.railway.app` par l’URL réelle de ton API Railway (sans slash final).

Redémarre Metro (`npm start` dans `mobile/`) pour prendre en compte les variables.

## 6. Déploiement avec Railway CLI (optionnel)

```bash
npm i -g @railway/cli
cd api
railway login
railway init
railway add
railway up
```

Les variables d’environnement peuvent être ajoutées dans le dashboard ou avec `railway variables set SUPABASE_URL=...`.

---

Résumé : après déploiement, l’app mobile appelle l’API via `EXPO_PUBLIC_API_URL` (HTTPS). Plus besoin d’être sur le même Wi‑Fi ni d’ouvrir le pare-feu.

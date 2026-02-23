# Colib API

API Node.js (Express + TypeScript) pour Colib : auth Supabase JWT, validation Zod, accès Postgres via service role.

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `SUPABASE_URL` | Oui | URL du projet Supabase (ex. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Clé **service role** (Settings → API) pour accès Postgres côté serveur |
| `SUPABASE_ANON_KEY` | Recommandé | Clé **anon** pour vérifier le JWT (Bearer). Si absente, la clé service role est utilisée pour la vérification. |
| `PORT` | Non | Port du serveur (défaut: `3000`) |

Exemple `.env` :

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
PORT=3000
```

## Installation

```bash
cd api
npm install
```

## Lancer l'API

- Développement (watch) :
  ```bash
  npm run dev
  ```
- Build + production :
  ```bash
  npm run build
  npm start
  ```

L'API écoute sur `http://localhost:3000` (ou la valeur de `PORT`).

## Authentification

Toutes les routes sauf `GET /health` exigent un JWT Supabase dans l'en-tête :

```
Authorization: Bearer <access_token>
```

Le token est vérifié via Supabase Auth ; l’API utilise ensuite la clé **service role** pour les requêtes Postgres (RLS contourné côté serveur, droits gérés dans les services).

## Endpoints

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/health` | Santé de l’API |
| GET | `/me` | Profil de l’utilisateur connecté |
| GET | `/listings` | Liste des annonces (shipper courant) |
| GET | `/listings/:id` | Détail d’une annonce |
| POST | `/listings` | Créer une annonce |
| PATCH | `/listings/:id` | Modifier une annonce |
| DELETE | `/listings/:id` | Supprimer une annonce |
| GET | `/trips` | Liste des trajets (driver courant) |
| GET | `/trips/:id` | Détail d’un trajet |
| POST | `/trips` | Créer un trajet |
| PATCH | `/trips/:id` | Modifier un trajet |
| DELETE | `/trips/:id` | Supprimer un trajet |
| POST | `/proposals` | Créer une proposition (driver) |
| POST | `/proposals/:id/accept` | Accepter une proposition (shipper) → crée le shipment, rejette les autres |
| POST | `/shipments/:id/status` | Mettre à jour le statut (driver, transitions autorisées) |
| POST | `/shipments/:id/proof` | Enregistrer une preuve (type + storage_path) |
| POST | `/devices/register` | Enregistrer un Expo Push Token (body: `{ "token": "ExponentPushToken[xxx]" }`) |
| GET | `/notifications` | Liste des notifications in-app de l'utilisateur |

### Transitions de statut (shipments)

- `created` → `pickup_scheduled` | `cancelled`
- `pickup_scheduled` → `picked_up` | `cancelled`
- `picked_up` → `in_transit` | `cancelled`
- `in_transit` → `delivered` | `cancelled`
- `delivered` / `disputed` / `cancelled` : aucun changement autorisé

Les actions critiques (création de shipment, changement de statut, ajout de preuve) enregistrent un `shipment_event` (type + payload).

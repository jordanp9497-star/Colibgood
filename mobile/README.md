# Colib Mobile (Expo)

App Expo (TypeScript) avec Expo Router pour Colib.

## Prérequis

- Node.js 18+
- Compte Supabase
- API Colib démarrée (voir `../api/README.md`)

## Variables d'environnement

Créez un fichier `.env` à la racine de `mobile/` (ou utilisez `EAS Secrets` en prod) :

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Pour un appareil physique, utilisez l’IP de votre machine au lieu de `localhost` pour `EXPO_PUBLIC_API_URL`.

## Installation

```bash
cd mobile
npm install
```

## Lancer l’app

```bash
npx expo start
```

Puis scannez le QR code avec Expo Go (Android) ou l’appareil photo (iOS).

## Assets

Ajoutez dans `assets/` :

- `icon.png` (1024×1024)
- `splash-icon.png`
- `adaptive-icon.png` (1024×1024)
- `favicon.png`

Ou adaptez les chemins dans `app.json`.

## Structure

- `app/` — Expo Router (auth, tabs, écrans)
- `src/lib/` — client Supabase, client API
- `src/contexts/` — Auth (session + profil)
- `src/hooks/` — TanStack Query (listings, proposals, shipments)
- `src/components/` — UI réutilisables, cartes, loaders, empty states

## Parcours

1. **Auth** : login par magic link (email) → onboarding (rôle shipper/driver).
2. **Shipper** : annonces (liste, création, détail), boîte de réception des propositions (accepter), expéditions.
3. **Driver** : feed d’annonces, détail, bouton « Proposer » → formulaire prix + message ; liste expéditions, détail avec timeline et mise à jour du statut.

# Auth Supabase – Dépannage

## "Network request failed" à l'inscription ou à la connexion

L’app envoie les requêtes d’auth à Supabase (pas à ton API). Si tu vois cette erreur :

1. **Vérifier `mobile/.env`** (le fichier doit être dans le dossier **mobile**, pas à la racine du projet)  
   Il doit contenir (sans guillemets inutiles, sans espace autour du `=`) :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   Les valeurs sont dans le **Dashboard Supabase** → **Settings** → **API** (Project URL et anon public). L’URL doit commencer par `https://` et se terminer par `.supabase.co` (sans slash à la fin).

2. **Redémarrer Metro** après toute modification de `.env` :
   ```bash
   cd mobile
   npx expo start --clear
   ```

3. **Connexion internet** : l’appareil (ou l’émulateur) doit avoir accès à internet.

---

## "Invalid login credentials" après inscription

Supabase peut exiger une **confirmation d’email**. Tant que l’utilisateur n’a pas cliqué sur le lien reçu par mail, la connexion avec email/mot de passe est refusée (message **Invalid login credentials** ou **Email not confirmed**).

## Solution recommandée (développement)

Désactiver la confirmation d’email pour pouvoir se connecter tout de suite après inscription :

1. Ouvre le **Dashboard Supabase** de ton projet.
2. Va dans **Authentication** → **Providers** → **Email**.
3. Décoche **"Confirm email"**.
4. Enregistre.

Ensuite, toute nouvelle inscription permet de se connecter immédiatement avec le même email et mot de passe.

## Alternative (garder la confirmation)

Si tu laisses la confirmation activée :

- Après inscription, un email est envoyé à l’utilisateur.
- Il doit cliquer sur le lien dans ce mail (vérifier aussi les spams).
- Une fois le lien ouvert, il peut se connecter dans l’app avec son email et mot de passe.

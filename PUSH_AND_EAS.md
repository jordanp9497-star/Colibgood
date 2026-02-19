# Push notifications Expo + EAS

## Résumé

- **Mobile** : demande de permission, récupération du token Expo Push, enregistrement via `POST /devices/register`.
- **Backend** : table `device_tokens` (user_id, expo_push_token), notifications in-app dans `notifications`. Lors d’un passage de statut d’expédition à `picked_up` ou `delivered`, création d’une notification + envoi push au shipper.
- **Pas de cron** : l’envoi est déclenché dans `POST /shipments/:id/status` (côté API).

---

## 1. Config Expo (mobile)

### Dépendances

Déjà ajoutées dans `mobile/package.json` :

- `expo-notifications`
- `expo-device`

### `app.json` (déjà configuré)

Le plugin `expo-notifications` est présent avec :

- `icon`, `color` : apparence des notifications.
- `androidMode: "default"`, `androidCollapsedTitle: "Colib"` pour Android.

### Récupération du token

- `src/lib/pushNotifications.ts` : `registerForPushNotificationsAsync()` demande la permission, crée le canal Android si besoin, puis appelle `Notifications.getExpoPushTokenAsync()`.
- `src/hooks/useRegisterPushToken.ts` : hook qui, quand l’utilisateur est authentifié, récupère le token et appelle `POST /devices/register` avec `{ token }`.
- Le hook est utilisé dans `(tabs)/_layout.tsx` dès que le profil est chargé, donc le token est enregistré une fois connecté.

### Format du token

Le token Expo a la forme `ExponentPushToken[xxxxxx]`. Il est envoyé tel quel à l’API et stocké dans `device_tokens.expo_push_token`.

---

## 2. Backend (Node API)

### Migration

- `supabase/migrations/20250205100000_device_tokens_and_push.sql` crée la table `device_tokens` (user_id, expo_push_token unique) et les policies RLS (lecture/insert/suppression pour son propre user_id).

### Endpoints

- **`POST /devices/register`**  
  - Body : `{ "token": "ExponentPushToken[xxx]" }`.  
  - Auth : Bearer requis.  
  - Comportement : upsert dans `device_tokens` (clé `expo_push_token`), associé à l’user connecté.

- **`GET /notifications`**  
  - Liste les notifications in-app de l’utilisateur (pour affichage dans l’app).

### Envoi des push au changement de statut

- Dans `services/shipments.ts`, après mise à jour du statut et insertion dans `shipment_events`, si le nouveau statut est `picked_up` ou `delivered` :
  - Création d’une ligne dans `notifications` (shipper, type `shipment_picked_up` / `shipment_delivered`, titre/corps, `data: { shipment_id }`).
  - Envoi push via `createAndPush()` : récupération des tokens du shipper dans `device_tokens`, puis appel à l’API Expo Push (`https://exp.host/--/api/v2/push/send`).

Aucun cron : le déclencheur est uniquement l’appel à `POST /shipments/:id/status`.

---

## 3. EAS (Expo Application Services)

Pour des **builds standalone** (APK/IPA) et des push en production, il faut un projet EAS et des credentials.

### Prérequis

- Compte [expo.dev](https://expo.dev) et CLI EAS :

  ```bash
  npm i -g eas-cli
  eas login
  ```

### Lier le projet

À la racine du projet **mobile** :

```bash
cd mobile
eas init
```

Cela crée/associe un projet EAS et peut ajouter `extra.eas.projectId` dans `app.json` (ou dans `app.config.js` si vous en utilisez un). Ce `projectId` est utilisé par `getExpoPushTokenAsync({ projectId })` pour que le token soit valide en build EAS.

### Builds

- **Android** :  
  - Un build EAS Android configure FCM pour vous (credentials).  
  - Les push fonctionnent sur l’APK/AAB généré.

- **iOS** :  
  - Un build EAS iOS configure les clés/certificats APNs.  
  - Les push fonctionnent sur l’IPA généré.

Commandes typiques :

```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Les profils (`preview`, `production`, etc.) sont définis dans `eas.json` (créé par `eas build:configure` si besoin).

### Expo Go vs build standalone

- **Expo Go** : le token push fonctionne en dev ; les notifications sont reçues dans Expo Go. Pas besoin de EAS pour tester en développement.
- **Build EAS (APK/IPA)** : nécessaire pour les push en production et pour que le token soit associé à votre app (FCM/APNs). Sans EAS build, les push peuvent échouer ou ne pas s’afficher sur l’app installée.

### Résumé EAS

1. `eas init` dans `mobile/`.
2. Optionnel : définir `extra.eas.projectId` dans `app.json` (souvent fait par EAS).
3. Utiliser ce `projectId` dans `getExpoPushTokenAsync({ projectId })` (déjà prévu dans `pushNotifications.ts` via `expo-constants`).
4. Pour la prod : `eas build` pour Android et/ou iOS, puis distribuer les binaires ; les push fonctionneront avec les tokens enregistrés via `POST /devices/register`.

---

## 4. Variables d’environnement

- **API** : aucune variable supplémentaire pour les push (Expo Push API est publique pour l’envoi).
- **Mobile** : déjà documentées (`EXPO_PUBLIC_*`, etc.). Pour EAS, les secrets se gèrent avec `eas secret:create` si besoin.

---

## 5. Tester les push en dev

1. Démarrer l’API et l’app Expo.
2. Se connecter (magic link) et passer l’onboarding.
3. Accepter les permissions de notification ; le token est enregistré automatiquement.
4. En tant que driver, faire passer une expédition à « Enlevé » ou « Livré » : le shipper reçoit la notification in-app (table `notifications`) et, si son token est enregistré, un push sur l’appareil (Expo Go ou build).

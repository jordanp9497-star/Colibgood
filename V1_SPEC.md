# Colib — Spec V1 “utilisable” (anti vitrine)

## But V1 (définition de “utilisable”)

- **Deux parcours bout‑en‑bout** qui aboutissent à une action réelle en base :
  - **Expéditeur (shipper)** : créer une annonce → recevoir des propositions → accepter 1 proposition → suivre la livraison → clôturer (livré / annulé).
  - **Transporteur (driver)** : publier un trajet → voir des annonces actives → proposer → gérer une expédition → pousser les statuts jusqu’à “livré”.
- **Backend fiable** : auth obligatoire, validation, erreurs JSON cohérentes, transitions de statuts contrôlées.
- **Mobile actionnable** : chaque écran clé a une action principale + états (loading/empty/error) propres.

---

## Sources de vérité (V1)

Pour la V1, on standardise sur **le modèle “marketplace”** :

- **API Express** : `Colib/api` (endpoints `/listings`, `/trips`, `/proposals`, `/shipments`, `/notifications`)
- **Tables core** (Supabase migrations) : `profiles`, `listings`, `trips`, `proposals`, `shipments`, `shipment_events`, `proofs`, `notifications`
  - Voir `Colib/supabase/migrations/20250205000000_create_core_tables_and_rls.sql`

Objectif : **éviter les doubles flux** où le mobile écrit directement dans d’autres tables (`owner_id/from_place/...`).

---

## Modèle d’états V1 (statuts & transitions)

### `shipments.status` (déjà cadré)

Valeurs : `created | pickup_scheduled | picked_up | in_transit | delivered | disputed | cancelled`

Transitions autorisées (driver) :

- `created` → `pickup_scheduled` | `cancelled`
- `pickup_scheduled` → `picked_up` | `cancelled`
- `picked_up` → `in_transit` | `cancelled`
- `in_transit` → `delivered` | `cancelled`

À chaque action critique : insert `shipment_events` (`type`, `payload`).

### `proposals.status` (déjà cadré)

Valeurs : `pending | accepted | rejected | expired | cancelled`

Règles :

- Une proposition **ne peut être acceptée** que si `pending`.
- L’acceptation entraîne :
  - création du `shipment`
  - passage de la proposal à `accepted`
  - passage des autres proposals du même listing à `rejected`

### `listings.status` (V1)

V1 standard : `active | matched | cancelled | delivered`

Règles :

- **Création listing** : `active`
- **Acceptation d’une proposal** : `active` → `matched` (plus visible dans le feed driver)
- **Shipment livré** : listing → `delivered`
- **Annulation** : listing → `cancelled` (et expédition → `cancelled` si elle existe)

---

## Écrans V1 (10–12 max) + action principale

### Auth & setup

1) **Login** (`/(auth)/login`)
- Action : se connecter (Supabase Auth)

2) **Onboarding rôle** (`/(auth)/onboarding`)
- Action : choisir `shipper` ou `driver` (profil)

### Shipper

3) **Mes annonces** (`/listings`)
- Action : **Créer une annonce**

4) **Créer annonce** (`/listings/create`)
- Action : **Publier** (POST `/listings`)

5) **Détail annonce** (`/listings/[id]`)
- Action : voir propositions / statut / actions (selon statut)

6) **Propositions reçues** (`/profile/proposals-inbox`)
- Action : **Accepter** / Refuser une proposition (POST `/proposals/:id/accept|reject`)

7) **Mes expéditions** (`/shipments`)
- Action : ouvrir une expédition

8) **Détail expédition** (`/shipments/[id]`)
- Action (shipper) : suivre timeline (`GET /shipments/:id/events`)

### Driver

9) **Mes trajets** (`/trips`)
- Action : **Publier un trajet** (POST `/trips`)

10) **Publier trajet** (`/publish/trip` ou `/trips/create`)
- Action : **Publier** (POST `/trips`)

11) **Feed annonces** (driver) (`/listings` en mode feed)
- Action : ouvrir une annonce et **Proposer**

12) **Faire une proposition** (`/listings/[id]/propose`)
- Action : **Envoyer la proposition** (POST `/proposals`)

### Notifications (optionnel V1 si déjà présent)

13) **Notifications** (`/notifications` ou section profil)
- Action : ouvrir, marquer lu (si implémenté)

---

## Endpoints requis V1 (contrats)

- Listings
  - GET `/listings` (shipper)
  - GET `/listings/feed` (driver)
  - GET `/listings/:id`
  - POST `/listings`
- Trips
  - GET `/trips`
  - POST `/trips`
- Proposals
  - GET `/proposals` (inbox shipper + historique driver)
  - POST `/proposals`
  - POST `/proposals/:id/accept`
  - POST `/proposals/:id/reject`
- Shipments
  - GET `/shipments`
  - GET `/shipments/:id`
  - GET `/shipments/:id/events`
  - POST `/shipments/:id/status`
- Devices/Notifications (si push)
  - POST `/devices/register`
  - GET `/notifications`

---

## Scénarios de test manuels (V1)

### Scénario 1 — Shipper : créer un listing

- Login shipper → `Mes annonces` → `Créer une annonce`
- Remplir titre + villes → Publier
- Attendu : listing créé, visible dans la liste shipper, status `active`

### Scénario 2 — Driver : proposer sur un listing

- Login driver → feed annonces → ouvrir une annonce → “Faire une proposition”
- Envoyer prix + message
- Attendu : proposal créée status `pending`, visible côté driver (historique) et shipper (inbox)

### Scénario 3 — Shipper : accepter une proposal

- Login shipper → “Propositions reçues” → accepter
- Attendu :
  - création shipment status `created`
  - proposal acceptée
  - autres proposals listing rejetées
  - listing passe `matched`

### Scénario 4 — Driver : avancer les statuts shipment

- Login driver → “Mes expéditions” → ouvrir expédition
- Passer successivement `pickup_scheduled` → `picked_up` → `in_transit` → `delivered`
- Attendu : transitions autorisées, events créés, shipper notifié (in‑app/push si activé)

### Scénario 5 — Erreurs utiles (réseau + règles)

- API offline : une action affiche un message clair + bouton “Réessayer”
- Transition interdite (ex. `created` → `delivered`) : erreur 400 lisible, pas de crash


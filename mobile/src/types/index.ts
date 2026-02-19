// Search flow
export interface SearchRequest {
  from: string;
  to: string;
  datetime: string; // ISO
}

/** Trajet affiché dans les résultats (avec place restante) */
export interface TripSearchResult {
  id: string;
  from: string;
  to: string;
  datetime: string;
  placesLeft: number;
  priceBaseEur?: number;
}

/** Taille de colis (style Vinted) + option spécial */
export type ColisSize = "petit" | "moyen" | "gros" | "special";

export interface PackageDraft {
  length: number; // cm
  width: number;
  height: number;
  weight: number; // kg
  content: string;
}

export interface SearchProposal {
  id: string;
  owner_id: string;
  from: string;
  to: string;
  datetime: string;
  package: PackageDraft;
  price: number; // cents
  status: "draft" | "sent" | "accepted" | "rejected";
  created_at: string;
}

// Publish flow
export type VehicleType = "voiture" | "van" | "utilitaire" | "camionnette";
export type CapacitySize = "petit" | "moyen" | "grand";

export interface PublishedTrip {
  id: string;
  owner_id: string;
  from: string;
  to: string;
  datetime: string;
  vehicle_type: VehicleType;
  capacity?: CapacitySize;
  status: "published" | "closed" | "cancelled";
  created_at: string;
}

export interface PublishedPackageListing {
  id: string;
  owner_id: string;
  from: string;
  to: string;
  deadline: string; // date limite transport
  length: number;
  width: number;
  height: number;
  weight: number;
  content: string;
  description?: string;
  image_url?: string;
  status: "published" | "taken" | "cancelled";
  created_at: string;
}

// -----------------------------------------------------------------------------
// Marketplace (API) flow (V1)
// -----------------------------------------------------------------------------

export interface Listing {
  id: string;
  shipper_id: string;
  title: string;
  description: string | null;
  origin_city: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_city: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  pickup_date: string | null;
  delivery_deadline: string | null;
  weight_kg: number | null;
  size_category: string | null;
  price_cents: number | null;
  status: string;
  created_at: string;
}

export type ProposalStatus = "pending" | "accepted" | "rejected" | "expired" | "cancelled";

export interface Proposal {
  id: string;
  listing_id: string;
  trip_id: string | null;
  driver_id: string;
  shipper_id: string;
  price_cents: number | null;
  message: string | null;
  status: ProposalStatus;
  created_at: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  origin_city: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_city: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  depart_datetime: string | null;
  arrive_datetime: string | null;
  capacity_kg: number | null;
  notes: string | null;
  created_at: string;
}

export type ShipmentStatus =
  | "created"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "disputed"
  | "cancelled";

export interface Shipment {
  id: string;
  listing_id: string;
  driver_id: string;
  shipper_id: string;
  status: ShipmentStatus;
  pickup_code: string | null;
  created_at: string;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  actor_id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// Messages MVP
export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  lastAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  created_at: string;
}

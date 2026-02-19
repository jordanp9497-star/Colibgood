import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/contexts/AuthContext";
import { listMyTrips, listTrips } from "@/services/trips";
import { listMyPackages, listPackages } from "@/services/packages";
import { listTripLocations, upsertTripLocation } from "@/services/tripLocations";
import { geocodeAddress } from "@/lib/geocode";
import type { PublishedPackageListing, PublishedTrip } from "@/types";
import { colors, spacing, typography } from "@/theme";

const DEFAULT_REGION = {
  latitude: 46.6,
  longitude: 2.4,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

type Point = { lat: number; lng: number; label?: string };
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
const MATCH_RADIUS_KM = 30;
const TAB_WIDTH = 96;
const TAB_GAP = spacing.sm;

type MatchedPackage = {
  id: string;
  owner_id: string;
  from: string;
  to: string;
  etaMin: number | null;
  etaLabel: string;
  point: Point;
  description?: string;
};

type MatchedTrip = {
  id: string;
  owner_id: string;
  from: string;
  to: string;
  datetime: string;
  etaMin: number | null;
  etaLabel: string;
  mapPoint: Point;
};

function computeRegion(points: Point[]) {
  if (points.length === 0) return DEFAULT_REGION;
  const latMin = Math.min(...points.map((p) => p.lat));
  const latMax = Math.max(...points.map((p) => p.lat));
  const lngMin = Math.min(...points.map((p) => p.lng));
  const lngMax = Math.max(...points.map((p) => p.lng));
  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lngMin + lngMax) / 2,
    latitudeDelta: Math.max(0.5, (latMax - latMin) * 1.5),
    longitudeDelta: Math.max(0.5, (lngMax - lngMin) * 1.5),
  };
}

function estimateMinutesAlongRoute(routeLine: Point[], target: Point, totalDurationSec: number) {
  if (routeLine.length < 2 || !totalDurationSec) return null;
  let closestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < routeLine.length; i += 1) {
    const r = routeLine[i];
    const d = (r.lat - target.lat) ** 2 + (r.lng - target.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      closestIndex = i;
    }
  }
  let total = 0;
  for (let i = 1; i < routeLine.length; i += 1) {
    const a = routeLine[i - 1];
    const b = routeLine[i];
    total += Math.hypot(b.lat - a.lat, b.lng - a.lng);
  }
  if (total === 0) return null;
  let partial = 0;
  for (let i = 1; i <= closestIndex; i += 1) {
    const a = routeLine[i - 1];
    const b = routeLine[i];
    partial += Math.hypot(b.lat - a.lat, b.lng - a.lng);
  }
  const ratio = Math.min(1, Math.max(0, partial / total));
  return Math.round((totalDurationSec * ratio) / 60);
}

function haversineKm(a: Point, b: Point) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceToRouteKm(point: Point, routeLine: Point[]) {
  if (routeLine.length === 0) return Infinity;
  let best = Infinity;
  const step = Math.max(1, Math.floor(routeLine.length / 80));
  for (let i = 0; i < routeLine.length; i += step) {
    const d = haversineKm(point, routeLine[i]);
    if (d < best) best = d;
  }
  return best;
}

function formatEtaLabel(startIso: string, etaMin: number | null) {
  if (etaMin == null) return "";
  try {
    const date = new Date(startIso);
    date.setMinutes(date.getMinutes() + etaMin);
    const time = date.toLocaleTimeString("fr-FR", { timeStyle: "short" });
    return `~${time}`;
  } catch {
    return "";
  }
}

function pointAtRatio(routeLine: Point[], ratio: number) {
  if (routeLine.length === 0) return null;
  const index = Math.min(routeLine.length - 1, Math.max(0, Math.floor(routeLine.length * ratio)));
  return routeLine[index];
}

function snapToRoute(point: Point, routeLine: Point[]) {
  if (routeLine.length === 0) return point;
  let best = routeLine[0];
  let bestDist = Infinity;
  for (const r of routeLine) {
    const d = (r.lat - point.lat) ** 2 + (r.lng - point.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

export default function MapScreen() {
  const { userId } = useAuth();
  const [trips, setTrips] = useState<PublishedTrip[]>([]);
  const [route, setRoute] = useState<Point[]>([]);
  const [routeLine, setRouteLine] = useState<Point[]>([]);
  const [routeDurationSec, setRouteDurationSec] = useState(0);
  const [colisPoints, setColisPoints] = useState<Point[]>([]);
  const [matchedPackages, setMatchedPackages] = useState<MatchedPackage[]>([]);
  const [matchedTrips, setMatchedTrips] = useState<MatchedTrip[]>([]);
  const [packagePoint, setPackagePoint] = useState<Point | null>(null);
  const [tripLocations, setTripLocations] = useState<Record<string, Point>>({});
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [listTab, setListTab] = useState<"packages" | "trips">("packages");
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [tripsRes, packagesRes] = await Promise.all([listMyTrips(userId), listMyPackages(userId)]);
      const myTrips = tripsRes.data ?? [];
      const myPackages = packagesRes.data ?? [];
      setTrips(myTrips);
      setMatchedPackages([]);
      setMatchedTrips([]);
      setPackagePoint(null);

      if (myTrips.length > 0) {
        setListTab("packages");
        const trip = myTrips[0];
        const fromCoords = await geocodeAddress(trip.from);
        const toCoords = await geocodeAddress(trip.to);

        let routeLinePoints: Point[] = [];
        if (fromCoords && toCoords) {
          const points: Point[] = [
            { ...fromCoords, label: trip.from },
            { ...toCoords, label: trip.to },
          ];
          setRoute(points);

          try {
            const url = `${OSRM_URL}/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const json = await res.json();
            const coords = json?.routes?.[0]?.geometry?.coordinates ?? [];
            const duration = json?.routes?.[0]?.duration ?? 0;
            routeLinePoints = coords.map((c: [number, number]) => ({ lng: c[0], lat: c[1] }));
            setRouteLine(routeLinePoints);
            setRouteDurationSec(duration);
          } catch {
            setRouteLine([]);
            setRouteDurationSec(0);
          }

          const regionPoints = routeLinePoints.length > 1 ? routeLinePoints : points;
          setRegion(computeRegion(regionPoints));
        } else {
          setRoute([]);
          setRouteLine([]);
          setRouteDurationSec(0);
        }

        const { data: allPackages } = await listPackages();
        const matched: MatchedPackage[] = [];
        for (const pkg of (allPackages ?? []).filter((p) => p.owner_id !== userId).slice(0, 20)) {
          const fromCoords = await geocodeAddress(pkg.from);
          const toCoords = await geocodeAddress(pkg.to);
          if (!fromCoords || !toCoords) continue;
          if (routeLinePoints.length === 0) continue;
          const distanceFromKm = distanceToRouteKm(fromCoords, routeLinePoints);
          const distanceToKm = distanceToRouteKm(toCoords, routeLinePoints);
          if (distanceFromKm > MATCH_RADIUS_KM || distanceToKm > MATCH_RADIUS_KM) continue;
          const snapped = snapToRoute(fromCoords, routeLinePoints);
          const etaMin = estimateMinutesAlongRoute(routeLinePoints, snapped, routeDurationSec);
          matched.push({
            id: pkg.id,
            owner_id: pkg.owner_id,
            from: pkg.from,
            to: pkg.to,
            etaMin,
            etaLabel: formatEtaLabel(trip.datetime, etaMin),
            point: snapped,
            description: pkg.description,
          });
        }

        const fromIsParis = trip.from.toLowerCase().includes("paris");
        const toIsLimoges = trip.to.toLowerCase().includes("limoges");
        if (matched.length === 0 && fromIsParis && toIsLimoges && routeLinePoints.length > 0) {
          const mockPoints = [
            pointAtRatio(routeLinePoints, 0.25),
            pointAtRatio(routeLinePoints, 0.5),
            pointAtRatio(routeLinePoints, 0.75),
          ].filter(Boolean) as Point[];
          const mockPackages: MatchedPackage[] = mockPoints.map((p, idx) => {
            const etaMin = estimateMinutesAlongRoute(routeLinePoints, p, routeDurationSec);
            return {
              id: `mock-${idx}`,
              owner_id: "demo",
              from: "Paris",
              to: "Limoges",
              etaMin,
              etaLabel: formatEtaLabel(trip.datetime, etaMin),
              point: p,
              description: "Colis test (démo)",
            };
          });
          matched.push(...mockPackages);
        }
        setMatchedPackages(matched);
        setColisPoints(
          matched.map((m) => ({
            ...m.point,
            label: `Colis: ${m.from} → ${m.to}${m.etaMin != null ? ` · ${m.etaLabel}` : ""}`,
          }))
        );
        setMatchedTrips([]);
        setTripLocations({});
      } else if (myPackages.length > 0) {
        setListTab("trips");
        const pkg = myPackages[0];
        const pkgCoords = await geocodeAddress(pkg.from);
        const pkgToCoords = await geocodeAddress(pkg.to);
        if (pkgCoords) setPackagePoint({ ...pkgCoords, label: pkg.from });

        const { data: allTrips } = await listTrips();
        const matched: MatchedTrip[] = [];
        for (const t of (allTrips ?? []).filter((t) => t.owner_id !== userId).slice(0, 12)) {
          const fromCoords = await geocodeAddress(t.from);
          const toCoords = await geocodeAddress(t.to);
          if (!fromCoords || !toCoords || !pkgCoords || !pkgToCoords) continue;
          try {
            const url = `${OSRM_URL}/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const json = await res.json();
            const coords = json?.routes?.[0]?.geometry?.coordinates ?? [];
            const duration = json?.routes?.[0]?.duration ?? 0;
            const routeLinePoints = coords.map((c: [number, number]) => ({ lng: c[0], lat: c[1] }));
            const distanceFromKm = distanceToRouteKm(pkgCoords, routeLinePoints);
            const distanceToKm = distanceToRouteKm(pkgToCoords, routeLinePoints);
            if (distanceFromKm > MATCH_RADIUS_KM || distanceToKm > MATCH_RADIUS_KM) continue;
            const etaMin = estimateMinutesAlongRoute(routeLinePoints, pkgCoords, duration);
            const mid =
              routeLinePoints.length > 0
                ? routeLinePoints[Math.floor(routeLinePoints.length / 2)]
                : { lat: (fromCoords.lat + toCoords.lat) / 2, lng: (fromCoords.lng + toCoords.lng) / 2 };
            matched.push({
              id: t.id,
              owner_id: t.owner_id,
              from: t.from,
              to: t.to,
              datetime: t.datetime,
              etaMin,
              etaLabel: formatEtaLabel(t.datetime, etaMin),
              mapPoint: mid,
            });
          } catch {
            continue;
          }
        }
        setMatchedTrips(matched);
        const tripIds = matched.map((t) => t.id);
        const { data: locations } = await listTripLocations(tripIds);
        const map: Record<string, Point> = {};
        for (const loc of locations) {
          map[loc.trip_id] = { lat: loc.lat, lng: loc.lng };
        }
        setTripLocations(map);
        const regionPoints = [pkgCoords, ...matched.map((m) => m.mapPoint)].filter(Boolean) as Point[];
        if (regionPoints.length > 0) setRegion(computeRegion(regionPoints));
        setRoute([]);
        setRouteLine([]);
        setRouteDurationSec(0);
        setColisPoints([]);
      } else {
        setRoute([]);
        setRouteLine([]);
        setRouteDurationSec(0);
        setColisPoints([]);
        setTripLocations({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement carte");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      if (!userId || trips.length === 0) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 15000 },
        async (loc) => {
          if (cancelled) return;
          const tripId = trips[0]?.id;
          if (!tripId) return;
          await upsertTripLocation(tripId, userId, loc.coords.latitude, loc.coords.longitude);
        }
      );
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [userId, trips]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.hint}>Chargement de la carte…</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </Screen>
    );
  }

  const routeCoords = (routeLine.length > 1 ? routeLine : route).map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }));
  const showEmptyHint = trips.length === 0 && !packagePoint;

  const renderPackage = ({ item }: { item: MatchedPackage }) => (
    <View style={styles.listCard}>
      <Text style={styles.listTitle}>{item.from} → {item.to}</Text>
      <Text style={styles.listMeta}>
        {item.etaLabel ? `Passage ${item.etaLabel}` : "ETA indisponible"} ·
        {` `}Utilisateur {item.owner_id.slice(0, 6)}
      </Text>
      {item.description ? <Text style={styles.listDesc}>{item.description}</Text> : null}
      <Pressable
        onPress={() => Alert.alert("Réservation", "Réservation à implémenter (démo).")}
        style={({ pressed }) => [styles.reserveBtn, pressed && styles.reserveBtnPressed]}
      >
        <Text style={styles.reserveText}>Réserver</Text>
      </Pressable>
    </View>
  );

  const renderTrip = ({ item }: { item: MatchedTrip }) => (
    <View style={styles.listCard}>
      <Text style={styles.listTitle}>{item.from} → {item.to}</Text>
      <Text style={styles.listMeta}>
        {item.etaLabel ? `Passage ${item.etaLabel}` : "ETA indisponible"} ·
        {` `}Utilisateur {item.owner_id.slice(0, 6)}
      </Text>
      <Text style={styles.listDesc}>
        Départ {new Date(item.datetime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
      </Text>
    </View>
  );

  return (
    <Screen style={styles.screen} noPadding>
      <View style={styles.topTabs}>
        <View
          style={[
            styles.tabIndicator,
            { transform: [{ translateX: viewMode === "map" ? 0 : TAB_WIDTH + TAB_GAP }] },
          ]}
        />
        <Pressable
          onPress={() => setViewMode("map")}
          style={({ pressed }) => [
            styles.tabButton,
            viewMode === "map" && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Text style={[styles.tabText, viewMode === "map" && styles.tabTextActive]}>Carte</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode("list")}
          style={({ pressed }) => [
            styles.tabButton,
            viewMode === "list" && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
        >
          <Text style={[styles.tabText, viewMode === "list" && styles.tabTextActive]}>Liste</Text>
        </Pressable>
      </View>

      {viewMode === "map" ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={region}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {route.length >= 2 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            )}
            {route.map((p, i) => (
              <Marker
                key={`route-${i}`}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title={i === 0 ? "Départ" : "Arrivée"}
                description={p.label}
                pinColor={i === 0 ? colors.primary : colors.success}
              />
            ))}
            {colisPoints.map((p, i) => (
              <Marker
                key={`colis-${i}`}
                coordinate={{ latitude: p.lat, longitude: p.lng }}
                title="Colis"
                description={p.label}
                pinColor={colors.warning}
              />
            ))}
            {packagePoint ? (
              <Marker
                coordinate={{ latitude: packagePoint.lat, longitude: packagePoint.lng }}
                title="Votre colis"
                description={packagePoint.label}
                pinColor={colors.primary}
              />
            ) : null}
            {matchedTrips.map((t) => (
              <Marker
                key={`trip-${t.id}`}
                coordinate={{ latitude: t.mapPoint.lat, longitude: t.mapPoint.lng }}
                title={`Trajet ${t.from} → ${t.to}`}
                description={`${t.etaLabel ? `Passage ${t.etaLabel}` : "Passage estimé indisponible"} · Utilisateur ${t.owner_id.slice(0, 6)}`}
                pinColor={colors.success}
              />
            ))}
            {matchedTrips.map((t) =>
              tripLocations[t.id] ? (
                <Marker
                  key={`trip-live-${t.id}`}
                  coordinate={{
                    latitude: tripLocations[t.id].lat,
                    longitude: tripLocations[t.id].lng,
                  }}
                  title="Transporteur en temps réel"
                  description={`Trajet ${t.from} → ${t.to}`}
                  pinColor={colors.primary}
                />
              ) : null
            )}
          </MapView>
          {showEmptyHint ? (
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyTitle}>Aucune publication</Text>
              <Text style={styles.emptySubtitle}>
                Publiez un trajet ou un colis pour afficher les matchs pertinents.
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.subTabs}>
            <View
              style={[
                styles.subTabIndicator,
                { transform: [{ translateX: listTab === "packages" ? 0 : TAB_WIDTH + TAB_GAP }] },
              ]}
            />
            <Pressable
              onPress={() => setListTab("packages")}
              style={({ pressed }) => [
                styles.subTabButton,
                listTab === "packages" && styles.subTabButtonActive,
                pressed && styles.tabButtonPressed,
              ]}
            >
              <Text style={[styles.subTabText, listTab === "packages" && styles.subTabTextActive]}>Colis</Text>
            </Pressable>
            <Pressable
              onPress={() => setListTab("trips")}
              style={({ pressed }) => [
                styles.subTabButton,
                listTab === "trips" && styles.subTabButtonActive,
                pressed && styles.tabButtonPressed,
              ]}
            >
              <Text style={[styles.subTabText, listTab === "trips" && styles.subTabTextActive]}>Trajets</Text>
            </Pressable>
          </View>
          {listTab === "packages" ? (
            <FlatList
              data={matchedPackages}
              keyExtractor={(item) => item.id}
              renderItem={renderPackage}
              ListEmptyComponent={<Text style={styles.emptyList}>Aucun colis pertinent</Text>}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <FlatList
              data={matchedTrips}
              keyExtractor={(item) => item.id}
              renderItem={renderTrip}
              ListEmptyComponent={<Text style={styles.emptyList}>Aucun trajet pertinent</Text>}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  map: { flex: 1, width: "100%", height: "100%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  hint: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.md },
  error: { ...typography.body, color: colors.destructive },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  topTabs: {
    position: "absolute",
    top: spacing.md,
    alignSelf: "center",
    zIndex: 10,
    flexDirection: "row",
    gap: TAB_GAP,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  tabButton: { width: TAB_WIDTH, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.primary },
  tabButtonPressed: { opacity: 0.85 },
  tabText: { ...typography.footnote, color: colors.textSecondary },
  tabTextActive: { color: "#fff" },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: TAB_WIDTH,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  listContainer: { flex: 1, paddingTop: spacing.xxl },
  subTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: TAB_GAP,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    position: "relative",
  },
  subTabButton: { width: TAB_WIDTH, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  subTabButtonActive: { backgroundColor: colors.surfaceElevated },
  subTabText: { ...typography.footnote, color: colors.textSecondary },
  subTabTextActive: { color: colors.text },
  subTabIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listTitle: { ...typography.headline, color: colors.text },
  listMeta: { ...typography.footnote, color: colors.textSecondary, marginTop: spacing.xs },
  listDesc: { ...typography.caption1, color: colors.textTertiary, marginTop: spacing.xs },
  reserveBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  reserveBtnPressed: { opacity: 0.85 },
  reserveText: { ...typography.footnote, color: "#fff" },
  emptyList: { ...typography.subhead, color: colors.textSecondary, textAlign: "center", marginTop: spacing.lg },
  emptyOverlay: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.footnote, color: colors.textSecondary },
});

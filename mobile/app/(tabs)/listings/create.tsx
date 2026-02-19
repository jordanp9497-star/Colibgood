import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useCreateListing } from "@/hooks/useListings";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function CreateListingScreen() {
  const router = useRouter();
  const create = useCreateListing();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [originLat, setOriginLat] = useState("");
  const [originLng, setOriginLng] = useState("");
  const [destinationLat, setDestinationLat] = useState("");
  const [destinationLng, setDestinationLng] = useState("");
  const [weight, setWeight] = useState("");
  const [priceCents, setPriceCents] = useState("");

  async function submit() {
    if (!title.trim()) {
      Alert.alert("Erreur", "Le titre est requis");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      origin_city: originCity.trim() || undefined,
      destination_city: destinationCity.trim() || undefined,
      origin_lat: originLat ? parseFloat(originLat) : undefined,
      origin_lng: originLng ? parseFloat(originLng) : undefined,
      destination_lat: destinationLat ? parseFloat(destinationLat) : undefined,
      destination_lng: destinationLng ? parseFloat(destinationLng) : undefined,
      weight_kg: weight ? parseFloat(weight) : undefined,
      price_cents: priceCents ? Math.round(parseFloat(priceCents) * 100) : undefined,
    };
    try {
      await create.mutateAsync(payload);
      router.back();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Création impossible");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Nouvelle annonce</Text>
        <Input placeholder="Titre *" value={title} onChangeText={setTitle} />
        <Input placeholder="Description" value={description} onChangeText={setDescription} multiline />
        <Input placeholder="Ville de départ" value={originCity} onChangeText={setOriginCity} />
        <Input placeholder="Ville d'arrivée" value={destinationCity} onChangeText={setDestinationCity} />
        <Text style={styles.hint}>Coordonnées destination (optionnel, pour afficher le colis sur la carte)</Text>
        <Input placeholder="Lat. arrivée (ex: 43.30)" value={destinationLat} onChangeText={setDestinationLat} keyboardType="decimal-pad" />
        <Input placeholder="Long. arrivée (ex: 5.37)" value={destinationLng} onChangeText={setDestinationLng} keyboardType="decimal-pad" />
        <Input placeholder="Poids (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <Input placeholder="Prix (€)" value={priceCents} onChangeText={setPriceCents} keyboardType="decimal-pad" />
        <Button
          title={create.isPending ? "Création…" : "Créer l'annonce"}
          onPress={submit}
          disabled={create.isPending}
          containerStyle={{ marginTop: 8 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#fafafa", marginBottom: 20 },
  hint: { fontSize: 13, color: "#71717a", marginBottom: 8 },
});

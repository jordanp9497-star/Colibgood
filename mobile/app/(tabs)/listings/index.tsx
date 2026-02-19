import { useState } from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useListings } from "@/hooks/useListings";
import { useListingsFeed } from "@/hooks/useListings";
import { Screen } from "@/components/ui/Screen";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/Button";

export default function ListingsTabScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const isShipper = profile?.role === "shipper";

  const myListings = useListings({ status: "active", limit: 50 });
  const feed = useListingsFeed({ status: "active", limit: 50 });

  const isLoading = isShipper ? myListings.isLoading : feed.isLoading;
  const error = isShipper ? myListings.error : feed.error;
  const listings = isShipper ? myListings.data?.data ?? [] : feed.data ?? [];

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Screen>
        <EmptyState title="Erreur" subtitle={error.message} />
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{isShipper ? "Mes annonces" : "Annonces disponibles"}</Text>
            {isShipper && (
              <Button
                title="Créer une annonce"
                onPress={() => router.push("/listings/create")}
                containerStyle={styles.createBtn}
              />
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title={isShipper ? "Aucune annonce" : "Aucune annonce disponible"}
            subtitle={isShipper ? "Créez votre première annonce" : undefined}
          />
        }
        renderItem={({ item }) => <ListingCard listing={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#fafafa", marginBottom: 16 },
  createBtn: { marginBottom: 16 },
});

import { Stack } from "expo-router";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SearchRequest, TripSearchResult } from "@/types";

type SearchFlowContextValue = {
  searchRequest: SearchRequest | null;
  setSearchRequest: (r: SearchRequest) => void;
  clearSearchRequest: () => void;
  selectedTrip: TripSearchResult | null;
  setSelectedTrip: (t: TripSearchResult | null) => void;
};

const SearchFlowContext = createContext<SearchFlowContextValue | null>(null);

export function useSearchFlow() {
  const ctx = useContext(SearchFlowContext);
  if (!ctx) throw new Error("useSearchFlow must be used within SearchFlowProvider");
  return ctx;
}

export function SearchFlowProvider({ children }: { children: ReactNode }) {
  const [searchRequest, setState] = useState<SearchRequest | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripSearchResult | null>(null);
  const setSearchRequest = useCallback((r: SearchRequest) => setState(r), []);
  const clearSearchRequest = useCallback(() => {
    setState(null);
    setSelectedTrip(null);
  }, []);
  return (
    <SearchFlowContext.Provider
      value={{ searchRequest, setSearchRequest, clearSearchRequest, selectedTrip, setSelectedTrip }}
    >
      {children}
    </SearchFlowContext.Provider>
  );
}

export default function SearchLayout() {
  return (
    <SearchFlowProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: "Retour",
          headerTintColor: "#0a84ff",
          headerStyle: { backgroundColor: "#1c1c1e" },
          headerTitleStyle: { color: "#fafafa", fontSize: 17 },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Recherche", headerShown: true }} />
        <Stack.Screen name="results" options={{ title: "Trajets trouvés" }} />
        <Stack.Screen name="reserve" options={{ title: "Réserver une place" }} />
        <Stack.Screen name="colis" options={{ title: "Colis et acompte" }} />
      </Stack>
    </SearchFlowProvider>
  );
}

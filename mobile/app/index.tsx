import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/Loader";

export default function Index() {
  const { isLoading, userId, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!userId) {
      router.replace("/(auth)/login");
      return;
    }
    if (!profile) {
      router.replace("/(auth)/onboarding");
      return;
    }
    router.replace("/(tabs)/listings");
  }, [isLoading, userId, profile, router]);

  return <Loader />;
}

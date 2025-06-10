import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ChapterIndex() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  useEffect(() => {
    router.push(`/admin/chapters/${id}/(tabs)/general`);
  }, []);

  return null;
}

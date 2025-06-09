import { eventApi } from "@/api";
import EventItem from "@/components/EventItem";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text } from "react-native";

interface EventType {
  _id: string;
  title: string;
  startedAt: string;
  location: string;
  status: string;
  scale: string;
}

const ListEvent = () => {
  const params = useLocalSearchParams();
  const chapterId = params.id as string;
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm chuẩn hóa thời gian thành YYYY-MM-DD HH:mm:ss
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventApi.getEvents({ scope: "chapter", chapterId });
        const eventsData = res.data.data.docs || res.data.data || [];
        // Debug log
        console.log("[DEBUG] chapterId param:", chapterId);
        eventsData.forEach((event: any) => {
          console.log("[DEBUG] event.chapterId:", event.chapterId);
        });
        const filteredEvents = eventsData.filter((event: any) => {
          let eventChapterId = "";
          if (typeof event.chapterId === "string") {
            eventChapterId = event.chapterId;
          } else if (event.chapterId?._id) {
            eventChapterId = event.chapterId._id;
          } else if (event.chapterId?.$oid) {
            eventChapterId = event.chapterId.$oid;
          }
          return eventChapterId === chapterId;
        });
        setEvents(
          filteredEvents.map((event: any) => {
            let startedAtValue = "";
            if (event.startedAt?.$date) {
              startedAtValue = event.startedAt.$date;
            } else if (typeof event.startedAt === "string") {
              startedAtValue = event.startedAt;
            } else if (event.startedAt) {
              startedAtValue = String(event.startedAt);
            }
            return {
              _id: event._id?.$oid || event._id || "",
              title: event.name,
              startedAt: startedAtValue ? formatDateTime(startedAtValue) : "",
              location: event.location,
              status: event.status,
              scale: event.scope === "chapter" ? "Chi đoàn" : event.scope,
            };
          })
        );
      } catch {
        setError("Không thể tải danh sách sự kiện");
      } finally {
        setLoading(false);
      }
    };
    if (chapterId) fetchEvents();
  }, [chapterId]);

  if (loading)
    return <ActivityIndicator className='mt-10' size='large' color='#3E4FF5' />;
  if (error)
    return <Text className='text-center text-red-500 mt-10'>{error}</Text>;

  return (
    <ScrollView className='flex-1 bg-white px-4 py-3'>
      {events.map((event) => (
        <EventItem
          key={event._id}
          title={event.title}
          time={event.startedAt}
          location={event.location}
          scale={event.scale}
          status={event.status}
        />
      ))}
    </ScrollView>
  );
};

export default ListEvent;

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../services/authStore";
import { adminService } from "../../services/adminService";
import { GlassmorphicCard } from "../../components/GlassmorphicUI";

export const CalendarScreen = () => {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [audience, setAudience] = useState("All");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const asyncEvents = await adminService.getCalendarEvents();
      setEvents(asyncEvents);
    } catch (error) {
      console.error("Error loading calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const publishEvent = async () => {
    if (!title || !date || !audience) return;

    try {
      await adminService.createCalendarEvent({
        title,
        event_date: date,
        audience,
        description,
      });
      setTitle("");
      setDate("");
      setAudience("All");
      setDescription("");
      await loadEvents();
    } catch (error) {
      console.error("Error publishing calendar event:", error);
    }
  };

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()),
    [events]
  );

  if (loading) {
    return (
      <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-white text-3xl font-bold mb-2">School Calendar</Text>
        <Text className="text-gray-400 mb-6">Community calendar for students, parents, teachers and staff.</Text>

        {user?.role === "admin" ? (
          <GlassmorphicCard className="mb-6">
            <Text className="text-white text-xl font-bold mb-3">Publish a Calendar Event</Text>
            <View className="space-y-4">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Event title"
                placeholderTextColor="#9ca3af"
                className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
              />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#9ca3af"
                className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
              />
              <TextInput
                value={audience}
                onChangeText={setAudience}
                placeholder="Audience"
                placeholderTextColor="#9ca3af"
                className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor="#9ca3af"
                className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
              />
              <TouchableOpacity onPress={publishEvent} className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-4 items-center">
                <Text className="text-white font-bold">Publish Event</Text>
              </TouchableOpacity>
            </View>
          </GlassmorphicCard>
        ) : null}

        <Text className="text-white text-2xl font-bold mb-4">Upcoming Events</Text>
        <FlatList
          data={sortedEvents}
          keyExtractor={(item) => item.event_id || item.id}
          renderItem={({ item }) => (
            <GlassmorphicCard className="mb-4">
              <Text className="text-white text-xl font-bold">{item.title}</Text>
              <Text className="text-gray-400 mt-2">{item.event_date} • {item.audience}</Text>
              <Text className="text-gray-300 mt-3">{item.description || 'No description provided.'}</Text>
            </GlassmorphicCard>
          )}
        />
      </ScrollView>
    </LinearGradient>
  );
};

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { communicationService } from "../../services/communicationService";
import { useAuthStore } from "../../services/authStore";
import { GlassmorphicCard, GlassmorphicButton } from "../../components/GlassmorphicUI";

export const ParentCommunicationScreen = ({ route }: any) => {
  const { teacherId } = route.params || {};
  const user = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && teacherId) {
      loadComments();
      subscribeToComments();
    }
  }, [user?.id, teacherId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await communicationService.getComments(user?.id || "", teacherId);
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToComments = () => {
    const subscription = communicationService.subscribeToComments(user?.id || "", teacherId, (newComment) => {
      setComments((prev) => [newComment, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      await communicationService.sendComment(user?.id || "", teacherId, message);
      setMessage("");
      await loadComments();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1">
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassmorphicCard className={`m-3 p-4 ${item.parent_id === user?.id ? "ml-8" : "mr-8"}`}>
            <Text className="text-white">{item.message}</Text>
            <Text className="text-gray-400 text-xs mt-2">{new Date(item.timestamp).toLocaleString()}</Text>
          </GlassmorphicCard>
        )}
        inverted
        ListHeaderComponent={
          <View className="p-4">
            <Text className="text-white text-2xl font-bold mb-4">Teacher Communication</Text>
          </View>
        }
        ListFooterComponent={
          <View className="p-4 border-t border-white/10">
            <View className="flex-row gap-2 items-center">
              <TextInput
                className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white"
                placeholder="Send a message..."
                value={message}
                onChangeText={setMessage}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={sendMessage}
                className="bg-purple-500 p-3 rounded-xl"
              >
                <Text className="text-white font-bold">Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </LinearGradient>
  );
};

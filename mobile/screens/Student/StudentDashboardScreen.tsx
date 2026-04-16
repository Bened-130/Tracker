import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { studentService } from "../../services/studentService";
import { useAuthStore } from "../../services/authStore";
import { GlassmorphicCard, StatCard } from "../../components/GlassmorphicUI";

export const StudentDashboardScreen = () => {
  const user = useAuthStore((state) => state.user);
  const [results, setResults] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("results");

  useEffect(() => {
    loadStudentData();
  }, [user?.id]);

  const loadStudentData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [resultsData, assignmentsData] = await Promise.all([
        studentService.getResults(user.id),
        studentService.getAssignments(user.id),
      ]);

      setResults(resultsData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudentData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  const data = activeTab === "results" ? results : assignments;

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) =>
          activeTab === "results" ? (
            <GlassmorphicCard className="m-3 p-4">
              <Text className="text-white font-bold text-lg">{item.subject}</Text>
              <Text className="text-gray-300 text-2xl font-bold mt-2">Grade: {item.grade}</Text>
            </GlassmorphicCard>
          ) : (
            <GlassmorphicCard className="m-3 p-4">
              <Text className="text-white font-bold text-lg">{item.title}</Text>
              <Text className="text-gray-400 text-sm mt-2">Due: {new Date(item.due_date).toLocaleDateString()}</Text>
            </GlassmorphicCard>
          )
        }
        ListHeaderComponent={
          <View className="p-4">
            <Text className="text-white text-3xl font-bold mb-6">My Academic Dashboard</Text>

            {/* Tab Navigation */}
            <View className="flex-row mb-6 gap-2">
              {["results", "assignments"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl ${activeTab === tab ? "bg-purple-500" : "bg-white/10 border border-white/20"}`}
                >
                  <Text className={`text-center font-bold ${activeTab === tab ? "text-white" : "text-gray-400"}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />
    </LinearGradient>
  );
};

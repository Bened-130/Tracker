import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Modal, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { teacherService } from "../../services/teacherService";
import { useAuthStore } from "../../services/authStore";
import { GlassmorphicCard, GlassmorphicButton } from "../../components/GlassmorphicUI";

export const TeacherAssignmentsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    classId: "",
  });

  useEffect(() => {
    loadAssignments();
  }, [user?.id]);

  const loadAssignments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await teacherService.getAssignments(user.id);
      setAssignments(data || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.dueDate || !formData.classId) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await teacherService.createAssignment(
        formData.classId,
        formData.title,
        formData.dueDate,
        "",
        user?.id || ""
      );
      setShowModal(false);
      setFormData({ title: "", dueDate: "", classId: "" });
      await loadAssignments();
    } catch (error) {
      alert("Error creating assignment");
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
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassmorphicCard className="m-3 p-4">
            <Text className="text-white font-bold text-lg">{item.title}</Text>
            <Text className="text-gray-400 text-sm mt-2">Due: {new Date(item.due_date).toLocaleDateString()}</Text>
            <Text className="text-gray-400 text-sm mt-1">Class: {item.classes?.name}</Text>
          </GlassmorphicCard>
        )}
        ListHeaderComponent={
          <View className="p-4">
            <Text className="text-white text-3xl font-bold mb-6">My Assignments</Text>
            <GlassmorphicButton title="Create New Assignment" onPress={() => setShowModal(true)} />
          </View>
        }
      />

      {/* Create Assignment Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 justify-end">
          <View className="bg-dark-800 p-6 rounded-t-3xl">
            <Text className="text-white text-2xl font-bold mb-4">New Assignment</Text>

            <TextInput
              className="bg-white/10 border border-white/20 rounded-xl p-4 text-white mb-4"
              placeholder="Title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              className="bg-white/10 border border-white/20 rounded-xl p-4 text-white mb-4"
              placeholder="Due Date (YYYY-MM-DD)"
              value={formData.dueDate}
              onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              className="bg-white/10 border border-white/20 rounded-xl p-4 text-white mb-6"
              placeholder="Class ID"
              value={formData.classId}
              onChangeText={(text) => setFormData({ ...formData, classId: text })}
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3"
              >
                <Text className="text-white text-center font-bold">Cancel</Text>
              </TouchableOpacity>
              <GlassmorphicButton title="Create" onPress={handleCreateAssignment} className="flex-1" />
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

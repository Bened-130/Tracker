import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FaceRecognitionComponent } from "../../components/FaceRecognitionComponent";
import { attendanceService } from "../../services/attendanceService";
import { useAuthStore } from "../../services/authStore";
import { GlassmorphicCard, GlassmorphicButton, StatCard } from "../../components/GlassmorphicUI";

export const StudentFaceAuthScreen = ({ navigation }: any) => {
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<any[]>([]);

  const handleFaceSuccess = async (faceDescriptor: any) => {
    if (faceDescriptor) {
      Alert.alert("Success", "Welcome back! Your attendance has been marked.");
      setShowCamera(false);
    }
  };

  if (showCamera && user?.id) {
    return (
      <FaceRecognitionComponent
        studentId={user.id}
        mode="verify"
        onSuccess={handleFaceSuccess}
        sessionId={sessions[0]?.id}
      />
    );
  }

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 p-4">
      <View className="flex-1 justify-center">
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">Welcome, {user?.name}</Text>
          <Text className="text-gray-400">Ready to check in?</Text>
        </View>

        {/* Face Recognition Card */}
        <GlassmorphicCard className="p-6 mb-6">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold mb-4">Facial Recognition Check-In</Text>
            <Text className="text-gray-300 text-center mb-6">
              Use your camera to verify your identity and mark attendance
            </Text>
            <GlassmorphicButton
              title="Start Face Verification"
              onPress={() => setShowCamera(true)}
              className="w-full"
            />
          </View>
        </GlassmorphicCard>

        {/* Quick Stats */}
        <StatCard
          title="Attendance Status"
          value="Present Today ✓"
          color="from-green-500 to-emerald-600"
        />
      </View>
    </LinearGradient>
  );
};

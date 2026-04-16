import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAuthStore } from "../services/authStore";
import { GlassmorphicButton } from "../components/GlassmorphicUI";
import { LinearGradient } from "expo-linear-gradient";

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert("Login Error", error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ justifyContent: "center", padding: 20 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-4xl font-bold mb-2">SchoolVibe</Text>
          <Text className="text-gray-400 text-lg">AI Attendance Tracker</Text>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-white mb-2 font-semibold">Email</Text>
          <TextInput
            className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-500"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-white mb-2 font-semibold">Password</Text>
          <TextInput
            className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-500"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Login Button */}
        <GlassmorphicButton title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text className="text-purple-400 font-bold">Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

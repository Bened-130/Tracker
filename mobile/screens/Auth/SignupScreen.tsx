import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Picker } from "react-native";
import { useAuthStore } from "../services/authStore";
import { GlassmorphicButton } from "../components/GlassmorphicUI";
import { LinearGradient } from "expo-linear-gradient";

const ROLES = ["student", "parent", "teacher"];

export const SignupScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, role, name);
      Alert.alert("Success", "Account created! Please check your email to verify.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Signup Error", error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1">
      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingVertical: 40 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">Create Account</Text>
          <Text className="text-gray-400">Join SchoolVibe Tracker</Text>
        </View>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-white mb-2 font-semibold">Full Name</Text>
          <TextInput
            className="bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-gray-500"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            editable={!loading}
            placeholderTextColor="#9ca3af"
          />
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
        <View className="mb-4">
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

        {/* Role Selection */}
        <View className="mb-6">
          <Text className="text-white mb-2 font-semibold">Role</Text>
          <View className="bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={{ color: "white" }}
            >
              {ROLES.map((r) => (
                <Picker.Item key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} value={r} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Signup Button */}
        <GlassmorphicButton title={loading ? "Creating..." : "Create Account"} onPress={handleSignup} disabled={loading} />

        {/* Login Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="text-purple-400 font-bold">Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

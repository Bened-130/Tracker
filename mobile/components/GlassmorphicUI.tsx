import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GlassmorphicCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  onPress,
  className = "",
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`rounded-3xl overflow-hidden ${className}`}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4 border border-white/20"
        style={{
          backdropFilter: "blur(10px)",
        }}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const GlassmorphicButton = ({
  title,
  onPress,
  disabled = false,
  className = "",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      className={`rounded-2xl overflow-hidden py-3 px-6 ${disabled ? "opacity-50" : ""} ${className}`}
    >
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="py-3 px-6 rounded-2xl items-center"
      >
        <Text className="text-white font-bold text-base">{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const StatCard = ({
  title,
  value,
  icon,
  color = "from-blue-500 to-purple-600",
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) => {
  return (
    <View className={`rounded-2xl overflow-hidden`}>
      <LinearGradient
        colors={["rgba(99, 102, 241, 0.1)", "rgba(139, 92, 246, 0.1)"]}
        className="p-4 border border-purple-500/30"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-400 text-sm mb-2">{title}</Text>
            <Text className="text-white text-2xl font-bold">{value}</Text>
          </View>
          {icon && <View className="ml-4">{icon}</View>}
        </View>
      </LinearGradient>
    </View>
  );
};

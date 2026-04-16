import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { adminService } from "../../services/adminService";
import { paymentService } from "../../services/paymentService";
import { GlassmorphicCard, StatCard } from "../../components/GlassmorphicUI";

export const AdminDashboardScreen = () => {
  const [financialData, setFinancialData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    subscribeToPayments();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [financial, notifs] = await Promise.all([
        adminService.getFinancialSummary(),
        adminService.getNotifications(),
      ]);

      setFinancialData(financial);
      setNotifications(notifs);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPayments = () => {
    const subscription = paymentService.subscribeToPayments((payment) => {
      console.log("New payment:", payment);
      loadDashboard(); // Reload on new payment
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
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
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <GlassmorphicCard className="m-3 p-4">
            <Text className="text-white font-bold">{item.message}</Text>
            <Text className="text-gray-400 text-sm mt-2">{new Date(item.created_at).toLocaleDateString()}</Text>
          </GlassmorphicCard>
        )}
        ListHeaderComponent={
          <View className="p-4">
            <Text className="text-white text-3xl font-bold mb-6">Financial Dashboard</Text>

            {/* Summary Stats */}
            <StatCard
              title="Total Due"
              value={`$${financialData?.totalDue.toFixed(2) || 0}`}
              color="from-red-500 to-pink-600"
            />
            <StatCard
              title="Total Paid"
              value={`$${financialData?.totalPaid.toFixed(2) || 0}`}
              color="from-green-500 to-emerald-600"
              className="mt-3"
            />
            <StatCard
              title="Pending"
              value={`$${financialData?.totalPending.toFixed(2) || 0}`}
              color="from-yellow-500 to-orange-600"
              className="mt-3"
            />

            <Text className="text-white text-xl font-bold mt-6 mb-3">Recent Payments</Text>
          </View>
        }
      />
    </LinearGradient>
  );
};

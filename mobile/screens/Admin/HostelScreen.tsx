import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { adminService } from "../../services/adminService";
import { GlassmorphicCard, StatCard } from "../../components/GlassmorphicUI";

export const HostelScreen = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [studentName, setStudentName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHostelData();
  }, []);

  const loadHostelData = async () => {
    try {
      setLoading(true);
      const [blockData, bookingData] = await Promise.all([
        adminService.getHostelBlocks(),
        adminService.getHostelBookings(),
      ]);
      setBlocks(blockData);
      setBookings(bookingData);
      if (!selectedBlock && blockData.length) {
        setSelectedBlock(blockData[0].block_name);
      }
    } catch (error) {
      console.error("Error loading hostel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBooking = async () => {
    if (!studentName || !roomNumber || !checkIn || !checkOut) return;

    try {
      await adminService.createHostelBooking({
        student_name: studentName,
        block_name: selectedBlock,
        room_number: roomNumber,
        check_in: checkIn,
        check_out: checkOut,
        status: "active",
      });

      setStudentName("");
      setRoomNumber("");
      setCheckIn("");
      setCheckOut("");
      await loadHostelData();
    } catch (error) {
      console.error("Error saving hostel booking:", error);
    }
  };

  const totalRooms = useMemo(() => blocks.reduce((total, block) => total + (block.total_rooms || 0), 0), [blocks]);
  const activeCount = bookings.length;
  const availableRooms = Math.max(0, totalRooms - activeCount);

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
        <Text className="text-white text-3xl font-bold mb-2">Hostel Bookings</Text>
        <Text className="text-gray-400 mb-6">Manage hostel blocks, rooms, and student stays.</Text>

        <View className="grid grid-cols-1 gap-4 mb-6">
          <StatCard title="Total Rooms" value={`${totalRooms}`} />
          <StatCard title="Active Bookings" value={`${activeCount}`} />
          <StatCard title="Available" value={`${availableRooms}`} />
        </View>

        <GlassmorphicCard className="mb-6">
          <Text className="text-white text-xl font-bold mb-3">New Booking</Text>
          <View className="space-y-4">
            <TextInput
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Student name"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="Room number"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={checkIn}
              onChangeText={setCheckIn}
              placeholder="Check-in date (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={checkOut}
              onChangeText={setCheckOut}
              placeholder="Check-out date (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <View className="flex-row flex-wrap gap-2">
              {blocks.map((block) => (
                <TouchableOpacity
                  key={block.hostel_block_id || block.block_name}
                  onPress={() => setSelectedBlock(block.block_name)}
                  className={`rounded-2xl border px-4 py-3 ${selectedBlock === block.block_name ? 'border-purple-400 bg-purple-500/20' : 'border-white/20 bg-white/5'}`}>
                  <Text className="text-white">{block.block_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={addBooking} className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-4 items-center">
              <Text className="text-white font-bold">Save Booking</Text>
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>

        <Text className="text-white text-2xl font-bold mb-4">Current Bookings</Text>
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.hostel_booking_id || item.student_name || String(Math.random())}
          renderItem={({ item }) => (
            <GlassmorphicCard className="mb-4">
              <Text className="text-white text-lg font-bold">{item.student_name}</Text>
              <Text className="text-gray-300 mt-1">{item.block_name} · {item.room_number}</Text>
              <Text className="text-gray-400 mt-2">{item.check_in} → {item.check_out}</Text>
              <Text className="text-sm text-gray-400 mt-2">Status: {item.status}</Text>
            </GlassmorphicCard>
          )}
        />
      </ScrollView>
    </LinearGradient>
  );
};

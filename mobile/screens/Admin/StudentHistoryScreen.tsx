import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassmorphicCard } from "../../components/GlassmorphicUI";
import { adminService } from "../../services/adminService";

const formatDate = (value: string) => {
  return value ? new Date(value).toLocaleDateString() : "-";
};

export const StudentHistoryScreen = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentList();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentHistory(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadStudentList = async () => {
    try {
      const studentData = await adminService.getStudentList();
      setStudents(studentData);
      if (studentData.length > 0) {
        setSelectedStudentId(studentData[0].student_id);
      }
    } catch (error) {
      console.error("Error loading student list:", error);
    }
  };

  const loadStudentHistory = async (studentId: string) => {
    try {
      setLoading(true);
      const studentHistory = await adminService.getStudentHistory(studentId);
      setHistory(studentHistory);
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = useMemo(
    () => students.find((student) => student.student_id === selectedStudentId),
    [students, selectedStudentId]
  );

  if (loading && !history) {
    return (
      <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-white text-3xl font-bold mb-2">Student History</Text>
        <Text className="text-gray-400 mb-6">Review attendance, results, fees, library and hostel history.</Text>

        <View className="flex-row flex-wrap gap-3 mb-6">
          {students.map((student) => (
            <TouchableOpacity
              key={student.student_id}
              onPress={() => setSelectedStudentId(student.student_id)}
              className={`rounded-2xl border px-4 py-3 ${selectedStudentId === student.student_id ? 'border-purple-400 bg-purple-500/20' : 'border-white/20 bg-white/5'}`}>
              <Text className="text-white">{student.first_name} {student.last_name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GlassmorphicCard className="mb-6">
          <Text className="text-white text-xl font-bold">{selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Select a student'}</Text>
          <Text className="text-gray-300 mt-2">{selectedStudent?.classes?.class_name || 'No class assigned'}</Text>
        </GlassmorphicCard>

        <View className="grid grid-cols-1 gap-4 mb-6">
          <GlassmorphicCard>
            <Text className="text-white text-lg font-bold mb-2">Attendance</Text>
            <Text className="text-gray-300">Present: {history?.attendance?.filter((record: any) => record.status === 'present').length || 0}</Text>
            <Text className="text-gray-300">Absent: {history?.attendance?.filter((record: any) => record.status === 'absent').length || 0}</Text>
            <Text className="text-gray-300">Late: {history?.attendance?.filter((record: any) => record.status === 'late').length || 0}</Text>
          </GlassmorphicCard>

          <GlassmorphicCard>
            <Text className="text-white text-lg font-bold mb-2">Results</Text>
            {!history?.results?.length ? (
              <Text className="text-gray-300">No results available.</Text>
            ) : (
              history.results.map((row: any) => (
                <View key={`${row.subject}-${row.id || Math.random()}`} className="mb-3">
                  <Text className="text-white font-semibold">{row.subject}</Text>
                  <Text className="text-gray-300">Grade: {row.grade} • Score: {row.score}</Text>
                </View>
              ))
            )}
          </GlassmorphicCard>

          <GlassmorphicCard>
            <Text className="text-white text-lg font-bold mb-2">Fees</Text>
            {!history?.fees?.length ? (
              <Text className="text-gray-300">No fee records.</Text>
            ) : (
              history.fees.map((fee: any) => (
                <View key={`${fee.id || fee.fee_id || Math.random()}`} className="mb-3">
                  <Text className="text-white">{fee.status}</Text>
                  <Text className="text-gray-300">${fee.amount} due {formatDate(fee.due_date || fee.dueDate)}</Text>
                </View>
              ))
            )}
          </GlassmorphicCard>

          <GlassmorphicCard>
            <Text className="text-white text-lg font-bold mb-2">Library</Text>
            {!history?.library?.length ? (
              <Text className="text-gray-300">No borrow history found.</Text>
            ) : (
              history.library.map((item: any) => (
                <View key={`${item.borrow_id || item.id || Math.random()}`} className="mb-3">
                  <Text className="text-white">{item.book_title}</Text>
                  <Text className="text-gray-300">Borrowed {formatDate(item.borrow_date)} • Due {formatDate(item.due_date)}</Text>
                </View>
              ))
            )}
          </GlassmorphicCard>

          <GlassmorphicCard>
            <Text className="text-white text-lg font-bold mb-2">Hostel</Text>
            {!history?.hostel?.length ? (
              <Text className="text-gray-300">No hostel history.</Text>
            ) : (
              history.hostel.map((item: any) => (
                <View key={`${item.hostel_booking_id || item.id || Math.random()}`} className="mb-3">
                  <Text className="text-white">{item.block_name}</Text>
                  <Text className="text-gray-300">Room {item.room_number} • {formatDate(item.check_in)} - {formatDate(item.check_out)}</Text>
                </View>
              ))
            )}
          </GlassmorphicCard>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

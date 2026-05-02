import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassmorphicCard, StatCard } from "../../components/GlassmorphicUI";
import { adminService } from "../../services/adminService";

export const LibraryScreen = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [copies, setCopies] = useState("1");
  const [category, setCategory] = useState("");
  const [borrowStudent, setBorrowStudent] = useState("");
  const [borrowTitle, setBorrowTitle] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookData, borrowData] = await Promise.all([
        adminService.getLibraryBooks(),
        adminService.getLibraryBorrows(),
      ]);
      setBooks(bookData);
      setBorrows(borrowData);
      if (bookData.length && !borrowTitle) {
        setBorrowTitle(bookData[0].title);
      }
    } catch (error) {
      console.error("Error loading library data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBook = async () => {
    if (!title || !author || !category) return;
    try {
      await adminService.createLibraryBook({
        title,
        author,
        copies: Number(copies) || 1,
        category,
      });
      setTitle("");
      setAuthor("");
      setCopies("1");
      setCategory("");
      await loadData();
    } catch (error) {
      console.error("Error adding library book:", error);
    }
  };

  const addBorrow = async () => {
    if (!borrowStudent || !borrowTitle || !borrowDate || !returnDate) return;
    try {
      await adminService.createLibraryBorrow({
        student_name: borrowStudent,
        book_title: borrowTitle,
        borrow_date: borrowDate,
        due_date: returnDate,
        status: "borrowed",
      });
      setBorrowStudent("");
      setBorrowDate("");
      setReturnDate("");
      await loadData();
    } catch (error) {
      console.error("Error logging borrow:", error);
    }
  };

  const totalCopies = useMemo(() => books.reduce((sum, book) => sum + Number(book.copies || 0), 0), [books]);

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
        <Text className="text-white text-3xl font-bold mb-2">Library Control</Text>
        <Text className="text-gray-400 mb-6">Manage library inventory and student borrow records.</Text>

        <View className="grid grid-cols-1 gap-4 mb-6">
          <StatCard title="Titles" value={`${books.length}`} />
          <StatCard title="Borrowed" value={`${borrows.length}`} />
          <StatCard title="Copies" value={`${totalCopies}`} />
        </View>

        <GlassmorphicCard className="mb-6">
          <Text className="text-white text-xl font-bold mb-3">Add New Book</Text>
          <View className="space-y-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Book title"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={author}
              onChangeText={setAuthor}
              placeholder="Author"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Category"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={copies}
              onChangeText={setCopies}
              placeholder="Copies"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TouchableOpacity onPress={addBook} className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-4 items-center">
              <Text className="text-white font-bold">Add Book</Text>
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>

        <GlassmorphicCard className="mb-6">
          <Text className="text-white text-xl font-bold mb-3">Log a Borrow</Text>
          <View className="space-y-4">
            <TextInput
              value={borrowStudent}
              onChangeText={setBorrowStudent}
              placeholder="Student name"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <View className="flex-row flex-wrap gap-2">
              {books.map((book) => (
                <TouchableOpacity
                  key={book.book_id || book.title}
                  onPress={() => setBorrowTitle(book.title)}
                  className={`rounded-2xl border px-4 py-3 ${borrowTitle === book.title ? 'border-purple-400 bg-purple-500/20' : 'border-white/20 bg-white/5'}`}>
                  <Text className="text-white">{book.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={borrowDate}
              onChangeText={setBorrowDate}
              placeholder="Borrow date (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TextInput
              value={returnDate}
              onChangeText={setReturnDate}
              placeholder="Due date (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white"
            />
            <TouchableOpacity onPress={addBorrow} className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-4 items-center">
              <Text className="text-white font-bold">Log Borrow</Text>
            </TouchableOpacity>
          </View>
        </GlassmorphicCard>

        <Text className="text-white text-2xl font-bold mb-4">Current Borrowed Books</Text>
        <FlatList
          data={borrows}
          keyExtractor={(item) => item.library_borrow_id || item.student_name || String(Math.random())}
          renderItem={({ item }) => (
            <GlassmorphicCard className="mb-4">
              <Text className="text-white text-lg font-bold">{item.student_name}</Text>
              <Text className="text-gray-300 mt-1">{item.book_title}</Text>
              <Text className="text-gray-400 mt-2">Borrowed {item.borrow_date} • Due {item.due_date}</Text>
            </GlassmorphicCard>
          )}
        />
      </ScrollView>
    </LinearGradient>
  );
};

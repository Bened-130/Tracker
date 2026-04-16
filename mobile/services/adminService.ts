import { supabase } from "./supabaseClient";

export const adminService = {
  // Get all students
  getAllStudents: async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(name), users(role)");

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching all students:", error);
      throw error;
    }
  },

  // Register new student
  registerStudent: async (studentData: any, faceDescriptor: any) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .insert([
          {
            ...studentData,
            face_descriptor: faceDescriptor,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error registering student:", error);
      throw error;
    }
  },

  // Get financial summary
  getFinancialSummary: async () => {
    try {
      const { data: allFees } = await supabase.from("fees").select("amount, paid, status");

      if (!allFees) return null;

      const totalDue = allFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
      const totalPaid = allFees.reduce((sum, fee) => sum + (fee.paid || 0), 0);
      const totalPending = totalDue - totalPaid;
      const paidCount = allFees.filter((fee) => fee.status === "paid").length;
      const pendingCount = allFees.filter((fee) => fee.status === "pending").length;

      return {
        totalDue,
        totalPaid,
        totalPending,
        paidCount,
        pendingCount,
        allFees,
      };
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      throw error;
    }
  },

  // Get notifications
  getNotifications: async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications: (callback: (notification: any) => void) => {
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "type=eq.payment",
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },

  // Get student history
  getStudentHistory: async (studentId: string) => {
    try {
      const { data: student } = await supabase
        .from("students")
        .select("*, classes(*)")
        .eq("id", studentId)
        .single();

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId);

      const { data: results } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", studentId);

      const { data: fees } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId);

      return {
        student,
        attendance,
        results,
        fees,
      };
    } catch (error) {
      console.error("Error fetching student history:", error);
      throw error;
    }
  },
};

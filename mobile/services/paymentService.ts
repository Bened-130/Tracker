import { supabase } from "./supabaseClient";

export const paymentService = {
  // Get student fees
  getStudentFees: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching fees:", error);
      throw error;
    }
  },

  // Get all students with fee status (admin only)
  getAllStudentsFees: async () => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*, students(name, id)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching all fees:", error);
      throw error;
    }
  },

  // Get financial statements (admin)
  getFinancialStatements: async () => {
    try {
      const { data, error } = await supabase.rpc("get_financial_summary");

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching financial statements:", error);
      throw error;
    }
  },

  // Subscribe to real-time payment updates
  subscribeToPayments: (callback: (paid: any) => void) => {
    const subscription = supabase
      .channel("payments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fees",
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },

  // Record payment (Stripe integration)
  recordPayment: async (studentId: string, amount: number, paymentIntentId: string) => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .update({
          paid: amount,
          payment_date: new Date().toISOString(),
          status: "paid",
          payment_intent_id: paymentIntentId,
        })
        .eq("student_id", studentId)
        .select();

      if (error) throw error;

      // Create notification for admin
      await supabase.from("notifications").insert([
        {
          user_id: "admin_id", // Replace with actual admin ID
          type: "payment",
          message: `Payment of $${amount} received for student ${studentId}`,
          read: false,
        },
      ]);

      return data;
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  },
};

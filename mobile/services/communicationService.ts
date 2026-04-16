import { supabase } from "./supabaseClient";

export const communicationService = {
  // Get comments between parent and teacher
  getComments: async (parentId: string, teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .or(`and(parent_id.eq.${parentId},teacher_id.eq.${teacherId}),and(parent_id.eq.${teacherId},teacher_id.eq.${parentId})`)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // Send comment
  sendComment: async (parentId: string, teacherId: string, message: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            parent_id: parentId,
            teacher_id: teacherId,
            message,
            timestamp: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error sending comment:", error);
      throw error;
    }
  },

  // Subscribe to real-time comments
  subscribeToComments: (parentId: string, teacherId: string, callback: (comment: any) => void) => {
    const subscription = supabase
      .channel(`comments-${parentId}-${teacherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },
};

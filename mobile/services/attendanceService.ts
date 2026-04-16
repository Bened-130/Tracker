import { supabase } from "./supabaseClient";

export const attendanceService = {
  // Get all sessions for a class
  getSessions: async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("class_id", classId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }
  },

  // Get attendance for a student
  getStudentAttendance: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, sessions(*)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      throw error;
    }
  },

  // Mark attendance for a student
  markAttendance: async (sessionId: string, studentId: string, faceDescriptor: any) => {
    try {
      // Get expected face descriptor for student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("face_descriptor")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;

      // Compare face descriptors (simplified version - implement proper ML model)
      const match = compareFaceDescriptors(faceDescriptor, student.face_descriptor);

      if (!match) {
        throw new Error("Face does not match. Please try again.");
      }

      // Mark attendance
      const { data, error } = await supabase
        .from("attendance")
        .insert([
          {
            session_id: sessionId,
            student_id: studentId,
            status: "present",
            timestamp: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error marking attendance:", error);
      throw error;
    }
  },

  // Get attendance report for a session
  getSessionReport: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, students(*)")
        .eq("session_id", sessionId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching session report:", error);
      throw error;
    }
  },
};

// Placeholder function - implement proper face comparison
const compareFaceDescriptors = (desc1: any, desc2: any): boolean => {
  // This should use proper ML model for face recognition
  // For now, returning true as placeholder
  return true;
};

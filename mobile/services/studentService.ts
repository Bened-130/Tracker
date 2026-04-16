import { supabase } from "./supabaseClient";

export const studentService = {
  // Get student profile
  getProfile: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching student profile:", error);
      throw error;
    }
  },

  // Get student results
  getResults: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching results:", error);
      throw error;
    }
  },

  // Get student assignments
  getAssignments: async (studentId: string) => {
    try {
      const { data: student } = await supabase
        .from("students")
        .select("class_id")
        .eq("id", studentId)
        .single();

      if (!student) throw new Error("Student not found");

      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("class_id", student.class_id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching assignments:", error);
      throw error;
    }
  },

  // Get student timetable
  getTimetable: async (studentId: string) => {
    try {
      const { data: student } = await supabase
        .from("students")
        .select("class_id")
        .eq("id", studentId)
        .single();

      if (!student) throw new Error("Student not found");

      const { data, error } = await supabase
        .from("timetables")
        .select("*")
        .eq("class_id", student.class_id)
        .order("day", { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching timetable:", error);
      throw error;
    }
  },

  // Enroll student face
  enrollFace: async (studentId: string, faceDescriptor: any) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .update({ face_descriptor: faceDescriptor })
        .eq("id", studentId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error enrolling face:", error);
      throw error;
    }
  },
};

import { supabase } from "./supabaseClient";

export const teacherService = {
  // Get assignments for teacher's classes
  getAssignments: async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, classes(*)")
        .eq("created_by", teacherId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching assignments:", error);
      throw error;
    }
  },

  // Create assignment
  createAssignment: async (classId: string, title: string, dueDate: string, fileUrl: string, createdBy: string) => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert([
          {
            class_id: classId,
            title,
            due_date: dueDate,
            file_url: fileUrl,
            created_by: createdBy,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating assignment:", error);
      throw error;
    }
  },

  // Update assignment
  updateAssignment: async (assignmentId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .update(updates)
        .eq("id", assignmentId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating assignment:", error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (assignmentId: string) => {
    try {
      const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      throw error;
    }
  },

  // Set session open/close
  setSessionStatus: async (sessionId: string, isOpen: boolean) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .update({ is_open: isOpen })
        .eq("id", sessionId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error setting session status:", error);
      throw error;
    }
  },

  // Get attendance report
  getAttendanceReport: async (classId: string, dateFrom: string, dateTo: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, students(*), sessions(*)")
        .eq("sessions.class_id", classId)
        .gte("sessions.date", dateFrom)
        .lte("sessions.date", dateTo);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      throw error;
    }
  },

  // Get student grades
  getStudentGrades: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching student grades:", error);
      throw error;
    }
  },

  // Add student grade
  addStudentGrade: async (studentId: string, subject: string, grade: string) => {
    try {
      const { data, error } = await supabase
        .from("results")
        .insert([
          {
            student_id: studentId,
            subject,
            grade,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding grade:", error);
      throw error;
    }
  },
};

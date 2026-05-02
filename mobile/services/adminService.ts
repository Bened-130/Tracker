import { supabase } from "./supabaseClient";

const safeQuery = async (query: any) => {
  const { data, error } = await query;
  if (error) {
    const message = error?.message || '';
    if (message.includes('does not exist') || message.includes('relation')) {
      return [];
    }
    throw error;
  }
  return data || [];
};

export const adminService = {
  getHostelBlocks: async () => {
    const { data, error } = await supabase.from('hostel_blocks').select('*').order('block_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getHostelBookings: async () => {
    const { data, error } = await supabase.from('hostel_bookings').select('*').order('check_in', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createHostelBooking: async (booking: any) => {
    const { data, error } = await supabase.from('hostel_bookings').insert([booking]).select().single();
    if (error) throw error;
    return data;
  },

  getLibraryBooks: async () => {
    const { data, error } = await supabase.from('library_books').select('*').order('title', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  createLibraryBook: async (book: any) => {
    const { data, error } = await supabase.from('library_books').insert([book]).select().single();
    if (error) throw error;
    return data;
  },

  getLibraryBorrows: async () => {
    const { data, error } = await supabase.from('library_borrows').select('*').order('borrow_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createLibraryBorrow: async (borrow: any) => {
    const { data, error } = await supabase.from('library_borrows').insert([borrow]).select().single();
    if (error) throw error;
    return data;
  },

  getCalendarEvents: async () => {
    const { data, error } = await supabase.from('school_calendar').select('*').order('event_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  createCalendarEvent: async (eventData: any) => {
    const { data, error } = await supabase.from('school_calendar').insert([eventData]).select().single();
    if (error) throw error;
    return data;
  },

  getStudentList: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, email, class_id, classes(class_name)')
      .order('first_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getStudentHistory: async (studentId: string) => {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, email, class_id, classes(class_name)')
      .eq('student_id', studentId)
      .single();

    if (studentError || !student) {
      throw studentError || new Error('Student not found');
    }

    const attendance = await safeQuery(supabase.from('attendance').select('*').eq('student_id', studentId));
    const library = await safeQuery(supabase.from('library_borrows').select('*').eq('student_id', studentId));
    const hostel = await safeQuery(supabase.from('hostel_bookings').select('*').eq('student_id', studentId));
    const fees = await safeQuery(supabase.from('fees').select('*').eq('student_id', studentId));
    const results = await safeQuery(supabase.from('results').select('*').eq('student_id', studentId));

    return {
      student,
      attendance,
      library,
      hostel,
      fees,
      results,
    };
  },

  getFinancialSummary: async () => {
    const { data: allFees, error } = await supabase.from('fees').select('amount, paid, status');
    if (error) throw error;
    if (!allFees) return null;

    const totalDue = allFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);
    const totalPaid = allFees.reduce((sum: number, fee: any) => sum + (fee.paid || 0), 0);
    const totalPending = totalDue - totalPaid;
    const paidCount = allFees.filter((fee: any) => fee.status === 'paid').length;
    const pendingCount = allFees.filter((fee: any) => fee.status === 'pending').length;

    return {
      totalDue,
      totalPaid,
      totalPending,
      paidCount,
      pendingCount,
      allFees,
    };
  },

  getNotifications: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  markNotificationAsRead: async (notificationId: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    if (error) throw error;
  },

  subscribeToNotifications: (callback: (notification: any) => void) => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.payment',
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return subscription;
  },
};

import { supabase } from './utils/supabase.mjs';

function jsonResponse(statusCode, payload) {
  return { statusCode, body: JSON.stringify(payload) };
}

async function safeQuery(query) {
  const { data, error } = await query;
  if (error) {
    const message = error.message || '';
    if (message.includes('relation') || message.includes('does not exist')) {
      return [];
    }
    throw error;
  }
  return data || [];
}

export async function adminHandler(event) {
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const segments = path.split('/').filter(Boolean);
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  if (segments[0] !== 'admin') {
    return jsonResponse(404, { success: false, error: 'Not found' });
  }

  const section = segments[1];
  const action = segments[2];
  const itemId = segments[3];

  try {
    if (section === 'hostel') {
      if (method === 'GET' && action === 'blocks') {
        const { data, error } = await supabase.from('hostel_blocks').select('*').order('block_name', { ascending: true });
        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }

      if (method === 'GET' && action === 'bookings') {
        const { data, error } = await supabase.from('hostel_bookings').select('*').order('check_in', { ascending: false });
        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }

      if (method === 'POST' && action === 'bookings') {
        const { studentName, student_id, blockName, roomNumber, checkIn, checkOut, status = 'active' } = body;
        if (!studentName || !blockName || !roomNumber || !checkIn || !checkOut) {
          return jsonResponse(400, { success: false, error: 'Missing booking fields' });
        }

        const { data, error } = await supabase.from('hostel_bookings').insert([
          {
            student_id: student_id || null,
            student_name: studentName,
            block_name: blockName,
            room_number: roomNumber,
            check_in: checkIn,
            check_out: checkOut,
            status,
          },
        ]).select().single();

        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }
    }

    if (section === 'library') {
      if (method === 'GET' && action === 'books') {
        const { data, error } = await supabase.from('library_books').select('*').order('title', { ascending: true });
        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }

      if (method === 'POST' && action === 'books') {
        const { title, author, copies, category } = body;
        if (!title || !author || !category) {
          return jsonResponse(400, { success: false, error: 'Missing book fields' });
        }

        const { data, error } = await supabase.from('library_books').insert([
          {
            title,
            author,
            copies: Number(copies) || 1,
            category,
          },
        ]).select().single();

        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }

      if (method === 'GET' && action === 'borrows') {
        const { data, error } = await supabase.from('library_borrows').select('*').order('borrow_date', { ascending: false });
        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }

      if (method === 'POST' && action === 'borrows') {
        const { studentName, student_id, bookTitle, borrowDate, dueDate, status = 'borrowed' } = body;
        if (!studentName || !bookTitle || !borrowDate || !dueDate) {
          return jsonResponse(400, { success: false, error: 'Missing borrow fields' });
        }

        const { data, error } = await supabase.from('library_borrows').insert([
          {
            student_id: student_id || null,
            student_name: studentName,
            book_title: bookTitle,
            borrow_date: borrowDate,
            due_date: dueDate,
            status,
          },
        ]).select().single();

        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }
    }

    if (section === 'calendar') {
      if (method === 'GET' && action === 'events') {
        const { data, error } = await supabase.from('school_calendar').select('*').order('event_date', { ascending: true });
        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }

      if (method === 'POST' && action === 'events') {
        const { title, date, audience, description } = body;
        if (!title || !date || !audience) {
          return jsonResponse(400, { success: false, error: 'Missing calendar event fields' });
        }

        const { data, error } = await supabase.from('school_calendar').insert([
          {
            title,
            event_date: date,
            audience,
            description,
          },
        ]).select().single();

        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }
    }

    if (section === 'students') {
      if (method === 'GET' && action === 'history' && itemId) {
        const { data: student, error: studentError } = await supabase.from('students').select('student_id, first_name, last_name, email, class_id, classes(class_name)').eq('student_id', itemId).single();
        if (studentError || !student) {
          return jsonResponse(404, { success: false, error: 'Student not found' });
        }

        const attendance = await safeQuery(supabase.from('attendance').select('*').eq('student_id', itemId));
        const library = await safeQuery(supabase.from('library_borrows').select('*').eq('student_id', itemId));
        const hostel = await safeQuery(supabase.from('hostel_bookings').select('*').eq('student_id', itemId));
        const fees = await safeQuery(supabase.from('fees').select('*').eq('student_id', itemId));
        const results = await safeQuery(supabase.from('results').select('*').eq('student_id', itemId));

        return jsonResponse(200, {
          success: true,
          data: {
            student,
            attendance,
            library,
            hostel,
            fees,
            results,
          },
        });
      }

      if (method === 'GET') {
        const { data, error } = await supabase.from('students').select('student_id, first_name, last_name, email, class_id, classes(class_name)').order('first_name', { ascending: true });
        if (error) return jsonResponse(500, { success: false, error: error.message });
        return jsonResponse(200, { success: true, data });
      }
    }

    if (section === 'notifications' && method === 'GET') {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) return jsonResponse(500, { success: false, error: error.message });
      return jsonResponse(200, { success: true, data });
    }

    if (section === 'financial-summary' && method === 'GET') {
      const fees = await safeQuery(supabase.from('fees').select('amount, paid, status'));
      const totalDue = (fees || []).reduce((sum, fee) => sum + (fee.amount || 0), 0);
      const totalPaid = (fees || []).reduce((sum, fee) => sum + (fee.paid || 0), 0);
      const totalPending = totalDue - totalPaid;
      const paidCount = (fees || []).filter((fee) => fee.status === 'paid').length;
      const pendingCount = (fees || []).filter((fee) => fee.status === 'pending').length;

      return jsonResponse(200, {
        success: true,
        data: { totalDue, totalPaid, totalPending, paidCount, pendingCount, allFees: fees },
      });
    }

    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (error) {
    return jsonResponse(500, { success: false, error: error.message || 'Server error' });
  }
}

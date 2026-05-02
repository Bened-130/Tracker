let hostelBlocks = [];
let hostelBookings = [];
let libraryBooks = [];
let libraryBorrows = [];
let calendarEvents = [];
let studentsList = [];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function isSuccess(response) {
  return response && response.success;
}

async function loadHostelPage() {
  const blockSelect = document.getElementById('blockName');
  const summary = document.getElementById('hostelBlocksSummary');
  const bookingSummary = document.getElementById('hostelBookingSummary');
  const availability = document.getElementById('hostelAvailability');
  const tbody = document.getElementById('hostelBookingsBody');

  try {
    const [blocksRes, bookingsRes] = await Promise.all([
      api.getHostelBlocks(),
      api.getHostelBookings(),
    ]);

    hostelBlocks = isSuccess(blocksRes) ? blocksRes.data : [];
    hostelBookings = isSuccess(bookingsRes) ? bookingsRes.data : [];

    if (blockSelect) {
      blockSelect.innerHTML = hostelBlocks
        .map((block) => `<option value="${block.block_name}">${block.block_name}</option>`)
        .join('');
    }

    if (summary) {
      summary.innerHTML = hostelBlocks
        .map(block => `
          <div>
            <div class="section-title">${block.block_name}</div>
            <p>${block.block_type} · ${block.floor_count} floors · ${block.total_rooms} rooms</p>
          </div>
        `)
        .join('');
    }

    if (bookingSummary) {
      bookingSummary.textContent = `${hostelBookings.length} active booking${hostelBookings.length === 1 ? '' : 's'}`;
    }

    if (availability) {
      const totalRooms = hostelBlocks.reduce((sum, block) => sum + (block.total_rooms || 0), 0);
      availability.textContent = `${Math.max(0, totalRooms - hostelBookings.length)} of ${totalRooms} rooms are available`;
    }

    if (tbody) {
      tbody.innerHTML = hostelBookings.map((booking) => `
        <tr>
          <td>${booking.student_name}</td>
          <td>${booking.block_name}</td>
          <td>${booking.room_number}</td>
          <td>${formatDate(booking.check_in)}</td>
          <td>${formatDate(booking.check_out)}</td>
          <td><span class="badge ${booking.status === 'active' ? 'badge-active' : 'badge-warning'}">${booking.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading hostel page:', error);
    showToast('Unable to load hostel bookings.', 'error');
  }

  const form = document.getElementById('hostelForm');
  if (form && !form.dataset.initialized) {
    form.dataset.initialized = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const studentName = document.getElementById('studentName').value.trim();
      const blockName = document.getElementById('blockName').value;
      const roomNumber = document.getElementById('roomNumber').value.trim();
      const checkIn = document.getElementById('checkInDate').value;
      const checkOut = document.getElementById('checkOutDate').value;

      if (!studentName || !blockName || !roomNumber || !checkIn || !checkOut) {
        return showToast('Please fill all booking fields.', 'error');
      }

      try {
        const response = await api.createHostelBooking({
          studentName,
          blockName,
          roomNumber,
          checkIn,
          checkOut,
          status: 'active',
        });

        if (!isSuccess(response)) {
          throw new Error(response.error || 'Failed to create booking');
        }

        showToast('Hostel booking saved.', 'success');
        form.reset();
        await loadHostelPage();
      } catch (error) {
        console.error('Hostel booking error:', error);
        showToast(error.message || 'Unable to create hostel booking.', 'error');
      }
    });
  }
}

async function loadLibraryPage() {
  const booksBody = document.getElementById('libraryBooksBody');
  const borrowsBody = document.getElementById('libraryBorrowsBody');
  const totalBooks = document.getElementById('libraryTotalBooks');
  const borrowedCount = document.getElementById('libraryBorrowedCount');
  const availableCount = document.getElementById('libraryAvailableCount');
  const bookSelect = document.getElementById('borrowBookSelect');

  try {
    const [booksRes, borrowsRes] = await Promise.all([
      api.getLibraryBooks(),
      api.getLibraryBorrows(),
    ]);

    libraryBooks = isSuccess(booksRes) ? booksRes.data : [];
    libraryBorrows = isSuccess(borrowsRes) ? borrowsRes.data : [];

    if (totalBooks) totalBooks.textContent = `${libraryBooks.length} titles`;
    if (borrowedCount) borrowedCount.textContent = `${libraryBorrows.length} borrowed items`;
    if (availableCount) {
      const totalCopies = libraryBooks.reduce((sum, book) => sum + Number(book.copies || 0), 0);
      availableCount.textContent = `${Math.max(0, totalCopies - libraryBorrows.length)} available copies`;
    }

    if (bookSelect) {
      bookSelect.innerHTML = libraryBooks
        .map(book => `<option value="${book.title}">${book.title}</option>`)
        .join('');
    }

    if (booksBody) {
      booksBody.innerHTML = libraryBooks.map(book => `
        <tr>
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.copies}</td>
          <td>${book.category}</td>
        </tr>
      `).join('');
    }

    if (borrowsBody) {
      borrowsBody.innerHTML = libraryBorrows.map(borrow => `
        <tr>
          <td>${borrow.student_name}</td>
          <td>${borrow.book_title}</td>
          <td>${formatDate(borrow.borrow_date)}</td>
          <td>${formatDate(borrow.due_date)}</td>
          <td><span class="badge ${borrow.status === 'borrowed' ? 'badge-borrowed' : 'badge-success'}">${borrow.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading library page:', error);
    showToast('Unable to load library data.', 'error');
  }

  const createBookForm = document.getElementById('libraryBookForm');
  if (createBookForm && !createBookForm.dataset.initialized) {
    createBookForm.dataset.initialized = 'true';
    createBookForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('bookTitle').value.trim();
      const author = document.getElementById('bookAuthor').value.trim();
      const copies = Number(document.getElementById('bookCopies').value);
      const category = document.getElementById('bookCategory').value.trim();

      if (!title || !author || !category || !copies) {
        return showToast('Please fill all book fields.', 'error');
      }

      try {
        const response = await api.createLibraryBook({ title, author, copies, category });
        if (!isSuccess(response)) {
          throw new Error(response.error || 'Failed to create library book');
        }

        showToast('Library book added.', 'success');
        createBookForm.reset();
        await loadLibraryPage();
      } catch (error) {
        console.error('Library book error:', error);
        showToast(error.message || 'Unable to create library book.', 'error');
      }
    });
  }

  const borrowForm = document.getElementById('borrowBookForm');
  if (borrowForm && !borrowForm.dataset.initialized) {
    borrowForm.dataset.initialized = 'true';
    borrowForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const studentName = document.getElementById('borrowStudentName').value.trim();
      const title = document.getElementById('borrowBookSelect').value;
      const borrowDate = document.getElementById('borrowDate').value;
      const dueDate = document.getElementById('returnDate').value;

      if (!studentName || !title || !borrowDate || !dueDate) {
        return showToast('Please fill all borrow fields.', 'error');
      }

      try {
        const response = await api.createLibraryBorrow({
          studentName,
          bookTitle: title,
          borrowDate,
          dueDate,
          status: 'borrowed',
        });

        if (!isSuccess(response)) {
          throw new Error(response.error || 'Failed to log borrow');
        }

        showToast('Borrow record saved.', 'success');
        borrowForm.reset();
        await loadLibraryPage();
      } catch (error) {
        console.error('Library borrow error:', error);
        showToast(error.message || 'Unable to log borrow.', 'error');
      }
    });
  }
}

async function loadCalendarPage(withAdminControls) {
  const eventBody = document.getElementById('calendarEventBody');
  const calendarEventsContainer = document.getElementById('calendarEvents');
  const form = document.getElementById('calendarForm');

  try {
    const response = await api.getCalendarEvents();
    calendarEvents = isSuccess(response) ? response.data : [];

    if (eventBody) {
      eventBody.innerHTML = calendarEvents.map(event => `
        <tr>
          <td>${event.title}</td>
          <td>${formatDate(event.event_date)}</td>
          <td>${event.audience}</td>
          <td>${event.description || ''}</td>
        </tr>
      `).join('');
    }

    if (calendarEventsContainer) {
      calendarEventsContainer.innerHTML = calendarEvents
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .map(event => `
          <div class="event-card">
            <div class="event-title">${event.title}</div>
            <div class="event-meta">${formatDate(event.event_date)} · ${event.audience}</div>
            <p>${event.description || ''}</p>
          </div>
        `)
        .join('');
    }
  } catch (error) {
    console.error('Error loading calendar page:', error);
    showToast('Unable to load calendar events.', 'error');
  }

  if (withAdminControls && form && !form.dataset.initialized) {
    form.dataset.initialized = 'true';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('eventTitle').value.trim();
      const date = document.getElementById('eventDate').value;
      const audience = document.getElementById('eventAudience').value;
      const description = document.getElementById('eventDescription').value.trim();

      if (!title || !date || !audience) {
        return showToast('Please fill all calendar event fields.', 'error');
      }

      try {
        const response = await api.createCalendarEvent({ title, date, audience, description });
        if (!isSuccess(response)) {
          throw new Error(response.error || 'Failed to publish event');
        }

        showToast('Calendar event published.', 'success');
        form.reset();
        await loadCalendarPage(true);
      } catch (error) {
        console.error('Calendar publish error:', error);
        showToast(error.message || 'Unable to publish event.', 'error');
      }
    });
  }
}

async function loadStudentHistoryPage() {
  const select = document.getElementById('studentSelect');
  const historyContainer = document.getElementById('studentHistoryContent');

  try {
    const response = await api.getAllStudents();
    studentsList = isSuccess(response) ? response.data : [];

    if (!studentsList.length) {
      if (historyContainer) {
        historyContainer.innerHTML = '<div class="card"><p>No student records found.</p></div>';
      }
      return;
    }

    if (select) {
      select.innerHTML = studentsList
        .map(student => `<option value="${student.student_id}">${student.first_name} ${student.last_name} — ${student.classes?.class_name || 'Unknown class'}</option>`)
        .join('');

      const defaultId = select.value || studentsList[0].student_id;
      select.addEventListener('change', () => renderStudentHistory(select.value));
      await renderStudentHistory(defaultId);
    }
  } catch (error) {
    console.error('Error loading student history page:', error);
    showToast('Unable to load student records.', 'error');
  }
}

async function renderStudentHistory(studentId) {
  const historyContainer = document.getElementById('studentHistoryContent');
  if (!historyContainer) return;

  try {
    const response = await api.getStudentHistory(studentId);
    if (!isSuccess(response)) {
      throw new Error(response.error || 'Failed to load student history');
    }

    const { student, attendance, results, fees, library, hostel } = response.data;
    const studentName = `${student.first_name} ${student.last_name}`;
    const className = student.classes?.class_name || 'N/A';

    const presentCount = (attendance || []).filter((record) => record.status === 'present').length;
    const absentCount = (attendance || []).filter((record) => record.status === 'absent').length;
    const lateCount = (attendance || []).filter((record) => record.status === 'late').length;

    historyContainer.innerHTML = `
      <div class="card">
        <div class="section-title">${studentName}</div>
        <p>Class: ${className}</p>
        <p>Email: ${student.email || 'N/A'}</p>
      </div>
      <div class="card">
        <div class="section-title">Attendance</div>
        <p>Present: ${presentCount}</p>
        <p>Absent: ${absentCount}</p>
        <p>Late: ${lateCount}</p>
      </div>
      <div class="card">
        <div class="section-title">Results</div>
        ${!results || !results.length ? '<p>No results available.</p>' : `
          <table>
            <thead>
              <tr><th>Subject</th><th>Grade</th><th>Score</th></tr>
            </thead>
            <tbody>
              ${results.map(result => `<tr><td>${result.subject}</td><td>${result.grade}</td><td>${result.score}</td></tr>`).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="card">
        <div class="section-title">Fees & Payments</div>
        ${!fees || !fees.length ? '<p>No fee statements found.</p>' : `
          <table>
            <thead>
              <tr><th>Status</th><th>Amount</th><th>Due</th></tr>
            </thead>
            <tbody>
              ${fees.map(fee => `<tr><td>${fee.status}</td><td>$${fee.amount}</td><td>${formatDate(fee.due_date || fee.dueDate)}</td></tr>`).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="card">
        <div class="section-title">Library Borrowing</div>
        ${!library || !library.length ? '<p>No borrow history found.</p>' : `
          <table>
            <thead>
              <tr><th>Title</th><th>Borrowed</th><th>Due</th></tr>
            </thead>
            <tbody>
              ${library.map(item => `<tr><td>${item.book_title}</td><td>${formatDate(item.borrow_date)}</td><td>${formatDate(item.due_date)}</td></tr>`).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="card">
        <div class="section-title">Hostel History</div>
        ${!hostel || !hostel.length ? '<p>No hostel booking history.</p>' : `
          <table>
            <thead>
              <tr><th>Block</th><th>Room</th><th>Check-in</th><th>Check-out</th></tr>
            </thead>
            <tbody>
              ${hostel.map(item => `<tr><td>${item.block_name}</td><td>${item.room_number}</td><td>${formatDate(item.check_in)}</td><td>${formatDate(item.check_out)}</td></tr>`).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  } catch (error) {
    console.error('Error rendering student history:', error);
    showToast(error.message || 'Unable to show student history.', 'error');
    historyContainer.innerHTML = '<div class="card"><p>Student data could not be loaded.</p></div>';
  }
}

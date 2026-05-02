-- ============================================================
-- BENEDICT ACADEMY - COMPLETE DATABASE SCHEMA
-- Includes: Students, Parents, Hostel, Library, Calendar
-- ============================================================

-- 1. CORE TABLES (Existing)
CREATE TABLE [dbo].[Classes]
(
    [ClassId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ClassName] NVARCHAR(100) NOT NULL,
    [GradeLevel] INT,
    [Section] NVARCHAR(10),
    [RoomNumber] NVARCHAR(20),
    [Capacity] INT DEFAULT 30,
    [AcademicYear] NVARCHAR(20) DEFAULT '2025-2026',
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [dbo].[Students]
(
    [StudentId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Email] NVARCHAR(255) UNIQUE,
    [Phone] NVARCHAR(20),
    [DateOfBirth] DATE,
    [Gender] NVARCHAR(10),
    [Address] NVARCHAR(500),
    [FaceDescriptor] NVARCHAR(MAX),
    [ClassId] UNIQUEIDENTIFIER NULL,
    [EnrollmentDate] DATE DEFAULT GETDATE(),
    [ParentName] NVARCHAR(200),
    [ParentEmail] NVARCHAR(255),
    [ParentPhone] NVARCHAR(20),
    [ParentRelationship] NVARCHAR(20) DEFAULT 'Father',
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId])
);

CREATE TABLE [dbo].[UserRoles]
(
    [RoleId] INT NOT NULL PRIMARY KEY,
    [RoleName] VARCHAR(20) NOT NULL UNIQUE,
    [Description] VARCHAR(100)
);

INSERT INTO [dbo].[UserRoles] ([RoleId], [RoleName], [Description]) VALUES
(1, 'admin', 'System Administrator'),
(2, 'teacher', 'Teacher'),
(3, 'student', 'Student'),
(4, 'parent', 'Parent'),
(5, 'librarian', 'Librarian'),
(6, 'hostel_manager', 'Hostel Manager'),
(7, 'worker', 'School Worker');

CREATE TABLE [dbo].[Users]
(
    [UserId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(500) NOT NULL,
    [RoleId] INT NOT NULL DEFAULT 3,
    [FirstName] NVARCHAR(100),
    [LastName] NVARCHAR(100),
    [Phone] NVARCHAR(20),
    [StudentId] UNIQUEIDENTIFIER NULL,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([RoleId]) REFERENCES [dbo].[UserRoles]([RoleId]),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId])
);

-- 2. ATTENDANCE & ACADEMIC (Existing)
CREATE TABLE [dbo].[AttendanceStatuses]
(
    [StatusId] INT NOT NULL PRIMARY KEY,
    [StatusName] VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO [dbo].[AttendanceStatuses] ([StatusId], [StatusName]) VALUES
(1, 'present'), (2, 'absent'), (3, 'late'), (4, 'excused');

CREATE TABLE [dbo].[Sessions]
(
    [SessionId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ClassId] UNIQUEIDENTIFIER NOT NULL,
    [SessionDate] DATE NOT NULL DEFAULT GETDATE(),
    [StartTime] TIME NOT NULL,
    [EndTime] TIME NOT NULL,
    [Subject] NVARCHAR(100),
    [RoomNumber] NVARCHAR(20),
    [IsOpen] BIT DEFAULT 1,
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId])
);

CREATE TABLE [dbo].[Attendance]
(
    [SessionId] UNIQUEIDENTIFIER NOT NULL,
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [StatusId] INT NOT NULL DEFAULT 2,
    [Timestamp] DATETIME2 DEFAULT GETDATE(),
    [VerifiedByFace] BIT DEFAULT 0,
    PRIMARY KEY ([SessionId], [StudentId]),
    FOREIGN KEY ([SessionId]) REFERENCES [dbo].[Sessions]([SessionId]),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([StatusId]) REFERENCES [dbo].[AttendanceStatuses]([StatusId])
);

CREATE TABLE [dbo].[FeeStatuses]
(
    [StatusId] INT NOT NULL PRIMARY KEY,
    [StatusName] VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO [dbo].[FeeStatuses] ([StatusId], [StatusName]) VALUES
(1, 'pending'), (2, 'partial'), (3, 'paid'), (4, 'overdue');

CREATE TABLE [dbo].[Fees]
(
    [FeeId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [FeeType] NVARCHAR(50) DEFAULT 'Tuition',
    [Amount] DECIMAL(10, 2) NOT NULL,
    [Paid] DECIMAL(10, 2) DEFAULT 0,
    [DueDate] DATE NOT NULL,
    [StatusId] INT NOT NULL DEFAULT 1,
    [Description] NVARCHAR(500),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([StatusId]) REFERENCES [dbo].[FeeStatuses]([StatusId])
);

CREATE TABLE [dbo].[Assignments]
(
    [AssignmentId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ClassId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [DueDate] DATE NOT NULL,
    [MaxScore] DECIMAL(5, 2) DEFAULT 100,
    [Subject] NVARCHAR(100),
    [IsPublished] BIT DEFAULT 0,
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId])
);

CREATE TABLE [dbo].[Results]
(
    [ResultId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [Subject] NVARCHAR(100) NOT NULL,
    [Grade] NVARCHAR(10) NOT NULL,
    [Score] DECIMAL(5, 2),
    [Semester] NVARCHAR(20),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId])
);

CREATE TABLE [dbo].[Timetables]
(
    [TimetableId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ClassId] UNIQUEIDENTIFIER NOT NULL,
    [DayOfWeek] INT NOT NULL CHECK ([DayOfWeek] BETWEEN 0 AND 6),
    [StartTime] TIME NOT NULL,
    [EndTime] TIME NOT NULL,
    [Subject] NVARCHAR(100) NOT NULL,
    [RoomNumber] NVARCHAR(20),
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId])
);

CREATE TABLE [dbo].[Comments]
(
    [CommentId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ParentId] UNIQUEIDENTIFIER NOT NULL,
    [TeacherId] UNIQUEIDENTIFIER NOT NULL,
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [IsRead] BIT DEFAULT 0,
    [Timestamp] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([ParentId]) REFERENCES [dbo].[Users]([UserId]),
    FOREIGN KEY ([TeacherId]) REFERENCES [dbo].[Users]([UserId]),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId])
);

CREATE TABLE [dbo].[Notifications]
(
    [NotificationId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [IsRead] BIT DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId])
);

-- ============================================================
-- 3. HOSTEL MODULE (NEW)
-- ============================================================

CREATE TABLE [dbo].[HostelBlocks]
(
    [BlockId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [BlockName] NVARCHAR(50) NOT NULL,
    [BlockType] NVARCHAR(20) NOT NULL CHECK ([BlockType] IN ('Male', 'Female', 'Mixed')),
    [TotalRooms] INT NOT NULL DEFAULT 0,
    [FloorCount] INT NOT NULL DEFAULT 1,
    [ManagerId] UNIQUEIDENTIFIER,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([ManagerId]) REFERENCES [dbo].[Users]([UserId])
);

CREATE TABLE [dbo].[HostelRooms]
(
    [RoomId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [BlockId] UNIQUEIDENTIFIER NOT NULL,
    [RoomNumber] NVARCHAR(20) NOT NULL,
    [RoomType] NVARCHAR(20) NOT NULL DEFAULT 'Standard' CHECK ([RoomType] IN ('Standard', 'Deluxe', 'Single', 'Double', 'Triple')),
    [Capacity] INT NOT NULL DEFAULT 2,
    [OccupiedBeds] INT NOT NULL DEFAULT 0,
    [PricePerTerm] DECIMAL(10, 2) NOT NULL DEFAULT 0,
    [Amenities] NVARCHAR(500),
    [IsAvailable] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([BlockId]) REFERENCES [dbo].[HostelBlocks]([BlockId])
);

CREATE TABLE [dbo].[HostelBookings]
(
    [BookingId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [RoomId] UNIQUEIDENTIFIER NOT NULL,
    [AcademicYear] NVARCHAR(20) NOT NULL DEFAULT '2025-2026',
    [Term] NVARCHAR(20) NOT NULL DEFAULT 'First' CHECK ([Term] IN ('First', 'Second', 'Third')),
    [BookingDate] DATE NOT NULL DEFAULT GETDATE(),
    [CheckInDate] DATE,
    [CheckOutDate] DATE,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK ([Status] IN ('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled')),
    [TotalAmount] DECIMAL(10, 2) NOT NULL DEFAULT 0,
    [AmountPaid] DECIMAL(10, 2) DEFAULT 0,
    [Notes] NVARCHAR(500),
    [BookedBy] UNIQUEIDENTIFIER,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([RoomId]) REFERENCES [dbo].[HostelRooms]([RoomId]),
    FOREIGN KEY ([BookedBy]) REFERENCES [dbo].[Users]([UserId])
);

-- ============================================================
-- 4. STUDENT HISTORY MODULE (NEW)
-- ============================================================

CREATE TABLE [dbo].[StudentHistory]
(
    [HistoryId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [RecordType] NVARCHAR(50) NOT NULL CHECK ([RecordType] IN ('Enrollment', 'ClassChange', 'Discipline', 'Achievement', 'Medical', 'Transfer', 'Withdrawal', 'Reinstatement')),
    [RecordDate] DATE NOT NULL DEFAULT GETDATE(),
    [Description] NVARCHAR(MAX) NOT NULL,
    [PreviousValue] NVARCHAR(500),
    [NewValue] NVARCHAR(500),
    [DocumentUrl] NVARCHAR(500),
    [RecordedBy] UNIQUEIDENTIFIER NOT NULL,
    [IsConfidential] BIT DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([RecordedBy]) REFERENCES [dbo].[Users]([UserId])
);

CREATE TABLE [dbo].[DisciplineRecords]
(
    [DisciplineId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [IncidentDate] DATE NOT NULL,
    [IncidentType] NVARCHAR(50) NOT NULL CHECK ([IncidentType] IN ('Minor', 'Major', 'Severe')),
    [Description] NVARCHAR(MAX) NOT NULL,
    [ActionTaken] NVARCHAR(500),
    [ActionDate] DATE,
    [Witnesses] NVARCHAR(500),
    [ReportedBy] UNIQUEIDENTIFIER NOT NULL,
    [ParentNotified] BIT DEFAULT 0,
    [ParentNotificationDate] DATETIME2,
    [Status] NVARCHAR(20) DEFAULT 'Active' CHECK ([Status] IN ('Active', 'Resolved', 'Appealed')),
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([ReportedBy]) REFERENCES [dbo].[Users]([UserId])
);

CREATE TABLE [dbo].[Achievements]
(
    [AchievementId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL CHECK ([Category] IN ('Academic', 'Sports', 'Arts', 'Leadership', 'Community', 'Other')),
    [Description] NVARCHAR(MAX),
    [AwardDate] DATE NOT NULL,
    [AwardedBy] NVARCHAR(200),
    [CertificateUrl] NVARCHAR(500),
    [Points] INT DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId])
);

-- ============================================================
-- 5. LIBRARY MODULE (NEW)
-- ============================================================

CREATE TABLE [dbo].[BookCategories]
(
    [CategoryId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [CategoryName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500),
    [IsActive] BIT DEFAULT 1
);

INSERT INTO [dbo].[BookCategories] ([CategoryName], [Description]) VALUES
('Fiction', 'Novels and stories'),
('Science', 'Science and technology'),
('Mathematics', 'Math textbooks and references'),
('History', 'Historical books and biographies'),
('Literature', 'Classic and modern literature'),
('Reference', 'Dictionaries and encyclopedias');

CREATE TABLE [dbo].[Books]
(
    [BookId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [ISBN] NVARCHAR(20) UNIQUE,
    [Title] NVARCHAR(200) NOT NULL,
    [Author] NVARCHAR(200) NOT NULL,
    [Publisher] NVARCHAR(200),
    [PublicationYear] INT,
    [CategoryId] UNIQUEIDENTIFIER,
    [Edition] NVARCHAR(50),
    [Pages] INT,
    [Language] NVARCHAR(50) DEFAULT 'English',
    [ShelfLocation] NVARCHAR(50),
    [TotalCopies] INT NOT NULL DEFAULT 1,
    [AvailableCopies] INT NOT NULL DEFAULT 1,
    [Price] DECIMAL(10, 2),
    [Condition] NVARCHAR(20) DEFAULT 'Good' CHECK ([Condition] IN ('New', 'Good', 'Fair', 'Poor')),
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[BookCategories]([CategoryId])
);

CREATE TABLE [dbo].[BookBorrows]
(
    [BorrowId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [BookId] UNIQUEIDENTIFIER NOT NULL,
    [StudentId] UNIQUEIDENTIFIER NOT NULL,
    [BorrowDate] DATE NOT NULL DEFAULT GETDATE(),
    [DueDate] DATE NOT NULL,
    [ReturnDate] DATE,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Borrowed' CHECK ([Status] IN ('Borrowed', 'Returned', 'Overdue', 'Lost', 'Damaged')),
    [FineAmount] DECIMAL(10, 2) DEFAULT 0,
    [FinePaid] BIT DEFAULT 0,
    [IssuedBy] UNIQUEIDENTIFIER NOT NULL,
    [ReceivedBy] UNIQUEIDENTIFIER,
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY ([BookId]) REFERENCES [dbo].[Books]([BookId]),
    FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Students]([StudentId]),
    FOREIGN KEY ([IssuedBy]) REFERENCES [dbo].[Users]([UserId]),
    FOREIGN KEY ([ReceivedBy]) REFERENCES [dbo].[Users]([UserId])
);

-- ============================================================
-- 6. SCHOOL CALENDAR MODULE (NEW) - Admin Controlled
-- ============================================================

CREATE TABLE [dbo].[CalendarEventTypes]
(
    [EventTypeId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [TypeName] NVARCHAR(50) NOT NULL UNIQUE,
    [ColorCode] NVARCHAR(7) NOT NULL DEFAULT '#6366F1',
    [Icon] NVARCHAR(50),
    [IsActive] BIT DEFAULT 1
);

INSERT INTO [dbo].[CalendarEventTypes] ([TypeName], [ColorCode], [Icon]) VALUES
('Holiday', '#EF4444', 'calendar'),
('Exam', '#F59E0B', 'document'),
('Sports', '#10B981', 'trophy'),
('Meeting', '#6366F1', 'people'),
('Event', '#8B5CF6', 'star'),
('Deadline', '#EC4899', 'clock'),
('Trip', '#06B6D4', 'bus'),
('ParentTeacher', '#84CC16', 'chat');

CREATE TABLE [dbo].[SchoolCalendar]
(
    [EventId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [EventTypeId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [StartDate] DATE NOT NULL,
    [EndDate] DATE,
    [StartTime] TIME,
    [EndTime] TIME,
    [Location] NVARCHAR(200),
    [IsAllDay] BIT DEFAULT 0,
    [IsRecurring] BIT DEFAULT 0,
    [RecurrencePattern] NVARCHAR(100),
    [TargetAudience] NVARCHAR(100) NOT NULL DEFAULT 'All' CHECK ([TargetAudience] IN ('All', 'Students', 'Parents', 'Teachers', 'Staff', 'Admin')),
    [ClassId] UNIQUEIDENTIFIER,
    [IsPublic] BIT DEFAULT 1,
    [RequiresRegistration] BIT DEFAULT 0,
    [MaxAttendees] INT,
    [CreatedBy] UNIQUEIDENTIFIER NOT NULL,
    [LastModifiedBy] UNIQUEIDENTIFIER,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETDATE(),
    [IsActive] BIT DEFAULT 1,
    FOREIGN KEY ([EventTypeId]) REFERENCES [dbo].[CalendarEventTypes]([EventTypeId]),
    FOREIGN KEY ([ClassId]) REFERENCES [dbo].[Classes]([ClassId]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId]),
    FOREIGN KEY ([LastModifiedBy]) REFERENCES [dbo].[Users]([UserId])
);

CREATE TABLE [dbo].[CalendarEventAttendees]
(
    [AttendeeId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [EventId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [RegistrationDate] DATETIME2 DEFAULT GETDATE(),
    [AttendanceStatus] NVARCHAR(20) DEFAULT 'Registered' CHECK ([AttendanceStatus] IN ('Registered', 'Attended', 'Absent', 'Cancelled')),
    [Notes] NVARCHAR(500),
    FOREIGN KEY ([EventId]) REFERENCES [dbo].[SchoolCalendar]([EventId]),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId])
);

-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IX_Students_Class ON [dbo].[Students]([ClassId]);
CREATE INDEX IX_Students_ParentEmail ON [dbo].[Students]([ParentEmail]);
CREATE INDEX IX_Users_Role ON [dbo].[Users]([RoleId]);
CREATE INDEX IX_Attendance_Student ON [dbo].[Attendance]([StudentId]);
CREATE INDEX IX_Fees_Student ON [dbo].[Fees]([StudentId]);
CREATE INDEX IX_Results_Student ON [dbo].[Results]([StudentId]);
CREATE INDEX IX_Comments_Parent ON [dbo].[Comments]([ParentId]);
CREATE INDEX IX_Comments_Student ON [dbo].[Comments]([StudentId]);
CREATE INDEX IX_Notifications_User ON [dbo].[Notifications]([UserId]);

-- Hostel Indexes
CREATE INDEX IX_HostelRooms_Block ON [dbo].[HostelRooms]([BlockId]);
CREATE INDEX IX_HostelRooms_Available ON [dbo].[HostelRooms]([IsAvailable]);
CREATE INDEX IX_HostelBookings_Student ON [dbo].[HostelBookings]([StudentId]);
CREATE INDEX IX_HostelBookings_Room ON [dbo].[HostelBookings]([RoomId]);
CREATE INDEX IX_HostelBookings_Status ON [dbo].[HostelBookings]([Status]);

-- Student History Indexes
CREATE INDEX IX_StudentHistory_Student ON [dbo].[StudentHistory]([StudentId]);
CREATE INDEX IX_StudentHistory_Type ON [dbo].[StudentHistory]([RecordType]);
CREATE INDEX IX_Discipline_Student ON [dbo].[DisciplineRecords]([StudentId]);
CREATE INDEX IX_Achievements_Student ON [dbo].[Achievements]([StudentId]);

-- Library Indexes
CREATE INDEX IX_Books_Category ON [dbo].[Books]([CategoryId]);
CREATE INDEX IX_Books_ISBN ON [dbo].[Books]([ISBN]);
CREATE INDEX IX_BookBorrows_Book ON [dbo].[BookBorrows]([BookId]);
CREATE INDEX IX_BookBorrows_Student ON [dbo].[BookBorrows]([StudentId]);
CREATE INDEX IX_BookBorrows_Status ON [dbo].[BookBorrows]([Status]);
CREATE INDEX IX_BookBorrows_DueDate ON [dbo].[BookBorrows]([DueDate]);

-- Calendar Indexes
CREATE INDEX IX_Calendar_Type ON [dbo].[SchoolCalendar]([EventTypeId]);
CREATE INDEX IX_Calendar_StartDate ON [dbo].[SchoolCalendar]([StartDate]);
CREATE INDEX IX_Calendar_Target ON [dbo].[SchoolCalendar]([TargetAudience]);
CREATE INDEX IX_Calendar_Class ON [dbo].[SchoolCalendar]([ClassId]);
CREATE INDEX IX_Calendar_Active ON [dbo].[SchoolCalendar]([IsActive]);
CREATE INDEX IX_CalendarAttendees_Event ON [dbo].[CalendarEventAttendees]([EventId]);

PRINT 'Benedict Academy Complete Schema Created Successfully!';
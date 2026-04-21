-- Benedict Academy - Student & Parent Database Schema
-- Replace everything in your Table1.sql with this code

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
(4, 'parent', 'Parent');

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
-- ============================================
-- SchoolVibe AI Tracker - Database Schema
-- Run this first in Supabase SQL Editor
-- ============================================

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (for authentication)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. STUDENTS TABLE (main table with face data)
-- ============================================
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_number VARCHAR(50) UNIQUE,
    face_descriptors JSONB, -- Stores 128-dimensional face vectors
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CLASSES TABLE
-- ============================================
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES users(id),
    room_number VARCHAR(50),
    schedule JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. SESSIONS TABLE (class instances)
-- ============================================
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(class_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. ENROLLMENTS TABLE (student-class links)
-- ============================================
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(class_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- ============================================
-- 6. ATTENDANCE TABLE (core tracking table)
-- ============================================
CREATE TABLE attendance (
    session_id INTEGER REFERENCES sessions(session_id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    facial_confidence DECIMAL(5,4) CHECK (facial_confidence >= 0 AND facial_confidence <= 1),
    verification_method VARCHAR(50) DEFAULT 'facial_recognition',
    marked_by UUID REFERENCES users(id),
    reason TEXT,
    PRIMARY KEY (session_id, student_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_active ON students(is_active);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_class ON sessions(class_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_timestamp ON attendance(timestamp);
CREATE INDEX idx_attendance_status ON attendance(status);

-- GIN index for face descriptor searches
CREATE INDEX idx_students_face_descriptors ON students USING GIN (face_descriptors);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Students: Teachers can see all, students only themselves
CREATE POLICY students_teacher_policy ON students
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' IN ('teacher', 'admin'));

CREATE POLICY students_self_policy ON students
    FOR SELECT TO authenticated
    USING (student_id::text = auth.jwt() ->> 'student_id');

-- Classes: Everyone can view active classes
CREATE POLICY classes_view_policy ON classes
    FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY classes_admin_policy ON classes
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Attendance: Teachers see all, students see own
CREATE POLICY attendance_teacher_policy ON attendance
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' IN ('teacher', 'admin'));

CREATE POLICY attendance_self_policy ON attendance
    FOR SELECT TO authenticated
    USING (student_id::text = auth.jwt() ->> 'student_id');
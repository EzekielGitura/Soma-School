CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS class_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) NOT NULL UNIQUE,
  teacher_name VARCHAR(120),
  academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2024 AND 2100),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no VARCHAR(32) NOT NULL UNIQUE,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  gender VARCHAR(20),
  date_of_birth DATE,
  guardian_name VARCHAR(120),
  guardian_phone VARCHAR(40),
  class_stream_id UUID NOT NULL REFERENCES class_streams(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL UNIQUE,
  teacher_name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_stream_id UUID NOT NULL REFERENCES class_streams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (class_stream_id, subject_id)
);

CREATE TABLE IF NOT EXISTS assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term VARCHAR(24) NOT NULL,
  academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2024 AND 2100),
  cat_score NUMERIC(5, 2) NOT NULL CHECK (cat_score BETWEEN 0 AND 30),
  exam_score NUMERIC(5, 2) NOT NULL CHECK (exam_score BETWEEN 0 AND 100),
  total_score NUMERIC(5, 2) GENERATED ALWAYS AS (cat_score + exam_score) STORED,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, subject_id, term, academic_year)
);

CREATE TABLE IF NOT EXISTS grade_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(8) NOT NULL UNIQUE,
  min_score NUMERIC(5, 2) NOT NULL CHECK (min_score BETWEEN 0 AND 130),
  max_score NUMERIC(5, 2) NOT NULL CHECK (max_score BETWEEN 0 AND 130),
  points INTEGER NOT NULL CHECK (points BETWEEN 0 AND 12),
  remark VARCHAR(120),
  sort_order INTEGER NOT NULL UNIQUE,
  CHECK (min_score <= max_score)
);

ALTER TABLE assessment_scores
  DROP CONSTRAINT IF EXISTS assessment_scores_exam_score_check;

ALTER TABLE assessment_scores
  ADD CONSTRAINT assessment_scores_exam_score_check CHECK (exam_score BETWEEN 0 AND 100);

ALTER TABLE grade_boundaries
  DROP CONSTRAINT IF EXISTS grade_boundaries_min_score_check;

ALTER TABLE grade_boundaries
  DROP CONSTRAINT IF EXISTS grade_boundaries_max_score_check;

ALTER TABLE grade_boundaries
  ADD CONSTRAINT grade_boundaries_min_score_check CHECK (min_score BETWEEN 0 AND 130);

ALTER TABLE grade_boundaries
  ADD CONSTRAINT grade_boundaries_max_score_check CHECK (max_score BETWEEN 0 AND 130);

CREATE INDEX IF NOT EXISTS idx_students_class_stream ON students(class_stream_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_student_term ON assessment_scores(student_id, term, academic_year);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_subject_term ON assessment_scores(subject_id, term, academic_year);

INSERT INTO class_streams (name, teacher_name, academic_year, capacity)
VALUES
  ('Form 1A', 'Mary Wanjiku', 2026, 45),
  ('Form 1B', 'Daniel Otieno', 2026, 45),
  ('Form 2A', 'Faith Achieng', 2026, 42)
ON CONFLICT (name) DO UPDATE SET
  teacher_name = EXCLUDED.teacher_name,
  academic_year = EXCLUDED.academic_year,
  capacity = EXCLUDED.capacity,
  updated_at = NOW();

INSERT INTO subjects (code, name, teacher_name)
VALUES
  ('ENG', 'English', 'Grace Kimani'),
  ('MAT', 'Mathematics', 'Peter Njuguna'),
  ('BIO', 'Biology', 'Lydia Chebet'),
  ('HIS', 'History', 'James Mwangi')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  teacher_name = EXCLUDED.teacher_name,
  updated_at = NOW();

INSERT INTO stream_subjects (class_stream_id, subject_id)
SELECT cs.id, s.id
FROM class_streams cs
CROSS JOIN subjects s
WHERE cs.name IN ('Form 1A', 'Form 1B', 'Form 2A')
ON CONFLICT (class_stream_id, subject_id) DO NOTHING;

INSERT INTO students (
  admission_no,
  first_name,
  last_name,
  gender,
  guardian_name,
  guardian_phone,
  class_stream_id
)
VALUES
  ('IA-001', 'Alice', 'Njeri', 'Female', 'Joseph Njeri', '+254700000001', (SELECT id FROM class_streams WHERE name = 'Form 1A')),
  ('IA-002', 'Brian', 'Omondi', 'Male', 'Esther Omondi', '+254700000002', (SELECT id FROM class_streams WHERE name = 'Form 1A')),
  ('IA-003', 'Carol', 'Wambui', 'Female', 'Samuel Wambui', '+254700000003', (SELECT id FROM class_streams WHERE name = 'Form 1B')),
  ('IA-004', 'David', 'Kiptoo', 'Male', 'Ruth Kiptoo', '+254700000004', (SELECT id FROM class_streams WHERE name = 'Form 2A'))
ON CONFLICT (admission_no) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  gender = EXCLUDED.gender,
  guardian_name = EXCLUDED.guardian_name,
  guardian_phone = EXCLUDED.guardian_phone,
  class_stream_id = EXCLUDED.class_stream_id,
  updated_at = NOW();

INSERT INTO grade_boundaries (label, min_score, max_score, points, remark, sort_order)
VALUES
  ('A', 80, 100, 12, 'Excellent', 1),
  ('B', 65, 79.99, 9, 'Very good', 2),
  ('C', 50, 64.99, 6, 'Satisfactory', 3),
  ('D', 35, 49.99, 3, 'Needs support', 4),
  ('E', 0, 34.99, 1, 'Critical support', 5)
ON CONFLICT (label) DO UPDATE SET
  min_score = EXCLUDED.min_score,
  max_score = EXCLUDED.max_score,
  points = EXCLUDED.points,
  remark = EXCLUDED.remark,
  sort_order = EXCLUDED.sort_order;

INSERT INTO assessment_scores (student_id, subject_id, term, academic_year, cat_score, exam_score, remarks)
VALUES
  ((SELECT id FROM students WHERE admission_no = 'IA-001'), (SELECT id FROM subjects WHERE code = 'ENG'), 'Term 1', 2026, 24, 58, 'Strong comprehension'),
  ((SELECT id FROM students WHERE admission_no = 'IA-001'), (SELECT id FROM subjects WHERE code = 'MAT'), 'Term 1', 2026, 21, 52, 'Good progress'),
  ((SELECT id FROM students WHERE admission_no = 'IA-001'), (SELECT id FROM subjects WHERE code = 'BIO'), 'Term 1', 2026, 25, 60, 'Excellent lab work'),
  ((SELECT id FROM students WHERE admission_no = 'IA-002'), (SELECT id FROM subjects WHERE code = 'ENG'), 'Term 1', 2026, 20, 45, 'Improving steadily'),
  ((SELECT id FROM students WHERE admission_no = 'IA-002'), (SELECT id FROM subjects WHERE code = 'MAT'), 'Term 1', 2026, 26, 62, 'Top performance'),
  ((SELECT id FROM students WHERE admission_no = 'IA-002'), (SELECT id FROM subjects WHERE code = 'BIO'), 'Term 1', 2026, 18, 42, 'Revise practicals'),
  ((SELECT id FROM students WHERE admission_no = 'IA-003'), (SELECT id FROM subjects WHERE code = 'ENG'), 'Term 1', 2026, 22, 50, 'Consistent'),
  ((SELECT id FROM students WHERE admission_no = 'IA-003'), (SELECT id FROM subjects WHERE code = 'MAT'), 'Term 1', 2026, 19, 43, 'Needs more practice'),
  ((SELECT id FROM students WHERE admission_no = 'IA-004'), (SELECT id FROM subjects WHERE code = 'ENG'), 'Term 1', 2026, 23, 54, 'Good writing'),
  ((SELECT id FROM students WHERE admission_no = 'IA-004'), (SELECT id FROM subjects WHERE code = 'HIS'), 'Term 1', 2026, 27, 61, 'Excellent analysis')
ON CONFLICT (student_id, subject_id, term, academic_year) DO UPDATE SET
  cat_score = EXCLUDED.cat_score,
  exam_score = EXCLUDED.exam_score,
  remarks = EXCLUDED.remarks,
  updated_at = NOW();

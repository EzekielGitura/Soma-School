INSERT INTO class_streams (name, teacher_name, academic_year, capacity)
VALUES
  ('Form 1A', 'Mary Wanjiku', 2026, 45),
  ('Form 1B', 'Daniel Otieno', 2026, 45),
  ('Form 2A', 'Faith Achieng', 2026, 42),
  ('Form 2B', 'Samuel Kariuki', 2026, 42),
  ('Form 3A', 'Mercy Atieno', 2026, 40),
  ('Form 3B', 'John Kiprono', 2026, 40),
  ('Form 4A', 'Esther Mutiso', 2026, 38),
  ('Form 4B', 'Patrick Mwenda', 2026, 38)
ON CONFLICT (name) DO UPDATE SET
  teacher_name = EXCLUDED.teacher_name,
  academic_year = EXCLUDED.academic_year,
  capacity = EXCLUDED.capacity,
  updated_at = NOW();

INSERT INTO subjects (code, name, teacher_name)
VALUES
  ('ENG', 'English', 'Grace Kimani'),
  ('ENGACT', 'English Activities', NULL),
  ('KIS', 'Kiswahili', NULL),
  ('MAT', 'Mathematics', 'Peter Njuguna'),
  ('MATACT', 'Mathematical Activities', NULL),
  ('ENVACT', 'Environmental Activities', NULL),
  ('SCITECH', 'Science and Technology', NULL),
  ('INTSCI', 'Integrated Science', NULL),
  ('BIO', 'Biology', 'Lydia Chebet'),
  ('CHEM', 'Chemistry', NULL),
  ('PHY', 'Physics', NULL),
  ('AGR', 'Agriculture', NULL),
  ('AGRNU', 'Agriculture and Nutrition', NULL),
  ('HSCI', 'Home Science', NULL),
  ('FNU', 'Food and Nutrition', NULL),
  ('HED', 'Health Education', NULL),
  ('HLSCI', 'Health Science', NULL),
  ('SST', 'Social Studies', NULL),
  ('HIS', 'History and Citizenship', 'James Mwangi'),
  ('GEO', 'Geography', NULL),
  ('BUS', 'Business Studies', NULL),
  ('LIFE', 'Life Skills Education', NULL),
  ('PRETECH', 'Pre-Technical Studies', NULL),
  ('PRECARR', 'Pre-Technical and Pre-Career Education', NULL),
  ('COMSCI', 'Computer Science', NULL),
  ('ICT', 'ICT / Digital Literacy, mainly as an integrated tool', NULL),
  ('CRACT', 'Creative Activities', NULL),
  ('CRART', 'Creative Arts', NULL),
  ('VISART', 'Visual Arts', NULL),
  ('PERFART', 'Performing Arts', NULL),
  ('FINEART', 'Fine Arts', NULL),
  ('MUSDAN', 'Music and Dance', NULL),
  ('THEFILM', 'Theatre and Film', NULL),
  ('SPE', 'Sports and Physical Education', NULL),
  ('SPREC', 'Sports and Recreation', NULL),
  ('PSYCRE', 'Psychomotor and Creative Activities', NULL),
  ('MOVACT', 'Movement Activities', NULL),
  ('CRE', 'Christian Religious Education, CRE', NULL),
  ('IRE', 'Islamic Religious Education, IRE', NULL),
  ('HRE', 'Hindu Religious Education, HRE', NULL),
  ('RELACT', 'Religious Education Activities', NULL),
  ('INDLANG', 'Indigenous Language', NULL),
  ('INDLACT', 'Indigenous Language Activities', NULL),
  ('KSL', 'Kenya Sign Language', NULL),
  ('ARAB', 'Arabic', NULL),
  ('FRE', 'French', NULL),
  ('GER', 'German', NULL),
  ('MAN', 'Mandarin', NULL),
  ('LITENG', 'Literature in English', NULL),
  ('FASKIS', 'Fasihi ya Kiswahili', NULL),
  ('BCON', 'Building Construction', NULL),
  ('ELEC', 'Electricity', NULL),
  ('METAL', 'Metalwork', NULL),
  ('WOOD', 'Woodwork', NULL),
  ('PMECH', 'Power Mechanics', NULL),
  ('MEDIA', 'Media Technology', NULL),
  ('MARFISH', 'Marine and Fisheries Technology', NULL),
  ('MANUF', 'Manufacturing', NULL),
  ('AVTECH', 'Aviation Technology', NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  teacher_name = COALESCE(EXCLUDED.teacher_name, subjects.teacher_name),
  updated_at = NOW();

DELETE FROM stream_subjects ss
USING class_streams cs
WHERE ss.class_stream_id = cs.id
  AND cs.name IN (
    'Form 1A',
    'Form 1B',
    'Form 2A',
    'Form 2B',
    'Form 3A',
    'Form 3B',
    'Form 4A',
    'Form 4B'
  );

INSERT INTO stream_subjects (class_stream_id, subject_id)
SELECT cs.id, sub.id
FROM (
  VALUES
    ('Form 1A', 'junior_science'),
    ('Form 1B', 'junior_humanities'),
    ('Form 2A', 'technical'),
    ('Form 2B', 'arts_languages'),
    ('Form 3A', 'stem'),
    ('Form 3B', 'business_humanities'),
    ('Form 4A', 'technical'),
    ('Form 4B', 'arts_languages')
) AS stream_profile(stream_name, profile)
JOIN (
  VALUES
    ('junior_science', 'ENG'),
    ('junior_science', 'KIS'),
    ('junior_science', 'MAT'),
    ('junior_science', 'INTSCI'),
    ('junior_science', 'BIO'),
    ('junior_science', 'AGRNU'),
    ('junior_science', 'SST'),
    ('junior_science', 'CRE'),
    ('junior_science', 'COMSCI'),
    ('junior_science', 'PRETECH'),
    ('junior_science', 'BUS'),
    ('junior_science', 'CRART'),
    ('junior_science', 'SPE'),
    ('junior_humanities', 'ENG'),
    ('junior_humanities', 'KIS'),
    ('junior_humanities', 'MAT'),
    ('junior_humanities', 'INTSCI'),
    ('junior_humanities', 'CRE'),
    ('junior_humanities', 'IRE'),
    ('junior_humanities', 'HIS'),
    ('junior_humanities', 'GEO'),
    ('junior_humanities', 'BUS'),
    ('junior_humanities', 'LITENG'),
    ('junior_humanities', 'FASKIS'),
    ('junior_humanities', 'FRE'),
    ('junior_humanities', 'GER'),
    ('junior_humanities', 'CRART'),
    ('junior_humanities', 'MUSDAN'),
    ('junior_humanities', 'THEFILM'),
    ('junior_humanities', 'SPE'),
    ('stem', 'ENG'),
    ('stem', 'KIS'),
    ('stem', 'MAT'),
    ('stem', 'BIO'),
    ('stem', 'CHEM'),
    ('stem', 'PHY'),
    ('stem', 'AGR'),
    ('stem', 'COMSCI'),
    ('stem', 'ICT'),
    ('stem', 'HLSCI'),
    ('stem', 'SPE'),
    ('business_humanities', 'ENG'),
    ('business_humanities', 'KIS'),
    ('business_humanities', 'MAT'),
    ('business_humanities', 'BUS'),
    ('business_humanities', 'HIS'),
    ('business_humanities', 'GEO'),
    ('business_humanities', 'CRE'),
    ('business_humanities', 'IRE'),
    ('business_humanities', 'LIFE'),
    ('business_humanities', 'LITENG'),
    ('business_humanities', 'FASKIS'),
    ('business_humanities', 'FRE'),
    ('business_humanities', 'SPE'),
    ('technical', 'ENG'),
    ('technical', 'KIS'),
    ('technical', 'MAT'),
    ('technical', 'BIO'),
    ('technical', 'CHEM'),
    ('technical', 'PHY'),
    ('technical', 'AGR'),
    ('technical', 'COMSCI'),
    ('technical', 'PRETECH'),
    ('technical', 'BCON'),
    ('technical', 'ELEC'),
    ('technical', 'METAL'),
    ('technical', 'WOOD'),
    ('technical', 'PMECH'),
    ('technical', 'MEDIA'),
    ('technical', 'MANUF'),
    ('technical', 'AVTECH'),
    ('technical', 'BUS'),
    ('technical', 'SPE'),
    ('arts_languages', 'ENG'),
    ('arts_languages', 'KIS'),
    ('arts_languages', 'MAT'),
    ('arts_languages', 'LITENG'),
    ('arts_languages', 'FASKIS'),
    ('arts_languages', 'FRE'),
    ('arts_languages', 'GER'),
    ('arts_languages', 'ARAB'),
    ('arts_languages', 'MAN'),
    ('arts_languages', 'CRART'),
    ('arts_languages', 'VISART'),
    ('arts_languages', 'PERFART'),
    ('arts_languages', 'FINEART'),
    ('arts_languages', 'MUSDAN'),
    ('arts_languages', 'THEFILM'),
    ('arts_languages', 'SPE'),
    ('arts_languages', 'BUS')
) AS profile_subject(profile, subject_code)
  ON profile_subject.profile = stream_profile.profile
JOIN class_streams cs ON cs.name = stream_profile.stream_name
JOIN subjects sub ON sub.code = profile_subject.subject_code
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
  ('A', 104, 130, 12, 'Excellent', 1),
  ('B', 84.5, 103.99, 9, 'Very good', 2),
  ('C', 65, 84.49, 6, 'Satisfactory', 3),
  ('D', 45.5, 64.99, 3, 'Needs support', 4),
  ('E', 0, 45.49, 1, 'Critical support', 5)
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

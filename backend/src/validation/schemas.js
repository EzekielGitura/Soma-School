import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .nullable()
  .optional();

const requiredText = (field) =>
  z.string().trim().min(1, `${field} is required`);

export const classStreamSchema = z.object({
  name: requiredText("Class stream name").max(40),
  teacherName: optionalText,
  academicYear: z.coerce.number().int().min(2024).max(2100),
  capacity: z
    .union([z.literal(""), z.coerce.number().int().positive()])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
});

export const studentSchema = z.object({
  admissionNo: requiredText("Admission number").max(32),
  firstName: requiredText("First name").max(60),
  lastName: requiredText("Last name").max(60),
  gender: optionalText,
  dateOfBirth: z
    .string()
    .trim()
    .transform((value) => (value.length ? value : null))
    .nullable()
    .optional(),
  guardianName: optionalText,
  guardianPhone: optionalText,
  classStreamId: requiredText("Class stream"),
});

export const subjectSchema = z.object({
  code: requiredText("Subject code").max(12).transform((value) => value.toUpperCase()),
  name: requiredText("Subject name").max(80),
  teacherName: optionalText,
  streamIds: z.array(z.string().uuid()).default([]),
});

export const scoreSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  term: requiredText("Term").max(24),
  academicYear: z.coerce.number().int().min(2024).max(2100),
  catScore: z.coerce.number().min(0).max(30),
  examScore: z.coerce.number().min(0).max(70),
  remarks: optionalText,
});

export const gradeBoundarySchema = z
  .object({
    label: requiredText("Grade label").max(8).transform((value) => value.toUpperCase()),
    minScore: z.coerce.number().min(0).max(100),
    maxScore: z.coerce.number().min(0).max(100),
    points: z.coerce.number().int().min(0).max(12),
    remark: optionalText,
    sortOrder: z.coerce.number().int().min(1).max(50),
  })
  .refine((value) => value.minScore <= value.maxScore, {
    message: "Minimum score must be less than or equal to maximum score",
    path: ["minScore"],
  });

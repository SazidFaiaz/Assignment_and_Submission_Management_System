export type Role = 'admin' | 'teacher' | 'student';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  department: string;
  term: string;
  created_at: string;
};

export type CourseMember = {
  course_id: string;
  user_id: string;
  member_role: 'teacher' | 'student';
  created_at: string;
};

export type Assignment = {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string;
  deadline: string;
  max_marks: number;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
};

export type SubmissionStatus = 'submitted' | 'late' | 'graded' | 'returned';

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  answer: string;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  submitted_at: string;
  updated_at: string;
};

export type AssignmentWithCourse = Assignment & {
  courses: Pick<Course, 'id' | 'code' | 'name'>;
};

export type SubmissionWithAssignment = Submission & {
  assignments: Pick<Assignment, 'id' | 'title' | 'max_marks' | 'deadline'> & {
    courses: Pick<Course, 'id' | 'code' | 'name'>;
  };
};

export type SubmissionWithStudent = Submission & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'email'>;
};

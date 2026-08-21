# MERN Conversion Templates

This file provides templates for converting the remaining pages from Supabase to the API Client.

## Template 1: Simple List Page

### OLD - Using Supabase
```typescript
'use client';
import { supabase } from '@/lib/supabase';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      setCourses(data ?? []);
    })();
  }, []);

  return (
    // JSX
  );
}
```

### NEW - Using API Client
```typescript
'use client';
import { APIClient } from '@/lib/api-client';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await APIClient.getCourses();
        setCourses(response.data ?? []);
      } catch (error) {
        console.error('Failed to load courses', error);
      }
    })();
  }, []);

  return (
    // JSX
  );
}
```

---

## Template 2: Detail Page with Related Data

### OLD - Using Supabase
```typescript
export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('assignments')
        .select('*, courses(id, code, name)')
        .eq('id', params.id)
        .single();
      setAssignment(data);
    })();
  }, [params.id]);
}
```

### NEW - Using API Client
```typescript
export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  useEffect(() => {
    (async () => {
      try {
        const assignment = await APIClient.getAssignment(params.id);
        setAssignment(assignment);
      } catch (error) {
        console.error('Failed to load assignment', error);
      }
    })();
  }, [params.id]);
}
```

---

## Template 3: CRUD Operations

### OLD - Using Supabase
```typescript
// CREATE
const { data, error } = await supabase
  .from('assignments')
  .insert([{
    course_id: courseId,
    teacher_id: teacherId,
    title: title,
    max_marks: maxMarks,
  }]);

// UPDATE
const { error } = await supabase
  .from('assignments')
  .update({ status: 'published' })
  .eq('id', assignmentId);

// DELETE
const { error } = await supabase
  .from('assignments')
  .delete()
  .eq('id', assignmentId);
```

### NEW - Using API Client
```typescript
// CREATE
const result = await APIClient.createAssignment({
  courseId: courseId,
  title: title,
  maxMarks: maxMarks,
});

// UPDATE
const result = await APIClient.updateAssignment(assignmentId, {
  status: 'published',
});

// DELETE
const result = await APIClient.deleteAssignment(assignmentId);
```

---

## Template 4: Filtered Queries

### OLD - Using Supabase
```typescript
const { data: submissions } = await supabase
  .from('submissions')
  .select('*, assignments(id, title)')
  .eq('student_id', studentId)
  .eq('status', 'graded')
  .order('submitted_at', { ascending: false });
```

### NEW - Using API Client
```typescript
const response = await APIClient.getSubmissions(
  undefined, // assignmentId filter
  studentId  // studentId filter
);

// Filter locally if needed
const graded = response.data?.filter(s => s.status === 'graded') ?? [];
```

---

## Template 5: Form Submission

### OLD - Using Supabase
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: profile.id,
        answer: formData.answer,
      });
    
    if (error) throw error;
    toast.success('Assignment submitted');
  } catch (error) {
    toast.error('Failed to submit');
  }
};
```

### NEW - Using API Client
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    await APIClient.submitAssignment(
      assignmentId,
      formData.answer
    );
    toast.success('Assignment submitted');
  } catch (error) {
    toast.error('Failed to submit');
  }
};
```

---

## Field Name Mapping Reference

```typescript
// Common field mappings
'id' → '_id' (MongoDB ID)
'max_marks' → 'maxMarks'
'min_marks' → 'minMarks'
'created_at' → 'createdAt'
'updated_at' → 'updatedAt'
'submitted_at' → 'submittedAt'
'course_id' → 'courseId'
'user_id' → 'userId'
'student_id' → 'studentId'
'teacher_id' → 'teacherId'
'assignment_id' → 'assignmentId'
'full_name' → 'fullName'
'avatar_url' → 'avatarUrl'

// Nested objects are populated
supabase: 'courses(id, code, name)'
API: 'courseId.code', 'courseId.name'
```

---

## Quick Conversion Checklist

For each page that needs conversion:

- [ ] Remove `import { supabase } from '@/lib/supabase'`
- [ ] Add `import { APIClient } from '@/lib/api-client'`
- [ ] Replace all `supabase.from()` calls with `APIClient.*` methods
- [ ] Update field names (max_marks → maxMarks, etc.)
- [ ] Wrap API calls in try-catch blocks
- [ ] Update JSX to use new field names
- [ ] Test the page functionality
- [ ] Handle loading and error states

---

## Error Handling Pattern

```typescript
try {
  const data = await APIClient.getMethod(...);
  setData(data);
} catch (error) {
  console.error('Operation failed:', error);
  // Optionally show user-friendly error
  if (error instanceof Error) {
    showErrorMessage(error.message);
  }
}
```

---

## Authentication Context Usage

```typescript
import { useAuth } from '@/lib/auth-context';

export default function MyComponent() {
  const { user, profile, loading, signIn, signOut } = useAuth();

  // user: { id, email }
  // profile: { id, email, full_name, role, avatar_url, created_at }
  // loading: boolean
  // signIn: (email: string, password: string) => Promise
  // signOut: () => Promise
}
```

---

## Pages Needing Conversion

### 1. app/dashboard/assignments/[id]/page.tsx
**Pattern**: Detail page with single assignment fetch
**Key Changes**: 
- Replace `supabase.from('assignments').select(...).eq('id', id)`
- With: `APIClient.getAssignment(id)`

### 2. app/dashboard/assignments/[id]/edit/page.tsx
**Pattern**: Form page with update operation
**Key Changes**:
- Load: `APIClient.getAssignment(id)`
- Update: `APIClient.updateAssignment(id, data)`

### 3. app/dashboard/assignments/new/page.tsx
**Pattern**: Form page with create operation
**Key Changes**:
- Create: `APIClient.createAssignment(data)`

### 4. app/dashboard/courses/page.tsx
**Pattern**: List page with admin CRUD
**Key Changes**:
- List: `APIClient.getCourses()`
- Create: `APIClient.createCourse(data)`
- Update: `APIClient.updateCourse(id, data)`
- Delete: `APIClient.deleteCourse(id)`

### 5. app/dashboard/submissions/page.tsx
**Pattern**: List page with filtering
**Key Changes**:
- List: `APIClient.getSubmissions(assignmentId, studentId)`
- Filter by role/user

### 6. app/dashboard/submissions/[id]/page.tsx
**Pattern**: Detail page with grading
**Key Changes**:
- Load: `APIClient.getSubmission(id)`
- Grade: `APIClient.gradeSubmission(id, marks, feedback)`

### 7. app/dashboard/users/page.tsx
**Pattern**: Admin user management
**Key Changes**:
- List: `APIClient.getUsers(role)`
- Update role: `APIClient.updateUserRole(id, role)`
- Delete: `APIClient.deleteUser(id)`

---

## Testing Your Changes

After converting a page:

1. **Check Console**
   - Look for any console errors
   - Verify API calls in Network tab

2. **Test Functionality**
   - Load page - should fetch data
   - Create/Edit/Delete operations
   - Filter/Search features
   - Error states (disconnect backend to test)

3. **Verify Field Names**
   - Check rendered data matches expected fields
   - No undefined values in UI
   - Proper date formatting

---

## Tips & Best Practices

1. **Always wrap API calls in try-catch**
   ```typescript
   try {
     const data = await APIClient.method();
   } catch (error) {
     console.error('Error:', error);
   }
   ```

2. **Update loading/error states**
   ```typescript
   setLoading(true);
   try {
     const data = await APIClient.method();
     setData(data);
   } catch (error) {
     setError(error.message);
   } finally {
     setLoading(false);
   }
   ```

3. **Handle null/undefined values**
   ```typescript
   // Use optional chaining
   <span>{item?.courseId?.name ?? 'N/A'}</span>
   ```

4. **Consistent API key usage**
   ```typescript
   // MongoDB returns _id, but we can use either
   const id = item._id || item.id;
   ```

5. **Test with sample data**
   - Run `npm run seed` in backend
   - Use provided test credentials
   - Verify all operations work

---

## Support

If you encounter issues during conversion:

1. Check the field name mapping reference
2. Review error messages in browser console
3. Verify backend is running and responding
4. Check API Client implementation for available methods
5. Compare with already-converted pages (dashboard, assignments list)

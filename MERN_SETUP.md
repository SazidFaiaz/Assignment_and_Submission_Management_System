# Assignment and Submission Management System - MERN Stack

This project has been converted from Next.js with Supabase to a complete MERN (MongoDB, Express, React, Node.js) stack.

## Architecture

### Backend (Express.js + MongoDB)
- **Location**: `/backend`
- **Port**: 5000
- **Database**: MongoDB
- **Authentication**: JWT-based

### Frontend (Next.js + React)
- **Location**: `/` (root)
- **Port**: 3000
- **Framework**: Next.js 13 with TypeScript

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── Profile.ts           # User model
│   │   │   ├── Course.ts            # Course model
│   │   │   ├── CourseMember.ts      # Course membership model
│   │   │   ├── Assignment.ts        # Assignment model
│   │   │   └── Submission.ts        # Submission model
│   │   ├── routes/
│   │   │   ├── auth.ts              # Authentication routes
│   │   │   ├── courses.ts           # Course management routes
│   │   │   ├── assignments.ts       # Assignment routes
│   │   │   ├── submissions.ts       # Submission routes
│   │   │   └── users.ts             # User management routes
│   │   ├── utils/
│   │   │   └── jwt.ts               # JWT utilities
│   │   └── server.ts                # Express server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── lib/
│   ├── api-client.ts                # API client for frontend
│   ├── auth-context.tsx             # React context for authentication
│   ├── types.ts                     # TypeScript type definitions
│   └── date.ts                      # Date utilities
│
├── app/
│   ├── dashboard/
│   │   ├── assignments/             # Assignment pages
│   │   ├── courses/                 # Course pages
│   │   ├── submissions/             # Submission pages
│   │   └── users/                   # User management pages
│   └── page.tsx                     # Login page
│
└── package.json                     # Frontend dependencies
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure MongoDB connection in `.env`**
   ```
   MONGODB_URI=mongodb://localhost:27017/assignment-management
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to root directory**
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Ensure API URL is configured in `.env.local`**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

All API endpoints are prefixed with `/api`.

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `GET /auth/me` - Get current user (requires token)

### Courses
- `GET /courses` - Get all courses
- `GET /courses/:id` - Get single course
- `POST /courses` - Create course (admin only)
- `PUT /courses/:id` - Update course (admin only)
- `DELETE /courses/:id` - Delete course (admin only)
- `GET /courses/:id/members` - Get course members
- `POST /courses/:id/members` - Add member to course (admin only)

### Assignments
- `GET /assignments` - Get all assignments (with filters)
- `GET /assignments/:id` - Get single assignment
- `POST /assignments` - Create assignment (teacher/admin only)
- `PUT /assignments/:id` - Update assignment (teacher/admin only)
- `DELETE /assignments/:id` - Delete assignment (teacher/admin only)

### Submissions
- `GET /submissions` - Get all submissions (with filters)
- `GET /submissions/:id` - Get single submission
- `POST /submissions` - Create/submit assignment (student only)
- `PUT /submissions/:id` - Update submission (student only)
- `PUT /submissions/:id/grade` - Grade submission (teacher/admin only)

### Users
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get single user
- `PUT /users/:id` - Update user profile
- `PUT /users/:id/role` - Update user role (admin only)
- `DELETE /users/:id` - Delete user (admin only)

## Database Models

### Profile (User)
```typescript
{
  id: ObjectId
  email: string (unique)
  password: string (hashed)
  fullName: string
  role: 'admin' | 'teacher' | 'student'
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}
```

### Course
```typescript
{
  id: ObjectId
  code: string (unique)
  name: string
  department: string
  term: string
  createdAt: Date
  updatedAt: Date
}
```

### Assignment
```typescript
{
  id: ObjectId
  courseId: ObjectId (ref: Course)
  teacherId: ObjectId (ref: Profile)
  title: string
  description: string
  deadline: Date
  maxMarks: number
  status: 'draft' | 'published' | 'closed'
  createdAt: Date
  updatedAt: Date
}
```

### Submission
```typescript
{
  id: ObjectId
  assignmentId: ObjectId (ref: Assignment)
  studentId: ObjectId (ref: Profile)
  answer: string
  status: 'submitted' | 'late' | 'graded' | 'returned'
  marks: number | null
  feedback: string | null
  submittedAt: Date
  updatedAt: Date
}
```

### CourseMember
```typescript
{
  id: ObjectId
  courseId: ObjectId (ref: Course)
  userId: ObjectId (ref: Profile)
  memberRole: 'teacher' | 'student'
  createdAt: Date
}
```

## Authentication Flow

1. **Sign Up**: User registers with email, password, and full name
   - Password is hashed using bcryptjs
   - JWT token is generated and returned
   - Token is stored in localStorage on frontend

2. **Sign In**: User logs in with credentials
   - Password is verified against stored hash
   - JWT token is generated and returned

3. **Protected Requests**: All API requests include JWT token in Authorization header
   - Format: `Authorization: Bearer <token>`
   - Token is verified on backend before processing request

4. **Token Expiry**: Tokens expire after 7 days (configurable via JWT_EXPIRE env var)

## Frontend API Client

The frontend uses a centralized `APIClient` class for all API communications.

### Usage Examples

```typescript
// Sign up
await APIClient.signUp(email, password, fullName);

// Sign in
await APIClient.signIn(email, password);

// Get courses
const courses = await APIClient.getCourses();

// Create assignment
await APIClient.createAssignment({
  courseId: '...',
  title: 'Assignment 1',
  description: '...',
  deadline: new Date(),
  maxMarks: 100,
});

// Submit assignment
await APIClient.submitAssignment(assignmentId, answer);

// Grade submission
await APIClient.gradeSubmission(submissionId, marks, feedback);
```

## Running Both Servers

### Option 1: Separate Terminals
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Option 2: Using npm-run-all (from root)
```bash
npm install --save-dev npm-run-all

# Add to package.json scripts:
"dev": "npm-run-all --parallel dev:backend dev:frontend",
"dev:backend": "cd backend && npm run dev",
"dev:frontend": "next dev"
```

## Production Deployment

### Backend Deployment
1. Build the TypeScript code: `npm run build`
2. Start the production server: `npm start`
3. Ensure MongoDB is accessible from your production environment
4. Set production environment variables

### Frontend Deployment
1. Build: `npm run build`
2. Deploy to Vercel, Netlify, or any Node.js hosting
3. Set `NEXT_PUBLIC_API_URL` to your production backend URL

## Removed Features

The following Supabase-specific features have been removed:
- Supabase authentication
- Real-time subscriptions (can be re-added with Socket.io if needed)
- Supabase UI components

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/assignment-management
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh`
- Check MONGODB_URI in backend .env
- Verify network connectivity to MongoDB

### CORS Errors
- Check that FRONTEND_URL in backend .env matches your frontend URL
- Ensure backend is running before frontend

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET is set in backend .env
- Verify token format in API requests

## TODO - Remaining Pages to Update

The following pages still use Supabase and need to be updated to use APIClient:

- [ ] `app/dashboard/assignments/[id]/page.tsx`
- [ ] `app/dashboard/assignments/[id]/edit/page.tsx`
- [ ] `app/dashboard/assignments/new/page.tsx`
- [ ] `app/dashboard/courses/page.tsx`
- [ ] `app/dashboard/submissions/page.tsx`
- [ ] `app/dashboard/submissions/[id]/page.tsx`
- [ ] `app/dashboard/users/page.tsx`

Follow the same pattern as the updated `dashboard/page.tsx` and `assignments/page.tsx`:
1. Replace `supabase` imports with `APIClient` imports
2. Replace Supabase queries with corresponding APIClient method calls
3. Adapt field names from Supabase format to MongoDB format (e.g., `_id` vs `id`, `max_marks` vs `maxMarks`)

## Support

For issues or questions, please check the API documentation in the backend routes or contact the development team.

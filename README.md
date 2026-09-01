# Assignment and Submission Management System

A comprehensive assignment management platform built with **MERN Stack** (MongoDB, Express, React, Node.js).

## 🚀 Features

- **User Management**: Admin, Teacher, and Student roles
- **Course Management**: Create and manage courses
- **Assignment Management**: Create, publish, and track assignments
- **Submission System**: Students submit assignments, teachers grade them
- **Role-Based Access Control**: Different permissions for different user types
- **JWT Authentication**: Secure token-based authentication
- **Real-time Dashboard**: View stats and recent activities

## 📋 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing

### Frontend
- **Next.js 13** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **React Hook Form** - Form management

## 📁 Project Structure

```
.
├── backend/                          # Express.js backend
│   ├── src/
│   │   ├── config/database.ts       # MongoDB connection
│   │   ├── models/                  # MongoDB schemas
│   │   ├── routes/                  # API endpoints
│   │   ├── middleware/              # Auth & validation
│   │   ├── utils/                   # Utilities
│   │   ├── seed.ts                  # Database seeding
│   │   └── server.ts                # Express app
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── lib/
│   ├── api-client.ts               # API communication
│   ├── auth-context.tsx            # Auth state management
│   ├── types.ts                    # TypeScript types
│   └── date.ts                     # Date utilities
│
├── app/
│   ├── dashboard/                  # Main application
│   │   ├── assignments/
│   │   ├── courses/
│   │   ├── submissions/
│   │   └── users/
│   ├── page.tsx                    # Login page
│   └── layout.tsx
│
├── components/ui/                  # Reusable UI components
├── package.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure MongoDB URI and JWT secret in .env
# MONGODB_URI=mongodb://localhost:27017/assignment-management
# JWT_SECRET=your-secret-key-here

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

Backend runs on: **http://localhost:5000**

### Frontend Setup

```bash
# Navigate to root directory
cd ..

# Install dependencies
npm install

# Create environment file with API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

## 📝 Default Login Credentials

After running `npm run seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123456 |
| Teacher | teacher@example.com | Teacher@123456 |
| Student | student1@example.com | Student@123456 |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)

### Assignments
- `GET /api/assignments` - Get assignments (with filters)
- `POST /api/assignments` - Create assignment (teacher/admin)
- `PUT /api/assignments/:id` - Update assignment (teacher/admin)
- `DELETE /api/assignments/:id` - Delete assignment (teacher/admin)

### Submissions
- `GET /api/submissions` - Get submissions (with filters)
- `POST /api/submissions` - Submit assignment (student)
- `PUT /api/submissions/:id/grade` - Grade submission (teacher/admin)

### Users
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id/role` - Update user role (admin)
- `DELETE /api/users/:id` - Delete user (admin)

See [MERN_SETUP.md](./MERN_SETUP.md) for complete API documentation.

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. User signs up/in with email and password
2. Password is hashed with bcryptjs
3. JWT token is generated and stored in localStorage
4. Token is sent with every API request in Authorization header
5. Token expires after 7 days (configurable)

## 🎯 User Roles

### Admin
- Full system access
- Manage users
- Manage all courses
- View system statistics

### Teacher
- Create and manage assignments
- Manage enrolled courses
- Grade student submissions
- View student progress

### Student
- View available assignments
- Submit assignments
- View submission status
- See grades and feedback

## 📚 Database Schema

### Profile (User)
```javascript
{
  email: string (unique),
  password: string (hashed),
  fullName: string,
  role: 'admin' | 'teacher' | 'student',
  avatarUrl: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Course
```javascript
{
  code: string (unique),
  name: string,
  department: string,
  term: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Assignment
```javascript
{
  courseId: ObjectId,
  teacherId: ObjectId,
  title: string,
  description: string,
  deadline: Date,
  maxMarks: number,
  status: 'draft' | 'published' | 'closed',
  createdAt: Date,
  updatedAt: Date
}
```

### Submission
```javascript
{
  assignmentId: ObjectId,
  studentId: ObjectId,
  answer: string,
  status: 'submitted' | 'late' | 'graded' | 'returned',
  marks: number | null,
  feedback: string | null,
  submittedAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

```bash
# Build TypeScript
npm run build

# Set environment variables on platform
# Deploy to chosen platform
```

### Frontend Deployment (Vercel/Netlify)

```bash
# Vercel
vercel deploy

# Netlify
netlify deploy --prod
```

Set `NEXT_PUBLIC_API_URL` to your production backend URL.

## 📖 Documentation

- [MERN Setup Guide](./MERN_SETUP.md) - Detailed installation and usage
- [Migration Guide](./MERN_MIGRATION_GUIDE.md) - Conversion from Supabase
- [Conversion Templates](./CONVERSION_TEMPLATES.md) - Code examples for page updates

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in backend/.env
- Verify network connectivity

### CORS Error
- Check FRONTEND_URL in backend/.env
- Ensure backend is running before frontend
- Clear browser cache and localStorage

### Authentication Failed
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET is set correctly
- Verify API URL in frontend/.env.local

See [MERN_MIGRATION_GUIDE.md](./MERN_MIGRATION_GUIDE.md#troubleshooting) for more solutions.

## 📊 What's Converted

✅ Complete MERN backend with Express and MongoDB
✅ JWT authentication and RBAC
✅ 31 REST API endpoints
✅ React frontend with TypeScript
✅ Core pages converted to use API client
✅ Database seeding with sample data
✅ Complete documentation

## 🔄 Remaining Work

- [ ] Convert 7 remaining pages to use API client (templates provided)
- [ ] Add file uploads for submissions
- [ ] Implement real-time notifications
- [ ] Add email notifications
- [ ] Mobile app (optional)

See [CONVERSION_TEMPLATES.md](./CONVERSION_TEMPLATES.md) for migration examples.

## 📞 Support

For issues or questions:

1. Check the documentation files
2. Review backend logs: `npm run dev` output
3. Check browser console for client errors
4. Verify API responses in Network tab
5. Check database with MongoDB Compass

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with Next.js, Express, and MongoDB
- UI components from Radix UI
- Styling with Tailwind CSS
- Icons from Lucide React

---

**Last Updated**: August 2024
**Stack**: MERN (MongoDB, Express, React, Node.js)
**Status**: ✅ Core features complete - Ready for use


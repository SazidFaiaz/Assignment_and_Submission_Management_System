import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Profile } from './models/Profile';
import { Course } from './models/Course';
import { CourseMember } from './models/CourseMember';
import { Assignment } from './models/Assignment';
import { connectDB, disconnectDB } from './config/database';

dotenv.config();

async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Profile.deleteMany({}),
      Course.deleteMany({}),
      CourseMember.deleteMany({}),
      Assignment.deleteMany({}),
    ]);

    console.log('👤 Creating users...');
    const adminUser = new Profile({
      email: 'admin@example.com',
      password: 'Admin@123456',
      fullName: 'Admin User',
      role: 'admin',
    });
    await adminUser.save();

    const teacherUser = new Profile({
      email: 'teacher@example.com',
      password: 'Teacher@123456',
      fullName: 'Dr. John Smith',
      role: 'teacher',
    });
    await teacherUser.save();

    const student1 = new Profile({
      email: 'student1@example.com',
      password: 'Student@123456',
      fullName: 'Alice Johnson',
      role: 'student',
    });
    await student1.save();

    const student2 = new Profile({
      email: 'student2@example.com',
      password: 'Student@123456',
      fullName: 'Bob Wilson',
      role: 'student',
    });
    await student2.save();

    console.log('📚 Creating courses...');
    const course1 = new Course({
      code: 'CS101',
      name: 'Introduction to Computer Science',
      department: 'Computer Science',
      term: 'Fall 2024',
    });
    await course1.save();

    const course2 = new Course({
      code: 'CS202',
      name: 'Data Structures',
      department: 'Computer Science',
      term: 'Fall 2024',
    });
    await course2.save();

    console.log('👥 Adding course members...');
    await CourseMember.create([
      { courseId: course1._id, userId: teacherUser._id, memberRole: 'teacher' },
      { courseId: course1._id, userId: student1._id, memberRole: 'student' },
      { courseId: course1._id, userId: student2._id, memberRole: 'student' },
      { courseId: course2._id, userId: teacherUser._id, memberRole: 'teacher' },
      { courseId: course2._id, userId: student1._id, memberRole: 'student' },
    ]);

    console.log('📝 Creating assignments...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);

    await Assignment.create([
      {
        courseId: course1._id,
        teacherId: teacherUser._id,
        title: 'Assignment 1: Fundamentals',
        description: 'Complete the basic exercises on computer science fundamentals',
        deadline: deadlineDate,
        maxMarks: 100,
        status: 'published',
      },
      {
        courseId: course1._id,
        teacherId: teacherUser._id,
        title: 'Assignment 2: Advanced Concepts',
        description: 'Solve the advanced problems related to CS concepts',
        deadline: new Date(deadlineDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        status: 'draft',
      },
      {
        courseId: course2._id,
        teacherId: teacherUser._id,
        title: 'Assignment 1: Data Structures',
        description: 'Implement various data structures',
        deadline: deadlineDate,
        maxMarks: 150,
        status: 'published',
      },
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\nDefault Credentials:');
    console.log('Admin - admin@example.com / Admin@123456');
    console.log('Teacher - teacher@example.com / Teacher@123456');
    console.log('Student 1 - student1@example.com / Student@123456');
    console.log('Student 2 - student2@example.com / Student@123456');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await disconnectDB();
  }
}

seedDatabase();

import { Router, Response } from 'express';
import { Course } from '../models/Course';
import { CourseMember } from '../models/CourseMember';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Get all courses (with pagination)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const courses = await Course.find()
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments();

    res.json({
      data: courses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course (admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { code, name, department, term } = req.body;

      if (!code || !name || !department || !term) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const existingCourse = await Course.findOne({ code });
      if (existingCourse) {
        res.status(400).json({ error: 'Course with this code already exists' });
        return;
      }

      const course = new Course({ code, name, department, term });
      await course.save();

      res.status(201).json(course);
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ error: 'Failed to create course' });
    }
  }
);

// Update course (admin only)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.json(course);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ error: 'Failed to update course' });
    }
  }
);

// Delete course (admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const course = await Course.findByIdAndDelete(req.params.id);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ error: 'Failed to delete course' });
    }
  }
);

// Get course members
router.get(
  '/:id/members',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const members = await CourseMember.find({ courseId: req.params.id })
        .populate('userId', 'email fullName role');

      res.json(members);
    } catch (error) {
      console.error('Get course members error:', error);
      res.status(500).json({ error: 'Failed to fetch course members' });
    }
  }
);

// Add course member (admin only)
router.post(
  '/:id/members',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, memberRole } = req.body;

      if (!userId || !memberRole) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const existingMember = await CourseMember.findOne({
        courseId: req.params.id,
        userId,
      });

      if (existingMember) {
        res.status(400).json({ error: 'User is already a member of this course' });
        return;
      }

      const member = new CourseMember({
        courseId: req.params.id,
        userId,
        memberRole,
      });

      await member.save();
      res.status(201).json(member);
    } catch (error) {
      console.error('Add course member error:', error);
      res.status(500).json({ error: 'Failed to add course member' });
    }
  }
);

export default router;

import { Router, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Get all assignments (with filters)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, status } = req.query;
    const filter: any = {};

    if (courseId) filter.courseId = courseId;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate('courseId', 'code name')
      .populate('teacherId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('courseId')
      .populate('teacherId', 'fullName email');

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment (teacher only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['teacher', 'admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { courseId, title, description, deadline, maxMarks, status } = req.body;

      if (!courseId || !title || !description || !deadline) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const assignment = new Assignment({
        courseId,
        teacherId: req.user?.id,
        title,
        description,
        deadline: new Date(deadline),
        maxMarks: maxMarks || 100,
        status: status || 'draft',
      });

      await assignment.save();
      await assignment.populate('courseId').populate('teacherId', 'fullName email');

      res.status(201).json(assignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  }
);

// Update assignment (teacher/owner only)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check if user is the teacher who created the assignment or admin
    if (
      assignment.teacherId.toString() !== req.user?.id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    Object.assign(assignment, req.body);
    await assignment.save();

    res.json(assignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment (teacher/owner only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (
      assignment.teacherId.toString() !== req.user?.id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;

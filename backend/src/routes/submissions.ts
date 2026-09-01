import { Router, Response } from 'express';
import { Submission } from '../models/Submission';
import { Assignment } from '../models/Assignment';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Get all submissions (filter by assignment/student)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId, studentId } = req.query;
    const filter: any = {};

    if (assignmentId) filter.assignmentId = assignmentId;
    if (studentId) filter.studentId = studentId;

    const submissions = await Submission.find(filter)
      .populate('assignmentId', 'title maxMarks deadline')
      .populate('studentId', 'fullName email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get single submission
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignmentId')
      .populate('studentId', 'fullName email');

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Check access rights
    if (
      submission.studentId.toString() !== req.user?.id &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'teacher'
    ) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Create/submit assignment (student only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['student']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { assignmentId, answer } = req.body;

      if (!assignmentId || !answer) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      // Check if submission already exists
      const existingSubmission = await Submission.findOne({
        assignmentId,
        studentId: req.user?.id,
      });

      if (existingSubmission) {
        // Update existing submission
        existingSubmission.answer = answer;
        existingSubmission.submittedAt = new Date();

        // Determine if late
        const deadline = new Date(assignment.deadline);
        if (new Date() > deadline) {
          existingSubmission.status = 'late';
        } else {
          existingSubmission.status = 'submitted';
        }

        await existingSubmission.save();
        res.json(existingSubmission);
        return;
      }

      // Create new submission
      const deadline = new Date(assignment.deadline);
      const status = new Date() > deadline ? 'late' : 'submitted';

      const submission = new Submission({
        assignmentId,
        studentId: req.user?.id,
        answer,
        status,
        submittedAt: new Date(),
      });

      await submission.save();
      await submission.populate('assignmentId').populate('studentId', 'fullName email');

      res.status(201).json(submission);
    } catch (error) {
      console.error('Create submission error:', error);
      res.status(500).json({ error: 'Failed to submit assignment' });
    }
  }
);

// Grade submission (teacher only)
router.put(
  '/:id/grade',
  authMiddleware,
  roleMiddleware(['teacher', 'admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { marks, feedback } = req.body;

      if (marks === undefined) {
        res.status(400).json({ error: 'Marks are required' });
        return;
      }

      const submission = await Submission.findById(req.params.id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      submission.marks = marks;
      submission.feedback = feedback || null;
      submission.status = 'graded';
      await submission.save();

      res.json(submission);
    } catch (error) {
      console.error('Grade submission error:', error);
      res.status(500).json({ error: 'Failed to grade submission' });
    }
  }
);

// Update submission (student owner only)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.studentId.toString() !== req.user?.id) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    if (req.body.answer) {
      submission.answer = req.body.answer;
    }

    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

export default router;

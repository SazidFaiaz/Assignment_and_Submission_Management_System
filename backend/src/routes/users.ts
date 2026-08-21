import { Router, Response } from 'express';
import { Profile } from '../models/Profile';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.query;
      const filter: any = {};

      if (role) filter.role = role;

      const users = await Profile.find(filter)
        .select('-password')
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get single user
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await Profile.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.params.id !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const allowedFields = ['fullName', 'avatarUrl'];
    const updates: any = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updates[field] = req.body[field];
      }
    });

    const user = await Profile.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user role (admin only)
router.put(
  '/:id/role',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.body;

      if (!role || !['admin', 'teacher', 'student'].includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      const user = await Profile.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// Delete user (admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await Profile.findByIdAndDelete(req.params.id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export default router;

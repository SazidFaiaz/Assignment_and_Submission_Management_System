import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Profile } from '../models/Profile';
import { generateToken } from '../utils/jwt';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Sign Up
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').notEmpty(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await Profile.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
        return;
      }

      // Create new user
      const user = new Profile({
        email,
        password,
        fullName,
        role: 'student', // Default role
      });

      await user.save();

      const token = generateToken(user);
      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  }
);

// Sign In
router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      const user = await Profile.findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken(user);
      res.json({
        message: 'Sign in successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error('Sign in error:', error);
      res.status(500).json({ error: 'Failed to sign in' });
    }
  }
);

// Get Current User
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await Profile.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

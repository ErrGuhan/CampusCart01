import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import {
  generateTokenPair,
  setAuthCookies,
  clearAuthCookies,
  AuthenticatedRequest,
} from '../middleware/auth';
import { ENV, COOKIE_CONFIG } from '../config/constants';

export class AuthController {
  /**
   * Register new campus user and set HttpOnly cookies
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, displayName, department, year, campusSector } = req.body;

      if (!email || !password || !displayName) {
        res.status(400).json({
          success: false,
          error: 'Email, password, and display name are required.',
        });
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'An account with this campus email already exists.',
        });
        return;
      }

      // Password complexity check
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
        });
        return;
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check admin status - guhan24td0781@svcet.ac.in is the ONLY admin
      const isAdmin = email.toLowerCase().trim() === 'guhan24td0781@svcet.ac.in';

      const user = new User({
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim(),
        username,
        role: isAdmin ? 'admin' : 'student',
        department: department || 'Engineering',
        year: year || '1st Year',
        campusSector: campusSector || 'North Campus',
        isVerified: isAdmin,
        trustScore: 50.0,
      });

      await user.save();

      // Issue stateless JWT token pair
      const { accessToken, refreshToken, csrfToken } = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      setAuthCookies(res, accessToken, refreshToken, csrfToken);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully. Secure session initialized.',
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          trustScore: user.trustScore,
          isVerified: user.isVerified,
        },
        csrfToken,
      });
    } catch (err: any) {
      console.error('[Auth Controller] Register Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error during user registration.',
      });
    }
  }

  /**
   * Login user and issue HttpOnly & SameSite=Strict cookies
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required.',
        });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials.',
        });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials.',
        });
        return;
      }

      const { accessToken, refreshToken, csrfToken } = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      setAuthCookies(res, accessToken, refreshToken, csrfToken);

      res.status(200).json({
        success: true,
        message: 'Login successful. Secure cookies established.',
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          trustScore: user.trustScore,
          isVerified: user.isVerified,
        },
        csrfToken,
      });
    } catch (err: any) {
      console.error('[Auth Controller] Login Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication.',
      });
    }
  }

  /**
   * Refreshes access token via HttpOnly refresh cookie
   */
  public static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.[COOKIE_CONFIG.REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token cookie missing.',
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as any;
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401).json({ success: false, error: 'User not found.' });
        return;
      }

      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.csrfToken);

      res.status(200).json({
        success: true,
        message: 'Tokens rotated successfully.',
        csrfToken: tokens.csrfToken,
      });
    } catch (err) {
      clearAuthCookies(res);
      res.status(403).json({
        success: false,
        error: 'Invalid or expired refresh token. Please sign in again.',
      });
    }
  }

  /**
   * Logout user and clear all auth cookies
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Secure cookies cleared.',
    });
  }

  /**
   * Returns current authenticated user profile
   */
  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated.' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
    }
  }
}

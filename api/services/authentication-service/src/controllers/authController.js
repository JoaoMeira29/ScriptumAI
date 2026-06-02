const AuthService = require("../services/authService");
const { getClientIp, getUserAgent } = require("../utils/requestUtils");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API endpoints for authentication operations
 *
 * @class AuthController
 */
class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - name
   *               - surname
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               username:
   *                 type: string
  *                 description: Optional. Auto-generated when omitted
   *               name:
   *                 type: string
   *               surname:
   *                 type: string
   *               organizationId:
   *                 type: string
   *                 format: uuid
  *               organizationName:
  *                 type: string
  *                 description: Required when organizationId is not provided
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Validation error
   */
  static async register(req, res, next) {
    try {
      const {
        email,
        password,
        username,
        name,
        surname,
        organizationId,
        organizationName,
        organizationCity,
        organizationAddress,
        organizationContact,
        organizationZipCode,
        role,
      } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.register(
        {
          email,
          password,
          username,
          name,
          surname,
          organizationId,
          organizationName,
          organizationCity,
          organizationAddress,
          organizationContact,
          organizationZipCode,
          role,
        },
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.login(email, password, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.forgotPassword(email, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message,
        ...(result.resetToken && {
          data: {
            resetToken: result.resetToken,
            expiresAt: result.expiresAt,
          },
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.resetPassword(
        token,
        newPassword,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change user password
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       400:
   *         description: Validation error
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh authentication token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Unauthorized
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.refreshToken(refreshToken, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Logged out successfully
   *       401:
   *         description: Unauthorized
   */
  static async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.substring(7);
      const { refreshToken } = req.body || {};
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const result = await AuthService.logout(
        accessToken,
        refreshToken || null,
        req.user.id,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: result.message || "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  static async getProfile(req, res, next) {
    try {
      const result = await AuthService.getProfile(
        req.user,
        req.headers.authorization,
      );

      res.status(200).json({
        success: true,
        data: {
          user: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name, surname, username } = req.body;
      const result = await AuthService.updateProfile(req.user.id, { name, surname, username });
      res.status(200).json({ success: true, message: result.message, data: { user: result.user } });
    } catch (error) {
      next(error);
    }
  }

  static async getUsersByOrganization(req, res, next) {
    try {
      const { role, organization_id } = req.user;
      const { page, limit, search } = req.query;
      const opts = { page, limit, search };

      if (role === "staff") {
        const result = await AuthService.getAllUsers(opts);
        return res.status(200).json(result);
      }

      if (role === "admin") {
        const result = await AuthService.getUsersByOrganization(organization_id, opts);
        return res.status(200).json(result);
      }

      return res.status(403).json({ success: false, message: "Forbidden" });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      if (req.user.role !== "staff") {
        return res.status(403).json({ success: false, message: "Forbidden: staff only" });
      }
      const { id } = req.params;
      const { role } = req.body;
      if (!role) return res.status(400).json({ success: false, message: "role is required" });
      const user = await AuthService.updateUserRole(id, role);
      return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async checkEmail(req, res, next) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, message: "email query param required" });
      }
      const exists = await AuthService.emailExists(email.toLowerCase().trim());
      return res.status(200).json({ success: true, exists });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminHealth(req, res, next) {
    try {
      if (req.user.role !== "staff" && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const mem = process.memoryUsage();
      return res.status(200).json({
        success: true,
        data: {
          status: "ok",
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || "development",
          memory: {
            rss: mem.rss,
            heapTotal: mem.heapTotal,
            heapUsed: mem.heapUsed,
            external: mem.external,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

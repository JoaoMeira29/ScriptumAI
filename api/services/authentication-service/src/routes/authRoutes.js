const express = require("express");
const AuthController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  validate,
} = require("../middleware/validation");

const router = express.Router();

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

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
router.post("/register", validate(registerValidation), AuthController.register);

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
router.post("/login", validate(loginValidation), AuthController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (always returns 200 to prevent email enumeration)
 *       400:
 *         description: Validation error
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordValidation),
  AuthController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  validate(resetPasswordValidation),
  AuthController.resetPassword
);

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
 *         description: Validation error or invalid current password
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordValidation),
  AuthController.changePassword
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
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
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", validate(refreshTokenValidation), AuthController.refreshToken);

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
router.post("/logout", authenticate, AuthController.logout);

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
router.get("/profile", authenticate, AuthController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/profile", authenticate, validate(updateProfileValidation), AuthController.updateProfile);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile (alias for /profile)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, AuthController.getProfile);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: List users in the current organization
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.get("/users", authenticate, AuthController.getUsersByOrganization);

/**
 * @swagger
 * /api/auth/users/{id}/role:
 *   patch:
 *     summary: Update a user's role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
router.patch("/users/:id/role", authenticate, AuthController.updateUserRole);

/**
 * @swagger
 * /api/auth/admin/health:
 *   get:
 *     summary: Admin health check with service details
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed health status
 *       401:
 *         description: Unauthorized
 */
router.get("/check-email", AuthController.checkEmail);

router.get("/admin/health", authenticate, AuthController.getAdminHealth);

module.exports = router;

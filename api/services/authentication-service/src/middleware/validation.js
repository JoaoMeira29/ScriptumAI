const { body, validationResult } = require("express-validator");

const passwordComplexityValidation = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),
];

const newPasswordComplexityValidation = [
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("New password must contain at least one special character"),
];

// Middleware for data validation
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  };
};

// Validation for user registration
const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  ...passwordComplexityValidation,
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and dots"),
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("surname")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Surname must be at least 2 characters long"),
  body("organizationId")
    .optional()
    .isUUID()
    .withMessage("Organization ID must be a valid UUID"),
  body("organizationName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Organization name must be between 2 and 100 characters"),
  body().custom((value) => {
    if (!value.organizationId && !value.organizationName) {
      throw new Error("Either organizationId or organizationName is required");
    }
    return true;
  }),
];

// Validation for user login
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validation for password change
const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  ...newPasswordComplexityValidation,
];

// Validation for refresh token
const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Validation for forgot password
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

// Validation for reset password
const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  ...newPasswordComplexityValidation,
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("surname")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Surname must be at least 2 characters long"),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and dots"),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
};

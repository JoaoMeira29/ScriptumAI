const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const crypto = require("crypto");
const { Op } = require("sequelize");
const User = require("../models/User");
const AuthLog = require("../models/AuthLog");
const PasswordResetToken = require("../models/PasswordResetToken");
const TokenService = require("./tokenService");
const OrganizationServiceClient = require("./organizationServiceClient");
const DocumentServiceClient = require("./documentServiceClient");
const NotificationServiceClient = require("./notificationServiceClient");

class AuthService {
  static hashResetToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async register(userData, ipAddress, _userAgent) {
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
    } = userData;

    console.log("[AuthService] Registration data:", {
      email,
      username,
      role,
      organizationId,
      organizationName,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const resolvedUsername = username || (await this.generateUniqueUsernameFromEmail(email));

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username: resolvedUsername } });
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    let resolvedOrganizationId = organizationId;
    let onboardingTrial = null;
    let userId = randomUUID();

    if (!resolvedOrganizationId) {
      const onboarding = await OrganizationServiceClient.createTrialOnboarding({
        organizationName,
        ownerUserId: userId,
        ownerEmail: email,
        city: organizationCity || undefined,
        address: organizationAddress || undefined,
        contact: organizationContact ? Number(organizationContact) : undefined,
        zipCode: organizationZipCode || undefined,
      });

      resolvedOrganizationId = onboarding.organization?.id;
      onboardingTrial = onboarding.trial || null;

      if (!resolvedOrganizationId) {
        throw new Error("Unable to resolve organization ID from onboarding");
      }
    }

    // Create user
    const user = await User.create({
      id: userId,
      email,
      password: passwordHash,
      username: resolvedUsername,
      name,
      surname,
      organization_id: resolvedOrganizationId,
      role: role || (!organizationId ? "admin" : "user"),
    });

    console.log("[AuthService] User created with role:", user.role);

    await AuthLog.create({
      user_id: user.id,
      action: "login",
      ip_address: ipAddress,
      success: true,
    }).catch((err) => {
      console.warn("Error creating registration log:", err.message);
    });

    // Generate tokens
    const tokens = TokenService.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
        organization_id: user.organization_id,
        role: user.role,
      },
      ...(onboardingTrial && {
        trial: {
          status: onboardingTrial.status,
          ends_at: onboardingTrial.ends_at,
          days_remaining: onboardingTrial.days_remaining,
        },
      }),
      ...tokens,
    };
  }

  static async generateUniqueUsernameFromEmail(email) {
    const [emailPrefix] = email.split("@");
    const sanitizedBase = (emailPrefix || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, "")
      .slice(0, 40);

    let candidate = sanitizedBase.length >= 3 ? sanitizedBase : `user${Date.now().toString().slice(-6)}`;
    let suffix = 1;

    let existing = await User.findOne({ where: { username: candidate } });
    while (existing) {
      candidate = `${sanitizedBase || "user"}.${suffix}`.slice(0, 50);
      suffix += 1;
      existing = await User.findOne({ where: { username: candidate } });
    }
    return candidate;
  }

  static async login(email, password, ipAddress, _userAgent) {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await AuthLog.create({
        user_id: user.id,
        action: "login",
        ip_address: ipAddress,
        success: false,
      }).catch(() => {});
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    // Check if user is active
    if (user.status !== "active") {
      await AuthLog.create({
        user_id: user.id,
        action: "login",
        ip_address: ipAddress,
        success: false,
      }).catch(() => {});
      const err = new Error("User account is not active");
      err.status = 401;
      throw err;
    }

    if (user.role !== "staff") {
      try {
        const orgStatus = await OrganizationServiceClient.getOrganizationStatus(user.organization_id);
        if (orgStatus?.status === "suspended") {
          const err = new Error("Your organization is suspended. Please contact support.");
          err.status = 403;
          err.code = "ORG_SUSPENDED";
          throw err;
        }
      } catch (err) {
        if (err.code === "ORG_SUSPENDED") throw err;
        console.warn("[AuthService] Org status check failed:", err.message);
      }
    }

    const trial = await this.resolveTrialStatus(user.organization_id);

    if (trial?.status === "expired") {
      const trialError = new Error("Your 15-day trial has expired.");
      trialError.status = 403;
      trialError.code = "TRIAL_EXPIRED";
      trialError.trial_ended_at = trial.ends_at;
      throw trialError;
    }

    // Log successful login
    await AuthLog.create({
      user_id: user.id,
      action: "login",
      ip_address: ipAddress,
      success: true,
    }).catch(() => {});

    // Generate tokens
    const tokens = TokenService.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
        organization_id: user.organization_id,
        role: user.role,
      },
      ...(trial && { trial }),
      ...tokens,
    };
  }

  static async resolveTrialStatus(organizationId) {
    if (!organizationId) {
      return null;
    }

    try {
      const response = await OrganizationServiceClient.getSubscriptionStatus(organizationId);
      const subscription = response?.subscription;

      if (!subscription) {
        return null;
      }

      return {
        status: subscription.status,
        plan_id: subscription.plan,
        planId: this.normalizePlanId(subscription.plan, subscription.status),
        ends_at: subscription.trial_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        days_remaining: subscription.days_remaining,
      };
    } catch (error) {
      // Don't fail authentication if trial lookup service is unavailable.
      console.warn("[AuthService] Trial lookup failed:", error.message);
      return null;
    }
  }

  static normalizePlanId(plan, status) {
    if (!plan) {
      return "free-trial";
    }

    const normalized = String(plan).toLowerCase().replace(/_/g, "-");

    if (normalized === "free-trial" || normalized === "starter") {
      return normalized;
    }

    if (status === "trialing") {
      return "free-trial";
    }

    return normalized;
  }

  static calculateTrialDaysRemaining(createdAt) {
    if (!createdAt) {
      return null;
    }

    const trialStart = new Date(createdAt);
    if (Number.isNaN(trialStart.getTime())) {
      return null;
    }

    const trialEnd = new Date(trialStart.getTime() + 15 * 24 * 60 * 60 * 1000);
    const msLeft = trialEnd.getTime() - Date.now();
    return Math.max(Math.ceil(msLeft / (1000 * 60 * 60 * 24)), 0);
  }

  static async getProfile(user, authorizationHeader) {
    const [trial, usage] = await Promise.all([
      this.resolveTrialStatus(user.organization_id),
      DocumentServiceClient.getChatUsage(authorizationHeader).catch((error) => {
        console.warn("[AuthService] Chat usage lookup failed:", error.message);
        return null;
      }),
    ]);

    const planId = trial?.planId || this.normalizePlanId(trial?.plan_id, trial?.status);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      organization_id: user.organization_id,
      role: user.role,
      planId,
      trialStartDate: user.created_at ? new Date(user.created_at).toISOString() : null,
      messagesSent: usage?.messagesSent ?? 0,
      daysRemaining:
        this.calculateTrialDaysRemaining(user.created_at) ?? trial?.days_remaining ?? 0,
    };
  }

  static async changePassword(
    userId,
    currentPassword,
    newPassword,
    ipAddress,
    _userAgent
  ) {
    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      await AuthLog.create({
        user_id: user.id,
        action: "login",
        ip_address: ipAddress,
        success: false,
      }).catch(() => {});
      throw new Error("Current password is incorrect");
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error("New password must be different from current password");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({
      password: newPasswordHash,
      updated_at: new Date(),
    });

    // Log password change
    await AuthLog.create({
      user_id: user.id,
      action: "login",
      ip_address: ipAddress,
      success: true,
    }).catch(() => {});

    return { message: "Password changed successfully" };
  }

  static async forgotPassword(email, ipAddress, userAgent) {
    const genericResponse = {
      message:
        "If the email exists, password reset instructions have been generated.",
    };

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return genericResponse;
    }

    await PasswordResetToken.update(
      { used_at: new Date() },
      {
        where: {
          user_id: user.id,
          used_at: null,
          expires_at: {
            [Op.gt]: new Date(),
          },
        },
      }
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      requested_ip: ipAddress || null,
      requested_user_agent: userAgent || null,
    });

    await AuthLog.create({
      user_id: user.id,
      action: "forgot_password",
      ip_address: ipAddress,
      success: true,
    }).catch(() => {});

    try {
      const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}`;

      await NotificationServiceClient.sendPasswordResetEmail({
        userId: user.id,
        organizationId: user.organization_id,
        recipientEmail: user.email,
        recipientName: user.name,
        resetUrl,
      });
    } catch (error) {
      // Keep forgot-password response stable even if email sending fails.
      console.warn("[AuthService] Failed to send password reset email:", error.message);
    }

    // Keep same style as existing service while avoiding exposing token in production.
    if (process.env.NODE_ENV !== "production") {
      return {
        ...genericResponse,
        resetToken: rawToken,
        expiresAt: expiresAt.toISOString(),
      };
    }

    return genericResponse;
  }

  static async resetPassword(token, newPassword, ipAddress, _userAgent) {
    const tokenHash = this.hashResetToken(token);

    const resetToken = await PasswordResetToken.findOne({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      order: [["created_at", "DESC"]],
    });

    if (!resetToken) {
      const err = new Error("Invalid or expired reset token");
      err.status = 400;
      throw err;
    }

    const user = await User.findByPk(resetToken.user_id);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      const err = new Error("New password must be different from current password");
      err.status = 400;
      throw err;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: newPasswordHash,
      updated_at: new Date(),
    });

    await resetToken.update({ used_at: new Date() });

    // Invalidate any other active reset tokens for the same user.
    await PasswordResetToken.update(
      { used_at: new Date() },
      {
        where: {
          user_id: user.id,
          used_at: null,
        },
      }
    );

    await AuthLog.create({
      user_id: user.id,
      action: "reset_password",
      ip_address: ipAddress,
      success: true,
    }).catch(() => {});

    return { message: "Password reset successfully" };
  }

  static async refreshToken(refreshToken, ipAddress, _userAgent) {
    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // Check if token is blacklisted
    const isBlacklisted = await TokenService.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new Error("Refresh token has been revoked");
    }

    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new Error("User account is not active");
    }

    if (user.role !== "staff") {
      try {
        const orgStatus = await OrganizationServiceClient.getOrganizationStatus(user.organization_id);
        if (orgStatus?.status === "suspended") {
          const err = new Error("Your organization is suspended. Please contact support.");
          err.status = 403;
          err.code = "ORG_SUSPENDED";
          throw err;
        }
      } catch (err) {
        if (err.code === "ORG_SUSPENDED") throw err;
        console.warn("[AuthService] Org status check failed on refresh:", err.message);
      }
    }

    await AuthLog.create({
      user_id: user.id,
      action: "login",
      ip_address: ipAddress,
      success: true,
    }).catch(() => {});

    // Generate new token pair
    const tokens = TokenService.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
        organization_id: user.organization_id,
        role: user.role,
      },
      ...tokens,
    };
  }

  static async logout(accessToken, refreshToken, userId, ipAddress, _userAgent) {
    // Blacklist tokens (skip refresh token if not provided)
    const promises = [TokenService.blacklistToken(accessToken, userId)];
    if (refreshToken) {
      promises.push(TokenService.blacklistToken(refreshToken, userId));
    }
    await Promise.all(promises);

    // Log logout
    await AuthLog.create({
      user_id: userId,
      action: "logout",
      ip_address: ipAddress,
      success: true,
    }).catch(() => {});

    return { message: "Logged out successfully" };
  }

  static async updateProfile(userId, updates) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const { name, surname, username } = updates;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (surname) fieldsToUpdate.surname = surname;
    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) throw new Error("Username already taken");
      fieldsToUpdate.username = username;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return {
        message: "No changes to save",
        user: { id: user.id, email: user.email, username: user.username, name: user.name, surname: user.surname },
      };
    }

    fieldsToUpdate.updated_at = new Date();
    await user.update(fieldsToUpdate);

    return {
      message: "Profile updated successfully",
      user: { id: user.id, email: user.email, username: user.username, name: user.name, surname: user.surname },
    };
  }

  static async getUsersByOrganization(organizationId, { page, limit, search } = {}) {
    const where = { organization_id: organizationId, role: ["admin", "user"] };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { surname: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const attrs = ["id", "email", "username", "name", "surname", "role", "status", "created_at"];

    if (page != null) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const { rows, count } = await User.findAndCountAll({
        where,
        attributes: attrs,
        order: [["name", "ASC"]],
        limit: l,
        offset: (p - 1) * l,
      });
      return { data: rows, pagination: { page: p, limit: l, total: count, totalPages: Math.ceil(count / l) } };
    }

    return User.findAll({ where, attributes: attrs, order: [["name", "ASC"]] });
  }

  static async getAllUsers({ page, limit, search } = {}) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { surname: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const attrs = ["id", "email", "username", "name", "surname", "role", "status", "organization_id", "created_at"];

    if (page != null) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const { rows, count } = await User.findAndCountAll({
        where,
        attributes: attrs,
        order: [["name", "ASC"]],
        limit: l,
        offset: (p - 1) * l,
      });
      return { data: rows, pagination: { page: p, limit: l, total: count, totalPages: Math.ceil(count / l) } };
    }

    return User.findAll({ where: search ? where : undefined, attributes: attrs, order: [["name", "ASC"]] });
  }

  static async emailExists(email) {
    const user = await User.findOne({ where: { email } });
    return !!user;
  }

  static async updateUserRole(userId, newRole) {
    const allowed = ["admin", "user"];
    if (!allowed.includes(newRole)) {
      throw new Error(`Invalid role. Allowed: ${allowed.join(", ")}`);
    }
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    if (user.role === "staff") throw new Error("Cannot change role of a staff user");
    await user.update({ role: newRole });
    return { id: user.id, email: user.email, name: user.name, surname: user.surname, role: user.role, status: user.status };
  }
}

module.exports = AuthService;

import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {
  createUser,
  createCustomer,
  createDoctor,
  getUserByEmail,
  getUserByPhone,
  verifyPassword,
  updateUserPassword,
  createPendingRegistration,
  getPendingRegistrationByEmail,
  User,
  Customer,
  Doctor,
  PendingRegistration,
} from "../database";
import bcrypt from "bcryptjs";
import { isAdminSignupAllowed } from "../admin-init";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "customer" | "staff";
  full_name: string;
  phone?: string;
  // Customer specific fields
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  blood_group?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  insurance?: string;
  insurance_policy_number?: string;
  occupation?: string;
  // Doctor specific fields
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      full_name,
      phone,
      // Customer fields
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact,
      emergency_contact_name,
      emergency_contact_relation,
      allergies,
      medical_conditions,
      current_medications,
      insurance,
      insurance_policy_number,
      occupation,
      // Doctor fields
      specialization,
      license_number,
      experience_years,
      consultation_fee,
      available_days,
      available_time_start,
      available_time_end,
    }: RegisterRequest = req.body;

    // Validate required fields
    if (!username || !email || !password || !role || !full_name) {
      return res.status(400).json({
        error:
          "Missing required fields: username, email, password, role, full_name",
      });
    }

    // Restrict admin signup
    if (role === "admin" && !isAdminSignupAllowed(email)) {
      return res.status(403).json({
        error:
          "Admin registration is restricted. Only the system administrator can have admin access.",
      });
    }

    // Validate mobile number format if provided
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: "Mobile number must be exactly 10 digits",
        });
      }
    }

    // Check if user already exists by email
    console.log(`📧 Registration attempt for email: ${email}`);
    const existingUser = await getUserByEmail(email);
    console.log(
      `🔍 Existing user check result:`,
      existingUser ? "FOUND" : "NOT_FOUND",
    );

    if (existingUser) {
      console.log(`❌ Registration blocked - email exists: ${email}`);
      return res.status(409).json({ error: "Mobile or Email already in use" });
    }

    // Check if phone number already exists (if provided)
    if (phone) {
      console.log(`📱 Checking phone number: ${phone}`);
      const existingUserByPhone = await getUserByPhone(phone);
      console.log(
        `🔍 Phone check result:`,
        existingUserByPhone ? "FOUND" : "NOT_FOUND",
      );

      if (existingUserByPhone) {
        console.log(`❌ Registration blocked - phone exists: ${phone}`);
        return res
          .status(409)
          .json({ error: "Mobile or Email already in use" });
      }
    }

    console.log(`✅ Email available, proceeding with registration: ${email}`);

    // Handle role-specific registration
    if (role === "doctor" || role === "staff") {
      try {
        // Create pending registration for admin approval
        const pendingRegistration: PendingRegistration = {
          username,
          email,
          password,
          role,
          full_name,
          phone,
          // Doctor specific fields
          specialization,
          license_number,
          experience_years,
          consultation_fee,
          available_days,
          available_time_start,
          available_time_end,
          // Staff specific fields (if needed in future)
          department: role === "staff" ? "General" : undefined,
          employee_id: role === "staff" ? `EMP${Date.now()}` : undefined,
        };

        console.log(
          `📝 Attempting to create pending registration for: ${email}`,
        );
        const pendingId = await createPendingRegistration(pendingRegistration);
        console.log(`✅ Pending registration created with ID: ${pendingId}`);

        res.status(201).json({
          message: `Registration request submitted successfully. Your ${role} account will be activated after admin approval.`,
          pendingId,
          requiresApproval: true,
          role,
        });
      } catch (pendingError) {
        console.error("❌ Error creating pending registration:", pendingError);
        return res.status(500).json({
          error:
            "Failed to create pending registration: " + pendingError.message,
        });
      }
    } else if (role === "customer") {
      // Direct registration for customers (as before)
      const user: User = {
        username,
        email,
        password,
        role,
        full_name,
        phone,
      };

      const userId = await createUser(user);

      // Create customer record
      const customer: Customer = {
        user_id: userId,
        date_of_birth,
        gender,
        blood_group,
        address,
        emergency_contact,
        emergency_contact_name,
        emergency_contact_relation,
        allergies,
        medical_conditions,
        current_medications,
        insurance,
        insurance_policy_number,
        occupation,
      };
      createCustomer(customer);

      // Generate JWT token for immediate login
      const token = jwt.sign({ userId, email, role, full_name }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        message: "Customer registered successfully",
        token,
        user: {
          id: userId,
          username,
          email,
          role,
          full_name,
          phone,
        },
      });
    }
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      if (error.message.includes("username")) {
        return res.status(409).json({ error: "Username already exists" });
      } else if (error.message.includes("email")) {
        return res
          .status(409)
          .json({ error: "Mobile or Email already in use" });
      }
    }

    res
      .status(500)
      .json({ error: "Internal server error during registration" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      // Check if it's a pending registration
      const pendingRegistration = getPendingRegistrationByEmail(email);
      if (pendingRegistration) {
        if (pendingRegistration.status === "pending") {
          return res.status(403).json({
            error:
              "Your account is pending admin approval. Please wait for approval before signing in.",
            status: "pending_approval",
          });
        } else if (pendingRegistration.status === "rejected") {
          return res.status(403).json({
            error: "Your registration request was rejected by admin.",
            status: "rejected",
          });
        }
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password FIRST - before checking suspension status
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user account is suspended (AFTER password verification)
    if (user.status === "suspended") {
      return res.status(403).json({
        error:
          "Your account has been suspended by the administrator. Please contact support for assistance.",
        status: "suspended",
        type: "account_suspended",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};

// Forgot Password Handler
export const handleForgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security reasons
      return res.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with an expiration time
    // 3. Send an email with the reset link
    //
    // For now, we'll just return a success message
    // since email functionality is not implemented

    console.log(`Password reset requested for: ${email}`);

    // Simulate sending email (in real app, use nodemailer or similar)
    res.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to verify JWT token
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Check if user still exists and is not suspended
    try {
      const user = await getUserByEmail(decoded.email);
      if (!user) {
        return res.status(401).json({ error: "User account no longer exists" });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          error: "Your account has been suspended. Please contact support.",
          status: "suspended",
        });
      }

      // Add user info to request object
      (req as any).user = decoded;
      next();
    } catch (dbError) {
      console.error("Database error in auth middleware:", dbError);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};

// Get current user profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const { email } = (req as any).user;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't send password in response
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Change password
export const handleChangePassword: RequestHandler = async (req, res) => {
  try {
    const { email } = (req as any).user;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    // Get current user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    const passwordUpdated = await updateUserPassword(email, newPassword);
    if (!passwordUpdated) {
      return res.status(500).json({ error: "Failed to update password" });
    }

    res.json({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during password change" });
  }
};

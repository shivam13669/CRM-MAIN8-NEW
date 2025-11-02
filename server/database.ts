import initSqlJs from "sql.js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";

// Database file path - real SQLite database file!
const DB_PATH = join(process.cwd(), "healthcare.db");

let SQL: any;
let db: any;

export async function initDatabase(): Promise<void> {
  try {
    // Initialize sql.js
    SQL = await initSqlJs();

    if (existsSync(DB_PATH)) {
      // Load existing database
      const data = readFileSync(DB_PATH);
      db = new SQL.Database(data);
      console.log("✅ SQLite database loaded from healthcare.db");
    } else {
      // Create new database
      db = new SQL.Database();
      console.log("✅ New SQLite database created: healthcare.db");
    }

    // Always ensure tables exist
    createTables();

    // Run migrations
    await runMigrations();

    saveDatabase();

    // Verify pending_registrations table exists
    try {
      const tableCheck = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pending_registrations'",
      );
      if (tableCheck.length > 0) {
        console.log("✅ pending_registrations table verified");
      } else {
        console.log(
          "⚠️ pending_registrations table not found, creating manually...",
        );
        await createPendingRegistrationsTable();
      }
    } catch (error) {
      console.log("⚠️ Table verification failed, creating manually...");
      await createPendingRegistrationsTable();
    }
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

// Manual table creation function
export async function createPendingRegistrationsTable(): Promise<void> {
  try {
    console.log("🔧 Creating pending_registrations table manually...");

    db.run(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        approved_by INTEGER,
        specialization TEXT,
        license_number TEXT,
        experience_years INTEGER,
        consultation_fee REAL,
        available_days TEXT,
        available_time_start TEXT,
        available_time_end TEXT,
        department TEXT,
        employee_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    saveDatabase();
    console.log("✅ pending_registrations table created successfully");
  } catch (error) {
    console.error("❌ Error creating pending_registrations table:", error);
    throw error;
  }
}

function createTables(): void {
  try {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'customer', 'staff')),
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date_of_birth DATE,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        blood_group TEXT,
        address TEXT,
        emergency_contact TEXT,
        emergency_contact_name TEXT,
        emergency_contact_relation TEXT,
        allergies TEXT,
        medical_conditions TEXT,
        current_medications TEXT,
        insurance TEXT,
        insurance_policy_number TEXT,
        occupation TEXT,
        height INTEGER,
        weight INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Doctors table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialization TEXT,
        license_number TEXT UNIQUE,
        experience_years INTEGER,
        consultation_fee DECIMAL(10,2),
        available_days TEXT,
        available_time_start TIME,
        available_time_end TIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Appointments table - improved structure
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_user_id INTEGER NOT NULL,
        doctor_user_id INTEGER,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        reason TEXT,
        symptoms TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Ambulance requests table - new table
    db.run(`
      CREATE TABLE IF NOT EXISTS ambulance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_user_id INTEGER NOT NULL,
        pickup_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        emergency_type TEXT NOT NULL,
        patient_condition TEXT,
        contact_number TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'on_the_way', 'completed', 'cancelled')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
        assigned_staff_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_staff_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Pending registrations table - for doctor/staff approval
    db.run(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        approved_by INTEGER,
        specialization TEXT,
        license_number TEXT,
        experience_years INTEGER,
        consultation_fee REAL,
        available_days TEXT,
        available_time_start TEXT,
        available_time_end TEXT,
        department TEXT,
        employee_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Feedback/Complaints table - for patient feedback and complaints
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback_complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('feedback', 'complaint')),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT CHECK(category IN ('service', 'facility', 'staff', 'doctor', 'billing', 'other')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_review', 'resolved', 'closed')),
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        admin_response TEXT,
        admin_user_id INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Patient feedback on closed complaints - for rating admin response
    db.run(`
      CREATE TABLE IF NOT EXISTS complaint_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        patient_user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        feedback_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES feedback_complaints (id) ON DELETE CASCADE,
        FOREIGN KEY (patient_user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(complaint_id, patient_user_id)
      )
    `);

    console.log("✅ All SQLite tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  try {
    console.log("🔄 Running database migrations...");

    // Migration 1: Add status column to users table
    try {
      const tableInfo = db.exec("PRAGMA table_info(users)");
      const hasStatusColumn = tableInfo[0]?.values.some(
        (row) => row[1] === "status",
      );

      if (!hasStatusColumn) {
        console.log("📝 Adding status column to users table...");
        db.run(
          "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended'))",
        );
        db.run("UPDATE users SET status = 'active' WHERE status IS NULL");
        console.log("✅ Status column added successfully");
      }
    } catch (error) {
      console.log("⚠️ Status column migration skipped:", error.message);
    }

    // Migration 2: Add rating column to feedback_complaints table
    try {
      const feedbackTableInfo = db.exec("PRAGMA table_info(feedback_complaints)");
      const hasRatingColumn = feedbackTableInfo[0]?.values.some(
        (row) => row[1] === "rating",
      );

      if (!hasRatingColumn) {
        console.log("📝 Adding rating column to feedback_complaints table...");
        db.run(
          "ALTER TABLE feedback_complaints ADD COLUMN rating INTEGER CHECK(rating >= 1 AND rating <= 5)",
        );
        console.log("✅ Rating column added successfully");
      }
    } catch (error) {
      console.log("⚠️ Rating column migration skipped:", error.message);
    }

    console.log("��� All migrations completed");
  } catch (error) {
    console.error("❌ Error running migrations:", error);
  }
}

export function saveDatabase(): void {
  try {
    const data = db.export();
    writeFileSync(DB_PATH, data);
    console.log("💾 Database saved to healthcare.db");
  } catch (error) {
    console.error("❌ Error saving database:", error);
  }
}

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: "admin" | "doctor" | "patient" | "staff";
  full_name: string;
  phone?: string;
  created_at?: string;
}

export interface Patient {
  id?: number;
  user_id: number;
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
  height?: number;
  weight?: number;
  created_at?: string;
}

export interface Doctor {
  id?: number;
  user_id: number;
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;
  created_at?: string;
}

export interface PendingRegistration {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: "doctor" | "staff";
  full_name: string;
  phone?: string;
  status?: "pending" | "approved" | "rejected";
  admin_notes?: string;
  approved_by?: number;

  // Doctor specific fields
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  available_days?: string;
  available_time_start?: string;
  available_time_end?: string;

  // Staff specific fields
  department?: string;
  employee_id?: string;

  created_at?: string;
}

// User operations
export async function createUser(user: User): Promise<number> {
  try {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    console.log(`👤 Creating user: ${user.email} (${user.role})`);

    // Use db.run for INSERT statements
    db.run(
      `
      INSERT INTO users (username, email, password, role, full_name, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        user.username,
        user.email,
        hashedPassword,
        user.role,
        user.full_name,
        user.phone || null,
      ],
    );

    // Get the last inserted ID
    const result = db.exec("SELECT last_insert_rowid() as id");
    const userId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ User created in SQLite: ${user.email} (${user.role}) - ID: ${userId}`,
    );

    return userId as number;
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw error;
  }
}

export function getUserByEmail(email: string): User | undefined {
  try {
    console.log(`🔍 Checking email: ${email}`);

    if (!db) {
      console.log("❌ Database not initialized");
      return undefined;
    }

    // Use exec instead of prepare for sql.js
    const result = db.exec("SELECT * FROM users WHERE email = ?", [email]);

    console.log(`🔍 Query result:`, result);

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log(`✅ Email ${email} is available`);
      return undefined;
    }

    // Convert array result to object
    const columns = result[0].columns;
    const row = result[0].values[0];

    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });

    console.log(`⚠️ Email ${email} already exists:`, user);
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by email:", error);
    // Return undefined if error - assume email is available
    return undefined;
  }
}

export function getUserByPhone(phone: string): User | undefined {
  try {
    console.log(`🔍 Checking phone: ${phone}`);

    if (!db) {
      console.log("❌ Database not initialized");
      return undefined;
    }

    // Use exec instead of prepare for sql.js
    const result = db.exec("SELECT * FROM users WHERE phone = ?", [phone]);

    console.log(`🔍 Phone query result:`, result);

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log(`✅ Phone ${phone} is available`);
      return undefined;
    }

    // Convert array result to object
    const columns = result[0].columns;
    const row = result[0].values[0];

    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });

    console.log(`⚠️ Phone ${phone} already exists:`, user);
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by phone:", error);
    // Return undefined if error - assume phone is available
    return undefined;
  }
}

export function getUserByUsername(username: string): User | undefined {
  try {
    console.log(`�� Checking username: ${username}`);

    if (!db) {
      console.log("❌ Database not initialized");
      return undefined;
    }

    const result = db.exec("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      console.log(`✅ Username ${username} is available`);
      return undefined;
    }

    // Convert array result to object
    const columns = result[0].columns;
    const row = result[0].values[0];

    const user: any = {};
    columns.forEach((col, index) => {
      user[col] = row[index];
    });

    console.log(`⚠️ Username ${username} already exists`);
    return user as User;
  } catch (error) {
    console.error("❌ Error getting user by username:", error);
    return undefined;
  }
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("❌ Error verifying password:", error);
    return false;
  }
}

export async function updateUserPassword(
  email: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`🔒 Updating password for user: ${email}`);

    db.run(
      `
      UPDATE users
      SET password = ?, updated_at = datetime('now')
      WHERE email = ?
    `,
      [hashedPassword, email],
    );

    console.log(`✅ Password updated successfully for: ${email}`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error updating password:", error);
    return false;
  }
}

// Patient operations
export function createPatient(patient: Patient): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO patients (
        user_id, date_of_birth, gender, blood_group, address, 
        emergency_contact, emergency_contact_name, emergency_contact_relation,
        allergies, medical_conditions, current_medications, insurance,
        insurance_policy_number, occupation, height, weight, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run([
      patient.user_id,
      patient.date_of_birth || null,
      patient.gender || null,
      patient.blood_group || null,
      patient.address || null,
      patient.emergency_contact || null,
      patient.emergency_contact_name || null,
      patient.emergency_contact_relation || null,
      patient.allergies || null,
      patient.medical_conditions || null,
      patient.current_medications || null,
      patient.insurance || null,
      patient.insurance_policy_number || null,
      patient.occupation || null,
      patient.height || null,
      patient.weight || null,
    ]);

    const result = db.exec("SELECT last_insert_rowid() as id");
    const patientId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Patient created in SQLite for user_id: ${patient.user_id} - ID: ${patientId}`,
    );

    return patientId as number;
  } catch (error) {
    console.error("❌ Error creating patient:", error);
    throw error;
  }
}

// Doctor operations
export function createDoctor(doctor: Doctor): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO doctors (
        user_id, specialization, license_number, experience_years,
        consultation_fee, available_days, available_time_start, 
        available_time_end, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run([
      doctor.user_id,
      doctor.specialization || null,
      doctor.license_number || null,
      doctor.experience_years || null,
      doctor.consultation_fee || null,
      doctor.available_days || null,
      doctor.available_time_start || null,
      doctor.available_time_end || null,
    ]);

    const result = db.exec("SELECT last_insert_rowid() as id");
    const doctorId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Doctor created in SQLite for user_id: ${doctor.user_id} - ID: ${doctorId}`,
    );

    return doctorId as number;
  } catch (error) {
    console.error("❌ Error creating doctor:", error);
    throw error;
  }
}

// Get all patients (for doctors/admin)
export function getAllPatients(): any[] {
  try {
    const result = db.exec(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        p.date_of_birth,
        p.gender,
        p.blood_group,
        p.address,
        p.medical_conditions,
        p.height,
        p.weight,
        p.created_at
      FROM users u
      JOIN patients p ON u.id = p.user_id
      ORDER BY u.full_name
    `);

    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const patients = rows.map((row) => {
      const patient: any = {};
      columns.forEach((col, index) => {
        patient[col] = row[index];
      });
      return patient;
    });

    console.log(`📊 Retrieved ${patients.length} patients from SQLite`);
    return patients;
  } catch (error) {
    console.error("❌ Error getting patients:", error);
    return [];
  }
}

// Get all doctors
export function getAllDoctors(): any[] {
  try {
    const result = db.exec(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        d.specialization,
        d.experience_years,
        d.consultation_fee,
        d.available_days
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      ORDER BY u.full_name
    `);

    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const doctors = rows.map((row) => {
      const doctor: any = {};
      columns.forEach((col, index) => {
        doctor[col] = row[index];
      });
      return doctor;
    });

    console.log(`📊 Retrieved ${doctors.length} doctors from SQLite`);
    return doctors;
  } catch (error) {
    console.error("❌ Error getting doctors:", error);
    return [];
  }
}

// Get database stats
export function getDatabaseStats() {
  try {
    const userCount = db.exec("SELECT COUNT(*) as count FROM users")[0]
      .values[0][0];
    const patientCount = db.exec("SELECT COUNT(*) as count FROM patients")[0]
      .values[0][0];
    const doctorCount = db.exec("SELECT COUNT(*) as count FROM doctors")[0]
      .values[0][0];
    const appointmentCount = db.exec(
      "SELECT COUNT(*) as count FROM appointments",
    )[0].values[0][0];

    return {
      users: userCount,
      patients: patientCount,
      doctors: doctorCount,
      appointments: appointmentCount,
    };
  } catch (error) {
    console.error("❌ Error getting database stats:", error);
    return { users: 0, patients: 0, doctors: 0, appointments: 0 };
  }
}

// Pending registration operations
export async function createPendingRegistration(
  registration: PendingRegistration,
): Promise<number> {
  try {
    const hashedPassword = await bcrypt.hash(registration.password, 10);

    console.log(
      `📝 Creating pending registration: ${registration.email} (${registration.role})`,
    );

    // Simplified insert without datetime('now') for better compatibility
    db.run(
      `
      INSERT INTO pending_registrations (
        username, email, password, role, full_name, phone,
        specialization, license_number, experience_years, consultation_fee,
        available_days, available_time_start, available_time_end,
        department, employee_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        registration.username,
        registration.email,
        hashedPassword,
        registration.role,
        registration.full_name,
        registration.phone || null,
        registration.specialization || null,
        registration.license_number || null,
        registration.experience_years || null,
        registration.consultation_fee || null,
        registration.available_days || null,
        registration.available_time_start || null,
        registration.available_time_end || null,
        registration.department || null,
        registration.employee_id || null,
      ],
    );

    const result = db.exec("SELECT last_insert_rowid() as id");
    const pendingId = result[0].values[0][0];

    saveDatabase();
    console.log(
      `✅ Pending registration created: ${registration.email} - ID: ${pendingId}`,
    );

    return pendingId as number;
  } catch (error) {
    console.error("❌ Error creating pending registration:", error);
    console.error("Error details:", error.message);
    throw error;
  }
}

export function getPendingRegistrations(): any[] {
  try {
    const result = db.exec(`
      SELECT
        pr.*,
        admin.full_name as approved_by_name
      FROM pending_registrations pr
      LEFT JOIN users admin ON pr.approved_by = admin.id
      ORDER BY pr.created_at DESC
    `);

    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const rows = result[0].values;

    const registrations = rows.map((row) => {
      const registration: any = {};
      columns.forEach((col, index) => {
        registration[col] = row[index];
      });
      return registration;
    });

    console.log(`📊 Retrieved ${registrations.length} pending registrations`);
    return registrations;
  } catch (error) {
    console.error("❌ Error getting pending registrations:", error);
    return [];
  }
}

export function getPendingRegistrationByEmail(email: string): any | undefined {
  try {
    const result = db.exec(
      "SELECT * FROM pending_registrations WHERE email = ?",
      [email],
    );

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      return undefined;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const registration: any = {};
    columns.forEach((col, index) => {
      registration[col] = row[index];
    });

    return registration;
  } catch (error) {
    console.error("❌ Error getting pending registration by email:", error);
    return undefined;
  }
}

export async function approvePendingRegistration(
  pendingId: number,
  adminUserId: number,
  adminNotes?: string,
): Promise<boolean> {
  try {
    // Get the pending registration
    const result = db.exec("SELECT * FROM pending_registrations WHERE id = ?", [
      pendingId,
    ]);

    if (
      !result ||
      result.length === 0 ||
      !result[0] ||
      result[0].values.length === 0
    ) {
      throw new Error("Pending registration not found");
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const registration: any = {};
    columns.forEach((col, index) => {
      registration[col] = row[index];
    });

    // Create user without hashing password again (already hashed)
    db.run(
      `
      INSERT INTO users (username, email, password, role, full_name, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        registration.username,
        registration.email,
        registration.password, // Already hashed
        registration.role,
        registration.full_name,
        registration.phone || null,
      ],
    );

    const userResult = db.exec("SELECT last_insert_rowid() as id");
    const userId = userResult[0].values[0][0] as number;

    // Create role-specific record
    if (registration.role === "doctor") {
      const doctor: Doctor = {
        user_id: userId,
        specialization: registration.specialization,
        license_number: registration.license_number,
        experience_years: registration.experience_years,
        consultation_fee: registration.consultation_fee,
        available_days: registration.available_days,
        available_time_start: registration.available_time_start,
        available_time_end: registration.available_time_end,
      };
      createDoctor(doctor);
    }

    // Update pending registration status
    db.run(
      `
      UPDATE pending_registrations
      SET status = 'approved', approved_by = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [adminUserId, adminNotes || null, pendingId],
    );

    saveDatabase();
    console.log(
      `✅ Approved registration: ${registration.email} -> User ID: ${userId}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Error approving registration:", error);
    throw error;
  }
}

export function rejectPendingRegistration(
  pendingId: number,
  adminUserId: number,
  adminNotes: string,
): boolean {
  try {
    db.run(
      `
      UPDATE pending_registrations
      SET status = 'rejected', approved_by = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [adminUserId, adminNotes, pendingId],
    );

    saveDatabase();
    console.log(`❌ Rejected registration ID: ${pendingId}`);

    return true;
  } catch (error) {
    console.error("❌ Error rejecting registration:", error);
    return false;
  }
}

// User Management Functions

export async function suspendUser(userId: number): Promise<boolean> {
  try {
    console.log(`⏸️ Suspending user ID: ${userId}`);

    db.run(
      `
      UPDATE users
      SET status = 'suspended', updated_at = datetime('now')
      WHERE id = ? AND role != 'admin'
    `,
      [userId],
    );

    console.log(`✅ User ${userId} suspended successfully`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error suspending user:", error);
    return false;
  }
}

export async function reactivateUser(userId: number): Promise<boolean> {
  try {
    console.log(`▶️ Reactivating user ID: ${userId}`);

    db.run(
      `
      UPDATE users
      SET status = 'active', updated_at = datetime('now')
      WHERE id = ? AND role != 'admin'
    `,
      [userId],
    );

    console.log(`✅ User ${userId} reactivated successfully`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error reactivating user:", error);
    return false;
  }
}

export async function deleteUser(userId: number): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting user ID: ${userId}`);

    // Check if user is admin
    const userResult = db.exec("SELECT role FROM users WHERE id = ?", [userId]);
    if (
      userResult &&
      userResult[0] &&
      userResult[0].values[0] &&
      userResult[0].values[0][0] === "admin"
    ) {
      throw new Error("Cannot delete admin user");
    }

    // Delete related records first
    db.run("DELETE FROM patients WHERE user_id = ?", [userId]);
    db.run("DELETE FROM doctors WHERE user_id = ?", [userId]);

    // Delete the user
    db.run("DELETE FROM users WHERE id = ? AND role != 'admin'", [userId]);

    console.log(`✅ User ${userId} deleted successfully`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return false;
  }
}

export function getAllUsers(): any[] {
  try {
    const result = db.exec(`
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.phone,
             u.status, u.created_at, u.updated_at
      FROM users u
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const users = result[0].values.map((row) => {
      const user: any = {};
      columns.forEach((col, index) => {
        user[col] = row[index];
      });
      return user;
    });

    console.log(`📊 Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    console.error("❌ Error getting all users:", error);
    return [];
  }
}

export function getUsersByRole(role: string): any[] {
  try {
    const result = db.exec(
      `
      SELECT u.id, u.username, u.email, u.role, u.full_name, u.phone,
             u.status, u.created_at, u.updated_at
      FROM users u
      WHERE u.role = ? AND u.role != 'admin'
      ORDER BY u.created_at DESC
    `,
      [role],
    );

    if (!result || result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const users = result[0].values.map((row) => {
      const user: any = {};
      columns.forEach((col, index) => {
        user[col] = row[index];
      });
      return user;
    });

    console.log(`📊 Retrieved ${users.length} ${role}s`);
    return users;
  } catch (error) {
    console.error(`❌ Error getting ${role} users:`, error);
    return [];
  }
}

export function closeDatabase(): void {
  try {
    if (db) {
      saveDatabase();
      db.close();
      console.log("💾 SQLite database saved and closed");
    }
  } catch (error) {
    console.error("❌ Error closing database:", error);
  }
}

// Export database instance for debugging
export { db };

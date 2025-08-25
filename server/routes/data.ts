import { RequestHandler } from "express";
import { getAllPatients, getAllDoctors } from '../database';

// Get all patients (for doctors and admin)
export const handleGetPatients: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    
    // Only doctors and admin can view all patients
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view patients list' });
    }

    const patients = await getAllPatients();
    
    res.json({
      patients,
      total: patients.length
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Internal server error while fetching patients' });
  }
};

// Get all doctors
export const handleGetDoctors: RequestHandler = async (req, res) => {
  try {
    const doctors = await getAllDoctors();
    
    res.json({
      doctors,
      total: doctors.length
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Internal server error while fetching doctors' });
  }
};

// Get dashboard stats
export const handleGetDashboardStats: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    
    const patients = await getAllPatients();
    const doctors = await getAllDoctors();
    
    const stats = {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      todayAppointments: 0, // This would be calculated from appointments table
      pendingReports: 0 // This would be calculated from reports table
    };

    // Role-specific stats
    if (role === 'doctor') {
      // For doctors, show their specific stats
      stats.todayAppointments = 12; // Mock data for now
      stats.pendingReports = 7;
    } else if (role === 'admin') {
      // For admin, show overall stats
      stats.todayAppointments = 45; // Mock data for now
      stats.pendingReports = 23;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error while fetching stats' });
  }
};

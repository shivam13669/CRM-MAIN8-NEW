import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PendingRegistrations from "./pages/PendingRegistrations";
import TestPendingRegistration from "./pages/TestPendingRegistration";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StaffAppointments from "./pages/StaffAppointments";
import StaffReports from "./pages/StaffReports";
import StaffFeedback from "./pages/StaffFeedback";
import StaffInventory from "./pages/StaffInventory";
import BookAppointment from "./pages/BookAppointment";
import RequestAmbulance from "./pages/RequestAmbulance";
import MedicalReports from "./pages/MedicalReports";
import Feedback from "./pages/Feedback";
import FeedbackManagement from "./pages/FeedbackManagement";
import ComplaintFeedbackManagement from "./pages/ComplaintFeedbackManagement";
import Notifications from "./pages/Notifications";
import AdminNotifications from "./pages/AdminNotifications";
import Payments from "./pages/Payments";
import PatientProfile from "./pages/PatientProfile";
import Patients from "./pages/Patients";
import PatientsManagement from "./pages/PatientsManagement";
import MyPatients from "./pages/MyPatients";
import Doctors from "./pages/Doctors";
import DoctorsManagement from "./pages/DoctorsManagement";
import StaffManagement from "./pages/StaffManagement";
import Appointments from "./pages/Appointments";
import Memberships from "./pages/Memberships";
import Ambulance from "./pages/Ambulance";
import InventoryManagement from "./pages/InventoryManagement";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Profile from "./pages/Profile";
import DoctorProfile from "./pages/DoctorProfile";
import StaffProfile from "./pages/StaffProfile";
import UserManagement from "./pages/UserManagement";
import PatientNotifications from "./pages/PatientNotifications";
import DoctorNotifications from "./pages/DoctorNotifications";
import StaffNotifications from "./pages/StaffNotifications";
import MyAmbulanceRequests from "./pages/MyAmbulanceRequests";
import AmbulanceManagement from "./pages/AmbulanceManagement";
import StaffAmbulanceManagement from "./pages/StaffAmbulanceManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Authentication pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin Dashboard and main app pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route
              path="/pending-registrations"
              element={<PendingRegistrations />}
            />
            <Route path="/test-pending" element={<TestPendingRegistration />} />
            <Route path="/patients" element={<PatientsManagement />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/ambulance" element={<Ambulance />} />
            <Route path="/ambulance-management" element={<AmbulanceManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/feedback-management" element={<FeedbackManagement />} />
            <Route path="/complaint-feedback-management" element={<ComplaintFeedbackManagement />} />
            <Route path="/admin-notifications" element={<AdminNotifications />} />

            {/* Patient Dashboard and pages */}
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/request-ambulance" element={<RequestAmbulance />} />
            <Route path="/my-ambulance-requests" element={<MyAmbulanceRequests />} />
            <Route path="/medical-reports" element={<MedicalReports />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/patient-notifications" element={<PatientNotifications />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/patient-profile" element={<PatientProfile />} />

            {/* Other role-specific dashboards */}
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor-notifications" element={<DoctorNotifications />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/staff-ambulance-management" element={<StaffAmbulanceManagement />} />
            <Route path="/staff-appointments" element={<StaffAppointments />} />
            <Route path="/staff-reports" element={<StaffReports />} />
            <Route path="/staff-feedback" element={<StaffFeedback />} />
            <Route path="/staff-inventory" element={<StaffInventory />} />
            <Route path="/staff-notifications" element={<StaffNotifications />} />
            <Route path="/staff-profile" element={<StaffProfile />} />
            <Route path="/my-patients" element={<MyPatients />} />
            <Route path="/staff-dashboard" element={<PatientDashboard />} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

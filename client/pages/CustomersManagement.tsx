import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  User,
  Heart,
  Activity
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";

interface Customer {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  medical_conditions?: string;
  created_at: string;
}

interface FilterState {
  gender: string;
  bloodGroup: string;
  ageRange: string;
  hasConditions: string;
  registrationPeriod: string;
}

export default function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gender: "all",
    bloodGroup: "all",
    ageRange: "all",
    hasConditions: "all",
    registrationPeriod: "all"
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        console.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    // Search filter
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    // Gender filter
    if (filters.gender !== "all" && patient.gender !== filters.gender) {
      return false;
    }

    // Blood group filter
    if (filters.bloodGroup !== "all" && patient.blood_group !== filters.bloodGroup) {
      return false;
    }

    // Age range filter
    if (filters.ageRange !== "all") {
      const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : 0;
      switch (filters.ageRange) {
        case "0-18":
          if (age > 18) return false;
          break;
        case "19-30":
          if (age < 19 || age > 30) return false;
          break;
        case "31-50":
          if (age < 31 || age > 50) return false;
          break;
        case "51+":
          if (age < 51) return false;
          break;
      }
    }

    // Medical conditions filter
    if (filters.hasConditions !== "all") {
      const hasConditions = patient.medical_conditions && patient.medical_conditions.trim() !== "";
      if (filters.hasConditions === "yes" && !hasConditions) return false;
      if (filters.hasConditions === "no" && hasConditions) return false;
    }

    // Registration period filter
    if (filters.registrationPeriod !== "all") {
      const registrationDate = new Date(patient.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (filters.registrationPeriod) {
        case "last-week":
          if (diffDays > 7) return false;
          break;
        case "last-month":
          if (diffDays > 30) return false;
          break;
        case "last-3-months":
          if (diffDays > 90) return false;
          break;
        case "last-year":
          if (diffDays > 365) return false;
          break;
      }
    }

    return true;
  });

  // Get unique blood groups for filter options
  const bloodGroups = Array.from(new Set(patients.map(p => p.blood_group).filter(Boolean)));

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => value !== "all").length;

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      gender: "all",
      bloodGroup: "all",
      ageRange: "all",
      hasConditions: "all",
      registrationPeriod: "all"
    });
  };

  // Update filter
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getGenderIcon = (gender?: string) => {
    if (gender === 'female') return '👩';
    if (gender === 'male') return '👨';
    return '👤';
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and view all registered patients in your healthcare system
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filter Patients</h4>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <Separator />

                  {/* Gender Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Gender</Label>
                    <Select
                      value={filters.gender}
                      onValueChange={(value) => updateFilter("gender", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Blood Group Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Blood Group</Label>
                    <Select
                      value={filters.bloodGroup}
                      onValueChange={(value) => updateFilter("bloodGroup", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Blood Groups</SelectItem>
                        {bloodGroups.map(bg => (
                          <SelectItem key={bg} value={bg!}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Age Range</Label>
                    <Select
                      value={filters.ageRange}
                      onValueChange={(value) => updateFilter("ageRange", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="0-18">0-18 years</SelectItem>
                        <SelectItem value="19-30">19-30 years</SelectItem>
                        <SelectItem value="31-50">31-50 years</SelectItem>
                        <SelectItem value="51+">51+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Medical Conditions Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Medical Conditions</Label>
                    <Select
                      value={filters.hasConditions}
                      onValueChange={(value) => updateFilter("hasConditions", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="yes">Has Conditions</SelectItem>
                        <SelectItem value="no">No Conditions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Registration Period Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Registration Period</Label>
                    <Select
                      value={filters.registrationPeriod}
                      onValueChange={(value) => updateFilter("registrationPeriod", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Male Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.gender === 'male').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-pink-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Female Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.gender === 'female').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => {
                      const createdDate = new Date(p.created_at);
                      const currentDate = new Date();
                      return createdDate.getMonth() === currentDate.getMonth() && 
                             createdDate.getFullYear() === currentDate.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Active Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search Patients</CardTitle>
                <CardDescription>
                  Search by name, email, or phone number
                </CardDescription>
              </div>
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Active Filter Tags */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.gender !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Gender: {filters.gender}
                      <button
                        onClick={() => updateFilter("gender", "all")}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.bloodGroup !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Blood: {filters.bloodGroup}
                      <button
                        onClick={() => updateFilter("bloodGroup", "all")}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.ageRange !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Age: {filters.ageRange}
                      <button
                        onClick={() => updateFilter("ageRange", "all")}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.hasConditions !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Conditions: {filters.hasConditions === "yes" ? "Has" : "None"}
                      <button
                        onClick={() => updateFilter("hasConditions", "all")}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.registrationPeriod !== "all" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Period: {filters.registrationPeriod.replace("-", " ")}
                      <button
                        onClick={() => updateFilter("registrationPeriod", "all")}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Patients ({filteredPatients.length})</CardTitle>
            <CardDescription>
              Complete list of registered patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPatients.length > 0 ? (
              <div className="space-y-4">
                {filteredPatients.map((patient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">{getGenderIcon(patient.gender)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{patient.full_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {patient.email}
                          </div>
                          {patient.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {patient.phone}
                            </div>
                          )}
                          {patient.date_of_birth && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Age: {calculateAge(patient.date_of_birth)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {patient.blood_group && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          {patient.blood_group}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Joined: {formatDate(patient.created_at)}
                      </span>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <span className="text-2xl">{getGenderIcon(selectedPatient?.gender)}</span>
                              <span>{selectedPatient?.full_name}</span>
                            </DialogTitle>
                            <DialogDescription>
                              Complete patient information and medical details
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedPatient && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              {/* Personal Information */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="text-sm text-gray-500">Email</p>
                                      <p className="font-medium">{selectedPatient.email}</p>
                                    </div>
                                  </div>
                                  
                                  {selectedPatient.phone && (
                                    <div className="flex items-center space-x-3">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedPatient.phone}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedPatient.date_of_birth && (
                                    <div className="flex items-center space-x-3">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <p className="text-sm text-gray-500">Date of Birth</p>
                                        <p className="font-medium">{formatDate(selectedPatient.date_of_birth)} (Age: {calculateAge(selectedPatient.date_of_birth)})</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedPatient.gender && (
                                    <div className="flex items-center space-x-3">
                                      <User className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <p className="text-sm text-gray-500">Gender</p>
                                        <p className="font-medium capitalize">{selectedPatient.gender}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedPatient.address && (
                                    <div className="flex items-center space-x-3">
                                      <MapPin className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <p className="text-sm text-gray-500">Address</p>
                                        <p className="font-medium">{selectedPatient.address}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Medical Information */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Medical Information</h3>
                                
                                <div className="space-y-3">
                                  {selectedPatient.blood_group && (
                                    <div className="flex items-center space-x-3">
                                      <Heart className="w-4 h-4 text-red-500" />
                                      <div>
                                        <p className="text-sm text-gray-500">Blood Group</p>
                                        <p className="font-medium text-red-600">{selectedPatient.blood_group}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedPatient.medical_conditions && (
                                    <div className="flex items-start space-x-3">
                                      <Activity className="w-4 h-4 text-gray-400 mt-1" />
                                      <div>
                                        <p className="text-sm text-gray-500">Medical Conditions</p>
                                        <p className="font-medium">{selectedPatient.medical_conditions}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="text-sm text-gray-500">Registration Date</p>
                                      <p className="font-medium">{formatDate(selectedPatient.created_at)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No patients have been registered yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

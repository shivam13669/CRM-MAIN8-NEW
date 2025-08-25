import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { 
  Truck, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  FileText,
  Search,
  Filter,
  Users,
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
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface AmbulanceRequest {
  id: number;
  pickup_address: string;
  destination_address: string;
  emergency_type: string;
  patient_condition: string;
  contact_number: string;
  status: string;
  priority: string;
  notes: string;
  created_at: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  assigned_staff_name: string;
  assigned_staff_phone?: string;
}

export default function AmbulanceManagement() {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchRequests = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('/api/ambulance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
      } else {
        console.error('Failed to fetch ambulance requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ambulance requests:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter requests based on search term, status, and priority
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.emergency_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'assigned':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'on_the_way':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">On The Way</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">High</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Normal</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'assigned':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'on_the_way':
        return <Truck className="w-4 h-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Get summary statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    onTheWay: requests.filter(r => r.status === 'on_the_way').length,
    completed: requests.filter(r => r.status === 'completed').length,
    critical: requests.filter(r => r.priority === 'critical').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading ambulance requests...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Ambulance Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all emergency ambulance requests</p>
          </div>
          <Button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">On The Way</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.onTheWay}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by patient name, emergency type, or request ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="on_the_way">On The Way</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {requests.length === 0 ? "No Ambulance Requests" : "No Matching Requests"}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0 
                  ? "No ambulance requests have been submitted yet." 
                  : "No requests match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <CardTitle className="text-lg">
                          Request #{request.id} - {request.emergency_type}
                        </CardTitle>
                        <CardDescription>
                          {formatDateTime(request.created_at)} • {getTimeAgo(request.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Patient Information */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Patient Information</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-blue-800">Name: </span>
                        <span className="text-blue-700">{request.patient_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Email: </span>
                        <span className="text-blue-700">{request.patient_email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Phone: </span>
                        <span className="text-blue-700">{request.patient_phone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Contact: </span>
                        <span className="text-blue-700">{request.contact_number}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs ml-2"
                          onClick={() => window.open(`tel:${request.contact_number}`)}
                        >
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Details */}
                  {request.patient_condition && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Patient Condition</span>
                      </div>
                      <p className="text-gray-700 text-sm">{request.patient_condition}</p>
                    </div>
                  )}

                  {/* Pickup Address */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Pickup Address</div>
                      <div className="text-gray-600 text-sm">{request.pickup_address}</div>
                    </div>
                  </div>

                  {/* Destination (if available) */}
                  {request.destination_address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Destination</div>
                        <div className="text-gray-600 text-sm">{request.destination_address}</div>
                      </div>
                    </div>
                  )}

                  {/* Assigned Staff (if available) */}
                  {request.assigned_staff_name && (
                    <>
                      <Separator />
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-900">Assigned Staff</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="font-medium text-green-800">Name: </span>
                            <span className="text-green-700">{request.assigned_staff_name}</span>
                          </div>
                          {request.assigned_staff_phone && (
                            <div>
                              <span className="font-medium text-green-800">Phone: </span>
                              <span className="text-green-700">{request.assigned_staff_phone}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs ml-2"
                                onClick={() => window.open(`tel:${request.assigned_staff_phone}`)}
                              >
                                Call
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes (if available) */}
                  {request.notes && (
                    <>
                      <Separator />
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">Staff Notes</span>
                        </div>
                        <p className="text-gray-700 text-sm">{request.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Status Progress */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${['pending', 'assigned', 'on_the_way', 'completed'].includes(request.status) ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'pending' || request.status === 'assigned' || request.status === 'on_the_way' || request.status === 'completed' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">Requested</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${['assigned', 'on_the_way', 'completed'].includes(request.status) ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'assigned' || request.status === 'on_the_way' || request.status === 'completed' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">Assigned</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${['on_the_way', 'completed'].includes(request.status) ? 'text-orange-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'on_the_way' || request.status === 'completed' ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">On The Way</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${request.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${request.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

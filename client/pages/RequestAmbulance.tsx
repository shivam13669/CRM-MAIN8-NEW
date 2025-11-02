import { useState } from "react";
import { CustomerLayout } from "../components/CustomerLayout";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  AlertTriangle,
  Navigation,
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
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

export default function RequestAmbulance() {
  const [formData, setFormData] = useState({
    emergencyType: "",
    patientName: "",
    patientAge: "",
    patientGender: "",
    contactNumber: "",
    address: "",
    landmark: "",
    description: "",
    urgencyLevel: "high",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const emergencyTypes = [
    "Heart Attack",
    "Stroke",
    "Severe Injury/Accident",
    "Breathing Difficulty",
    "Pregnancy/Delivery",
    "Poisoning",
    "Burns",
    "Mental Health Emergency",
    "Other Medical Emergency",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Here you would send to backend and dispatch ambulance
  };

  if (isSubmitted) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Ambulance Requested Successfully!
              </h2>
              <p className="text-green-700 mb-6">
                Your emergency request has been received. An ambulance has been
                dispatched to your location.
              </p>

              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-sm text-gray-600">Request ID:</span>
                    <div className="font-bold">
                      AMB-{Date.now().toString().slice(-6)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ETA:</span>
                    <div className="font-bold text-orange-600">
                      8-12 minutes
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ambulance ID:</span>
                    <div className="font-bold">MH-01-5432</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Contact:</span>
                    <div className="font-bold">+91 98765 43210</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                  Track Ambulance
                </Button>
                <Button variant="destructive">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Emergency (108)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Emergency Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-900">
                Emergency Ambulance Service
              </h1>
              <p className="text-red-700">
                For life-threatening emergencies, call 108 immediately
              </p>
            </div>
            <Button variant="destructive" size="lg" className="ml-auto">
              <Phone className="w-5 h-5 mr-2" />
              Call 108
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ambulance Request Form</CardTitle>
                <CardDescription>
                  Please provide accurate information for quick response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="emergencyType">Type of Emergency</Label>
                    <Select
                      value={formData.emergencyType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyType: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select emergency type" />
                      </SelectTrigger>
                      <SelectContent>
                        {emergencyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={formData.patientName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patientName: e.target.value,
                          }))
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientAge">Age</Label>
                      <Input
                        id="patientAge"
                        type="number"
                        value={formData.patientAge}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            patientAge: e.target.value,
                          }))
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientGender">Gender</Label>
                      <Select
                        value={formData.patientGender}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            patientGender: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactNumber: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Enter 10 digit mobile number"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      minLength={10}
                      onInput={(e) => {
                        const input = e.target as HTMLInputElement;
                        input.value = input.value.replace(/[^0-9]/g, "");
                        if (input.value.length > 10) {
                          input.value = input.value.slice(0, 10);
                        }
                        setFormData((prev) => ({
                          ...prev,
                          contactNumber: input.value,
                        }));
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Complete Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="House number, street, area, city, pincode"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="landmark">Nearby Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          landmark: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Hospital, school, temple, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Description of Emergency
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Describe the patient's condition and symptoms..."
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    variant="destructive"
                  >
                    <Truck className="w-5 h-5 mr-2" />
                    Request Emergency Ambulance
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Info & Guidelines */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">
                  Emergency Numbers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">National Emergency</span>
                  <span className="font-bold text-red-600">108</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Police</span>
                  <span className="font-bold text-blue-600">100</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">Fire Brigade</span>
                  <span className="font-bold text-orange-600">101</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>While You Wait</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Keep the patient calm and comfortable</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Do not move the patient unless necessary</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Gather important medical documents</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Clear the path for ambulance access</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Stay on the line if called by emergency services</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-amber-800 text-sm">
                    <strong>Average Response Time:</strong> 8-15 minutes in
                    urban areas, 15-30 minutes in rural areas.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

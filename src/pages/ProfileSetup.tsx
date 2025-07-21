import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    // Step 1: Basic Info
    firstName: "",
    lastName: "",
    age: "",
    location: "",
    
    // Step 2: Profile Photo
    profilePhoto: "",
    
    // Step 3: About Me
    bio: "",
    
    // Step 4: MS Journey
    diagnosisYear: "",
    msType: "",
    
    // Step 5: Interests
    interests: [] as string[],
    
    // Step 6: Support Needs
    supportNeeds: [] as string[],
    
    // Step 7: Lifestyle
    mobilityAids: "",
    workStatus: "",
    
    // Step 8: Communication
    communicationStyle: "",
    meetingPreference: "",
    
    // Step 9: Goals
    connectionGoals: [] as string[],
    
    // Step 10: Privacy
    profileVisibility: "",
    shareLocation: false,
  });

  const totalSteps = 10;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete profile setup
      toast({
        title: "Profile Completed! 🎉",
        description: "Welcome to the MSTwins community!",
      });
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/dashboard");
    }
  };

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setProfileData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item]
      };
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">Let's start with the basics</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => updateProfileData("firstName", e.target.value)}
                  placeholder="Sarah"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => updateProfileData("lastName", e.target.value)}
                  placeholder="Johnson"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profileData.age}
                onChange={(e) => updateProfileData("age", e.target.value)}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => updateProfileData("location", e.target.value)}
                placeholder="New York, NY"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Profile Photo</h2>
              <p className="text-muted-foreground">Add a friendly photo of yourself</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <span className="text-muted-foreground">Photo</span>
              </div>
              <Button variant="outline">Upload Photo</Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">About Me</h2>
              <p className="text-muted-foreground">Tell others about yourself</p>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => updateProfileData("bio", e.target.value)}
                placeholder="Share a bit about yourself, your interests, and what you're looking for in the community..."
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">MS Journey</h2>
              <p className="text-muted-foreground">Help us understand your experience</p>
            </div>
            <div>
              <Label htmlFor="diagnosisYear">Year of Diagnosis</Label>
              <Input
                id="diagnosisYear"
                type="number"
                value={profileData.diagnosisYear}
                onChange={(e) => updateProfileData("diagnosisYear", e.target.value)}
                placeholder="2018"
              />
            </div>
            <div>
              <Label htmlFor="msType">Type of MS</Label>
              <Select onValueChange={(value) => updateProfileData("msType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select MS type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rrms">Relapsing-Remitting MS</SelectItem>
                  <SelectItem value="ppms">Primary Progressive MS</SelectItem>
                  <SelectItem value="spms">Secondary Progressive MS</SelectItem>
                  <SelectItem value="prms">Progressive-Relapsing MS</SelectItem>
                  <SelectItem value="cis">Clinically Isolated Syndrome</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Interests & Hobbies</h2>
              <p className="text-muted-foreground">What do you enjoy doing?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Reading", "Exercise", "Cooking", "Art", "Music", "Travel", "Photography", "Gaming", "Gardening", "Volunteering", "Crafts", "Sports"].map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={profileData.interests.includes(interest)}
                    onCheckedChange={() => toggleArrayItem("interests", interest)}
                  />
                  <Label htmlFor={interest} className="text-sm">{interest}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Support Needs</h2>
              <p className="text-muted-foreground">What kind of support are you looking for?</p>
            </div>
            <div className="space-y-2">
              {["Emotional Support", "Practical Advice", "Treatment Information", "Lifestyle Tips", "Career Guidance", "Family Support", "Exercise Motivation", "Medication Experiences"].map((need) => (
                <div key={need} className="flex items-center space-x-2">
                  <Checkbox
                    id={need}
                    checked={profileData.supportNeeds.includes(need)}
                    onCheckedChange={() => toggleArrayItem("supportNeeds", need)}
                  />
                  <Label htmlFor={need} className="text-sm">{need}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Lifestyle</h2>
              <p className="text-muted-foreground">Tell us about your daily life</p>
            </div>
            <div>
              <Label htmlFor="mobilityAids">Mobility Aids (if any)</Label>
              <Select onValueChange={(value) => updateProfileData("mobilityAids", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select if applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="cane">Cane</SelectItem>
                  <SelectItem value="walker">Walker</SelectItem>
                  <SelectItem value="wheelchair-part-time">Wheelchair (part-time)</SelectItem>
                  <SelectItem value="wheelchair-full-time">Wheelchair (full-time)</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workStatus">Work Status</Label>
              <Select onValueChange={(value) => updateProfileData("workStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="remote">Remote work</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disability">On disability</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="looking">Looking for work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Communication</h2>
              <p className="text-muted-foreground">How do you prefer to connect?</p>
            </div>
            <div>
              <Label htmlFor="communicationStyle">Communication Style</Label>
              <Select onValueChange={(value) => updateProfileData("communicationStyle", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-first">Text/Message first</SelectItem>
                  <SelectItem value="voice-calls">Voice calls</SelectItem>
                  <SelectItem value="video-calls">Video calls</SelectItem>
                  <SelectItem value="in-person">In-person meetings</SelectItem>
                  <SelectItem value="flexible">Flexible/Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meetingPreference">Meeting Preference</Label>
              <Select onValueChange={(value) => updateProfileData("meetingPreference", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How do you like to meet?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online-only">Online only</SelectItem>
                  <SelectItem value="local-meetups">Local meetups</SelectItem>
                  <SelectItem value="coffee-dates">Coffee dates</SelectItem>
                  <SelectItem value="activity-based">Activity-based</SelectItem>
                  <SelectItem value="support-groups">Support groups</SelectItem>
                  <SelectItem value="virtual-events">Virtual events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Connection Goals</h2>
              <p className="text-muted-foreground">What are you hoping to find?</p>
            </div>
            <div className="space-y-2">
              {["Long-term friendships", "Casual conversations", "MS support buddy", "Local community", "Online community", "Exercise partner", "Professional networking", "Family connections"].map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={profileData.connectionGoals.includes(goal)}
                    onCheckedChange={() => toggleArrayItem("connectionGoals", goal)}
                  />
                  <Label htmlFor={goal} className="text-sm">{goal}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Privacy Settings</h2>
              <p className="text-muted-foreground">Control your privacy preferences</p>
            </div>
            <div>
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select onValueChange={(value) => updateProfileData("profileVisibility", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Who can see your profile?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone in the community</SelectItem>
                  <SelectItem value="matches-only">Matches only</SelectItem>
                  <SelectItem value="limited">Limited visibility</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shareLocation"
                checked={profileData.shareLocation}
                onCheckedChange={(checked) => updateProfileData("shareLocation", checked)}
              />
              <Label htmlFor="shareLocation" className="text-sm">
                Share general location for local connections
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content Card */}
        <Card>
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === totalSteps ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowRight, Check, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    // Step 1: Name Collection
    firstName: "",
    lastName: "",
    
    // Step 2: Date of Birth
    dateOfBirth: undefined as Date | undefined,
    
    // Step 3: Location
    location: "",
    
    // Step 4: MS Subtype
    msSubtype: "",
    
    // Step 5: Diagnosis Year
    diagnosisYear: "",
    
    // Step 6: Symptoms
    symptoms: [] as string[],
    
    // Step 7: Medications
    medications: [] as string[],
    
    // Step 8: Interests & Hobbies
    hobbies: [] as string[],
    
    // Step 9: Profile Picture (Avatar)
    avatarUrl: "",
    
    // Step 10: About Me (Optional Bio)
    aboutMe: "",
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
              <h2 className="text-2xl font-bold">Name Collection</h2>
              <p className="text-muted-foreground">Let's start with your name</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => updateProfileData("firstName", e.target.value)}
                  placeholder="Sarah"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => updateProfileData("lastName", e.target.value)}
                  placeholder="Johnson"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Date of Birth</h2>
              <p className="text-muted-foreground">When were you born?</p>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !profileData.dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {profileData.dateOfBirth ? format(profileData.dateOfBirth, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={profileData.dateOfBirth}
                    onSelect={(date) => updateProfileData("dateOfBirth", date)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Location</h2>
              <p className="text-muted-foreground">Where are you located?</p>
            </div>
            <div>
              <Label htmlFor="location">Location (City, State/Province, Country)</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => updateProfileData("location", e.target.value)}
                placeholder="New York, NY, USA"
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">MS Subtype</h2>
              <p className="text-muted-foreground">What type of MS do you have?</p>
            </div>
            <div>
              <Label htmlFor="msSubtype">MS Subtype</Label>
              <Select onValueChange={(value) => updateProfileData("msSubtype", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your MS subtype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rrms">Relapsing-Remitting MS (RRMS)</SelectItem>
                  <SelectItem value="ppms">Primary Progressive MS (PPMS)</SelectItem>
                  <SelectItem value="spms">Secondary Progressive MS (SPMS)</SelectItem>
                  <SelectItem value="prms">Progressive-Relapsing MS (PRMS)</SelectItem>
                  <SelectItem value="cis">Clinically Isolated Syndrome (CIS)</SelectItem>
                  <SelectItem value="rms">Radiologically Isolated Syndrome (RIS)</SelectItem>
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
              <h2 className="text-2xl font-bold">Diagnosis Year</h2>
              <p className="text-muted-foreground">When were you diagnosed?</p>
            </div>
            <div>
              <Label htmlFor="diagnosisYear">Year of Diagnosis</Label>
              <Input
                id="diagnosisYear"
                type="number"
                value={profileData.diagnosisYear}
                onChange={(e) => updateProfileData("diagnosisYear", e.target.value)}
                placeholder="2020"
                min="1950"
                max={new Date().getFullYear()}
                required
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Symptoms</h2>
              <p className="text-muted-foreground">Which symptoms do you experience?</p>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {[
                "Fatigue", "Walking difficulties", "Vision problems", "Numbness/tingling", 
                "Muscle weakness", "Balance problems", "Cognitive changes", "Bladder issues",
                "Spasticity", "Pain", "Depression", "Dizziness", "Speech problems",
                "Swallowing difficulties", "Tremor", "Heat sensitivity"
              ].map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={profileData.symptoms.includes(symptom)}
                    onCheckedChange={() => toggleArrayItem("symptoms", symptom)}
                  />
                  <Label htmlFor={symptom} className="text-sm">{symptom}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Medications</h2>
              <p className="text-muted-foreground">What medications are you currently taking?</p>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {[
                "Tecfidera (Dimethyl fumarate)", "Copaxone (Glatiramer acetate)", 
                "Betaseron (Interferon beta-1b)", "Avonex (Interferon beta-1a)",
                "Rebif (Interferon beta-1a)", "Tysabri (Natalizumab)", 
                "Gilenya (Fingolimod)", "Aubagio (Teriflunomide)", 
                "Lemtrada (Alemtuzumab)", "Ocrevus (Ocrelizumab)",
                "Mavenclad (Cladribine)", "Kesimpta (Ofatumumab)",
                "Ponvory (Ponesimod)", "Zeposia (Ozanimod)",
                "Vumerity (Diroximel fumarate)", "Bafiertam (Monomethyl fumarate)",
                "None", "Other/Prefer not to say"
              ].map((medication) => (
                <div key={medication} className="flex items-center space-x-2">
                  <Checkbox
                    id={medication}
                    checked={profileData.medications.includes(medication)}
                    onCheckedChange={() => toggleArrayItem("medications", medication)}
                  />
                  <Label htmlFor={medication} className="text-sm">{medication}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Interests & Hobbies</h2>
              <p className="text-muted-foreground">What do you enjoy doing?</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {[
                "Reading", "Exercise/Fitness", "Cooking", "Art/Drawing", "Music", "Travel", 
                "Photography", "Gaming", "Gardening", "Volunteering", "Crafts", "Sports",
                "Writing", "Movies/TV", "Board games", "Meditation", "Yoga", "Swimming",
                "Walking/Hiking", "Dancing", "Knitting/Sewing", "Technology", "Learning",
                "Podcasts", "Nature", "Animals/Pets"
              ].map((hobby) => (
                <div key={hobby} className="flex items-center space-x-2">
                  <Checkbox
                    id={hobby}
                    checked={profileData.hobbies.includes(hobby)}
                    onCheckedChange={() => toggleArrayItem("hobbies", hobby)}
                  />
                  <Label htmlFor={hobby} className="text-sm">{hobby}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Profile Picture</h2>
              <p className="text-muted-foreground">Choose your avatar</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-muted-foreground">Avatar</span>
                )}
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground">Or choose a DiceBear avatar style</p>
                <div className="grid grid-cols-4 gap-2">
                  {["adventurer", "avataaars", "big-ears", "personas"].map((style) => (
                    <Button
                      key={style}
                      variant="outline"
                      size="sm"
                      onClick={() => updateProfileData("avatarUrl", `https://api.dicebear.com/6.x/${style}/svg?seed=${profileData.firstName}`)}
                      className="h-12"
                    >
                      <img 
                        src={`https://api.dicebear.com/6.x/${style}/svg?seed=${profileData.firstName || 'demo'}`} 
                        alt={style}
                        className="w-8 h-8 rounded"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">About Me</h2>
              <p className="text-muted-foreground">Tell us about yourself (optional)</p>
            </div>
            <div>
              <Label htmlFor="aboutMe">About Me (Optional)</Label>
              <Textarea
                id="aboutMe"
                value={profileData.aboutMe}
                onChange={(e) => updateProfileData("aboutMe", e.target.value)}
                placeholder="Share a bit about yourself, your MS journey, what you're looking for in the community, or anything else you'd like others to know..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                This helps others understand who you are and what you're looking for in connections.
              </p>
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
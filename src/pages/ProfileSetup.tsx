import { useState, useEffect } from "react";
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
import { ArrowLeft, ArrowRight, Check, CalendarIcon, Shuffle, X, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [showRobotNotification, setShowRobotNotification] = useState(true);
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [uploading, setUploading] = useState(false);
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
    customHobbies: "",
    
    // Step 9: Profile Picture (Avatar)
    avatarUrl: "",
    
    // Step 10: About Me (Optional Bio)
    aboutMe: "",
    
    // Custom fields for "Other" options
    customSymptoms: "",
    customMedications: "",
  });

  const totalSteps = 9;
  const progress = (currentStep / totalSteps) * 100;

  // Fetch existing profile if editing
  useEffect(() => {
    if (user) {
      fetchExistingProfile();
    }
    // Set default avatar if none exists
    if (!profileData.avatarUrl) {
      updateProfileData("avatarUrl", `https://api.dicebear.com/6.x/adventurer/svg?seed=${avatarSeed}`);
    }
  }, [user]);

  const fetchExistingProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setExistingProfile(data);
        setShowRobotNotification(false); // Hide notification for existing profiles
        setProfileData({
          firstName: data.first_name || user.user_metadata?.first_name || "",
          lastName: data.last_name || user.user_metadata?.last_name || "",
          dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
          location: data.location || "",
          msSubtype: data.ms_subtype || "",
          diagnosisYear: data.diagnosis_year ? data.diagnosis_year.toString() : "",
          symptoms: data.symptoms || [],
          medications: data.medications || [],
          hobbies: data.hobbies || [],
          avatarUrl: data.avatar_url || "",
          aboutMe: data.about_me || "",
          customHobbies: "",
          customSymptoms: "",
          customMedications: "",
        });
      } else {
        // For new profiles, get name from user metadata
        setProfileData(prev => ({
          ...prev,
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete profile setup and save to database
      await saveProfile();
    }
  };

  const saveProfile = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save your profile.",
      });
      return;
    }

    setLoading(true);
    try {
      // Combine custom entries with selected options
      const allSymptoms = [...profileData.symptoms];
      if (profileData.customSymptoms.trim()) {
        allSymptoms.push(...profileData.customSymptoms.split(',').map(s => s.trim()).filter(s => s));
      }

      const allMedications = [...profileData.medications];
      if (profileData.customMedications.trim()) {
        allMedications.push(...profileData.customMedications.split(',').map(m => m.trim()).filter(m => m));
      }

      const allHobbies = [...profileData.hobbies];
      if (profileData.customHobbies.trim()) {
        allHobbies.push(...profileData.customHobbies.split(',').map(h => h.trim()).filter(h => h));
      }

      const profileToSave = {
        user_id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        date_of_birth: profileData.dateOfBirth?.toISOString().split('T')[0] || null,
        location: profileData.location,
        ms_subtype: profileData.msSubtype,
        diagnosis_year: profileData.diagnosisYear ? parseInt(profileData.diagnosisYear) : null,
        symptoms: allSymptoms,
        medications: allMedications,
        hobbies: allHobbies,
        avatar_url: profileData.avatarUrl,
        about_me: profileData.aboutMe,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileToSave, { onConflict: 'user_id' });

      if (error) {
        console.error('Profile save error:', error);
        toast({
          variant: "destructive",
          title: "Error saving profile",
          description: error.message,
        });
        return;
      }

      toast({
        title: existingProfile ? "Profile Updated! ✨" : "Profile Completed! 🎉",
        description: existingProfile ? "Your profile has been updated successfully." : "Welcome to the MSTwins community!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setLoading(false);
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

  const rerollAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(newSeed);
    // Get current style or default to adventurer
    const currentStyle = profileData.avatarUrl && profileData.avatarUrl.includes('dicebear') 
      ? profileData.avatarUrl.split('/')[4] 
      : 'adventurer';
    updateProfileData("avatarUrl", `https://api.dicebear.com/6.x/${currentStyle}/svg?seed=${newSeed}`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updateProfileData("avatarUrl", data.publicUrl);
      
      toast({
        title: "Photo uploaded successfully!",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const getEmojiForHobby = (hobby: string) => {
    const emojiMap: { [key: string]: string } = {
      "Reading": "📚", "Exercise/Fitness": "💪", "Cooking": "🍳", "Art/Drawing": "🎨", 
      "Music": "🎵", "Travel": "✈️", "Photography": "📸", "Gaming": "🎮", 
      "Gardening": "🌱", "Volunteering": "❤️", "Crafts": "✂️", "Sports": "⚽",
      "Writing": "✍️", "Movies/TV": "🎬", "Board games": "🎲", "Meditation": "🧘",
      "Yoga": "🧘‍♀️", "Swimming": "🏊", "Walking/Hiking": "🚶", "Dancing": "💃",
      "Knitting/Sewing": "🧶", "Technology": "💻", "Learning": "🎓", "Podcasts": "🎧",
      "Nature": "🌿", "Animals/Pets": "🐕"
    };
    return emojiMap[hobby] || "🌟";
  };

  const symptomsData = [
    { name: "Fatigue", emoji: "😴", color: "bg-red-100 text-red-800 hover:bg-red-200" },
    { name: "Walking difficulties", emoji: "🚶‍♂️", color: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
    { name: "Vision problems", emoji: "👁️", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
    { name: "Numbness/tingling", emoji: "🤏", color: "bg-green-100 text-green-800 hover:bg-green-200" },
    { name: "Muscle weakness", emoji: "💪", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
    { name: "Balance problems", emoji: "⚖️", color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" },
    { name: "Cognitive changes", emoji: "🧠", color: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
    { name: "Bladder issues", emoji: "🚽", color: "bg-pink-100 text-pink-800 hover:bg-pink-200" },
    { name: "Spasticity", emoji: "🤲", color: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200" },
    { name: "Pain", emoji: "😣", color: "bg-red-100 text-red-800 hover:bg-red-200" },
    { name: "Depression", emoji: "😔", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
    { name: "Dizziness", emoji: "💫", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
    { name: "Speech problems", emoji: "🗣️", color: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
    { name: "Swallowing difficulties", emoji: "🥤", color: "bg-lime-100 text-lime-800 hover:bg-lime-200" },
    { name: "Tremor", emoji: "🤝", color: "bg-teal-100 text-teal-800 hover:bg-teal-200" },
    { name: "Heat sensitivity", emoji: "🌡️", color: "bg-rose-100 text-rose-800 hover:bg-rose-200" }
  ];

  const medicationsData = [
    { name: "Tecfidera", emoji: "💊", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
    { name: "Copaxone", emoji: "💉", color: "bg-green-100 text-green-800 hover:bg-green-200" },
    { name: "Betaseron", emoji: "🩹", color: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
    { name: "Avonex", emoji: "💊", color: "bg-red-100 text-red-800 hover:bg-red-200" },
    { name: "Rebif", emoji: "💉", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
    { name: "Tysabri", emoji: "🩺", color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" },
    { name: "Gilenya", emoji: "💊", color: "bg-pink-100 text-pink-800 hover:bg-pink-200" },
    { name: "Aubagio", emoji: "🧪", color: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200" },
    { name: "Lemtrada", emoji: "💉", color: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
    { name: "Ocrevus", emoji: "🩹", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
    { name: "Mavenclad", emoji: "💊", color: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
    { name: "Kesimpta", emoji: "💉", color: "bg-lime-100 text-lime-800 hover:bg-lime-200" },
    { name: "Ponvory", emoji: "🧬", color: "bg-teal-100 text-teal-800 hover:bg-teal-200" },
    { name: "Zeposia", emoji: "💊", color: "bg-rose-100 text-rose-800 hover:bg-rose-200" },
    { name: "Vumerity", emoji: "🩺", color: "bg-violet-100 text-violet-800 hover:bg-violet-200" },
    { name: "None", emoji: "❌", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" }
  ];

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
              <h2 className="text-2xl font-bold">Date of Birth</h2>
              <p className="text-muted-foreground">When were you born?</p>
            </div>
            <div className="space-y-4">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="birthMonth" className="text-xs">Month</Label>
                  <Select 
                    value={profileData.dateOfBirth ? (profileData.dateOfBirth.getMonth() + 1).toString() : ""} 
                    onValueChange={(month) => {
                      const currentDate = profileData.dateOfBirth || new Date();
                      const newDate = new Date(currentDate.getFullYear(), parseInt(month) - 1, currentDate.getDate());
                      updateProfileData("dateOfBirth", newDate);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2000, i, 1).toLocaleDateString('en', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birthDay" className="text-xs">Day</Label>
                  <Select 
                    value={profileData.dateOfBirth ? profileData.dateOfBirth.getDate().toString() : ""} 
                    onValueChange={(day) => {
                      const currentDate = profileData.dateOfBirth || new Date();
                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day));
                      updateProfileData("dateOfBirth", newDate);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birthYear" className="text-xs">Year</Label>
                  <Select 
                    value={profileData.dateOfBirth ? profileData.dateOfBirth.getFullYear().toString() : ""} 
                    onValueChange={(year) => {
                      const currentDate = profileData.dateOfBirth || new Date();
                      const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                      updateProfileData("dateOfBirth", newDate);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
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

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">MS Subtype</h2>
              <p className="text-muted-foreground">What type of MS do you have?</p>
            </div>
            <div>
              <Label htmlFor="msSubtype">MS Subtype</Label>
              <Select value={profileData.msSubtype} onValueChange={(value) => updateProfileData("msSubtype", value)}>
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

      case 4:
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

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Symptoms</h2>
              <p className="text-muted-foreground">What symptoms do you experience?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {symptomsData.map((symptom) => (
                <Button
                  key={symptom.name}
                  variant={profileData.symptoms.includes(symptom.name) ? "default" : "outline"}
                  onClick={() => toggleArrayItem("symptoms", symptom.name)}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center justify-center text-center transition-all",
                    profileData.symptoms.includes(symptom.name) 
                      ? "ring-2 ring-primary shadow-medium" 
                      : "hover:shadow-soft border-2 hover:border-primary/30"
                  )}
                >
                  <span className="text-2xl mb-1">{symptom.emoji}</span>
                  <span className="text-xs leading-tight">{symptom.name}</span>
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="customSymptoms">Other symptoms (comma-separated)</Label>
              <Input
                id="customSymptoms"
                value={profileData.customSymptoms}
                onChange={(e) => updateProfileData("customSymptoms", e.target.value)}
                placeholder="e.g., Anxiety, Sleep issues, Memory problems"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Medications</h2>
              <p className="text-muted-foreground">What medications are you currently taking?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {medicationsData.map((medication) => (
                <Button
                  key={medication.name}
                  variant={profileData.medications.includes(medication.name) ? "default" : "outline"}
                  onClick={() => toggleArrayItem("medications", medication.name)}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center justify-center text-center transition-all",
                    profileData.medications.includes(medication.name) 
                      ? "ring-2 ring-primary shadow-medium" 
                      : "hover:shadow-soft border-2 hover:border-primary/30"
                  )}
                >
                  <span className="text-2xl mb-1">{medication.emoji}</span>
                  <span className="text-xs leading-tight">{medication.name}</span>
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="customMedications">Other medications (comma-separated)</Label>
              <Input
                id="customMedications"
                value={profileData.customMedications}
                onChange={(e) => updateProfileData("customMedications", e.target.value)}
                placeholder="e.g., Vitamin D, Pain medication, Anti-depressants"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Interests & Hobbies</h2>
              <p className="text-muted-foreground">What do you enjoy doing?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {[
                "Reading", "Exercise/Fitness", "Cooking", "Art/Drawing", "Music", "Travel", 
                "Photography", "Gaming", "Gardening", "Volunteering", "Crafts", "Sports",
                "Writing", "Movies/TV", "Board games", "Meditation", "Yoga", "Swimming",
                "Walking/Hiking", "Dancing", "Knitting/Sewing", "Technology", "Learning",
                "Podcasts", "Nature", "Animals/Pets"
              ].map((hobby) => (
                <Button
                  key={hobby}
                  variant={profileData.hobbies.includes(hobby) ? "accent" : "outline"}
                  onClick={() => toggleArrayItem("hobbies", hobby)}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center justify-center text-center transition-all",
                    profileData.hobbies.includes(hobby) 
                      ? "ring-2 ring-accent shadow-medium" 
                      : "hover:shadow-soft border-2 hover:border-accent/30"
                  )}
                >
                  <span className="text-2xl mb-1">{getEmojiForHobby(hobby)}</span>
                  <span className="text-xs leading-tight">{hobby}</span>
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <Label htmlFor="customHobbies">Other interests (comma-separated)</Label>
              <Input
                id="customHobbies"
                value={profileData.customHobbies}
                onChange={(e) => updateProfileData("customHobbies", e.target.value)}
                placeholder="e.g., Birdwatching, Collecting, Astronomy"
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Profile Picture</h2>
              <p className="text-muted-foreground">It's your choice - upload your own photo or use an avatar!</p>
            </div>

            {/* Robot hint notification */}
            {showRobotNotification && (
              <div className="relative mb-6 animate-fade-in">
                <div className="bg-background/95 backdrop-blur-md border rounded-lg p-4 shadow-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <img 
                        src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                        alt="MSTwins robot" 
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3 shadow-sm relative">
                        <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                        <p className="text-sm text-foreground">
                          💡 <strong>Pro tip:</strong> You can upload your own photo or choose from our fun avatar styles. 
                          Don't like the current avatars? Click "Reroll" to get new ones!
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRobotNotification(false)}
                      className="flex-shrink-0 p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground">Avatar</span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-2">Upload Your Own Photo</h3>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload">
                      <Button variant="outline" className="w-full max-w-xs" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Your Photo
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <h3 className="font-semibold text-sm">Choose an Avatar Style</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={rerollAvatar} 
                      title="Don't like these? Click to get new avatar options!"
                      className="text-xs px-2 py-1 h-auto"
                    >
                      <Shuffle className="w-3 h-3 mr-1" />
                      New Options
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Not happy with these avatars? Click "New Options" to generate different ones!
                  </p>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { style: "adventurer" },
                      { style: "avataaars" },
                      { style: "big-ears" },
                      { style: "personas" }
                    ].map(({ style }) => (
                      <Button
                        key={style}
                        variant={profileData.avatarUrl?.includes(style) ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateProfileData("avatarUrl", `https://api.dicebear.com/6.x/${style}/svg?seed=${avatarSeed}`)}
                        className="h-16 flex flex-col gap-1"
                      >
                        <img 
                          src={`https://api.dicebear.com/6.x/${style}/svg?seed=${avatarSeed}`} 
                          alt={style}
                          className="w-8 h-8 rounded"
                        />
                        <span className="text-xs capitalize">{style}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Robot Welcome Message - Only for new users */}
      {showRobotNotification && !existingProfile && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="flex items-start space-x-3">
            <img 
              src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
              alt="Helpful robot"
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="bg-white rounded-lg p-3 shadow-sm relative">
                <div className="absolute -left-2 top-3 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                <p className="text-sm text-foreground mb-2">
                  <strong>Welcome to MSTwins!</strong> 🎉
                </p>
                <p className="text-sm text-foreground">
                  Let's create your profile so you can start connecting with the MS community. Take your time with each step!
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRobotNotification(false)}
              className="flex-shrink-0 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">
                {existingProfile ? "Edit Profile" : `Step ${currentStep} of ${totalSteps}`}
              </div>
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>

          {/* Progress Bar - Only show for new profiles */}
          {!existingProfile && (
            <div className="mb-8">
              <Progress value={progress} className="h-2" />
            </div>
          )}

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
            <Button onClick={handleNext} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {existingProfile ? "Update Profile" : "Complete Profile"}
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
    </div>
  );
};

export default ProfileSetup;
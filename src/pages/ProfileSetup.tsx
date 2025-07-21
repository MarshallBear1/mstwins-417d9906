import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Shuffle, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: undefined as Date | undefined,
    location: "",
    msSubtype: "",
    diagnosisYear: "",
    symptoms: [] as string[],
    medications: [] as string[],
    hobbies: [] as string[],
    avatarUrl: "",
    aboutMe: "",
  });

  // Fetch existing profile if editing
  useEffect(() => {
    if (user) {
      fetchExistingProfile();
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
        setProfileData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
          location: data.location || "",
          msSubtype: data.ms_subtype || "",
          diagnosisYear: data.diagnosis_year ? data.diagnosis_year.toString() : "",
          symptoms: data.symptoms || [],
          medications: data.medications || [],
          hobbies: data.hobbies || [],
          avatarUrl: data.avatar_url || "",
          aboutMe: data.about_me || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      const profileToSave = {
        user_id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        date_of_birth: profileData.dateOfBirth?.toISOString().split('T')[0] || null,
        location: profileData.location,
        ms_subtype: profileData.msSubtype,
        diagnosis_year: profileData.diagnosisYear ? parseInt(profileData.diagnosisYear) : null,
        symptoms: profileData.symptoms,
        medications: profileData.medications,
        hobbies: profileData.hobbies,
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
        title: existingProfile ? "Profile Updated! ✨" : "Profile Created! 🎉",
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

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const rerollAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(newSeed);
    const currentStyle = profileData.avatarUrl ? profileData.avatarUrl.split('/')[4] : 'adventurer';
    updateProfileData("avatarUrl", `https://api.dicebear.com/6.x/${currentStyle}/svg?seed=${newSeed}`);
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

  const hobbiesData = [
    { name: "Reading", emoji: "📚" }, { name: "Exercise/Fitness", emoji: "💪" }, 
    { name: "Cooking", emoji: "🍳" }, { name: "Art/Drawing", emoji: "🎨" }, 
    { name: "Music", emoji: "🎵" }, { name: "Travel", emoji: "✈️" }, 
    { name: "Photography", emoji: "📸" }, { name: "Gaming", emoji: "🎮" }, 
    { name: "Gardening", emoji: "🌱" }, { name: "Volunteering", emoji: "❤️" }, 
    { name: "Crafts", emoji: "✂️" }, { name: "Sports", emoji: "⚽" },
    { name: "Writing", emoji: "✍️" }, { name: "Movies/TV", emoji: "🎬" }, 
    { name: "Board games", emoji: "🎲" }, { name: "Meditation", emoji: "🧘" },
    { name: "Yoga", emoji: "🧘‍♀️" }, { name: "Swimming", emoji: "🏊" }, 
    { name: "Walking/Hiking", emoji: "🚶" }, { name: "Dancing", emoji: "💃" },
    { name: "Knitting/Sewing", emoji: "🧶" }, { name: "Technology", emoji: "💻" }, 
    { name: "Learning", emoji: "🎓" }, { name: "Podcasts", emoji: "🎧" },
    { name: "Nature", emoji: "🌿" }, { name: "Animals/Pets", emoji: "🐕" }
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

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {existingProfile ? "Edit Profile" : "Create Your Profile"}
            </h1>
            <p className="text-muted-foreground">
              {existingProfile ? "Update your information" : "Tell us about yourself"}
            </p>
          </div>
          <div className="w-32" />
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => updateProfileData("firstName", e.target.value)}
                    placeholder="Sarah"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => updateProfileData("lastName", e.target.value)}
                    placeholder="Johnson"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => updateProfileData("location", e.target.value)}
                    placeholder="New York, NY, USA"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏥 Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🩺 Symptoms
                <span className="text-sm font-normal text-muted-foreground">
                  (Select all that apply)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {symptomsData.map((symptom) => (
                  <Badge
                    key={symptom.name}
                    variant={profileData.symptoms.includes(symptom.name) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      profileData.symptoms.includes(symptom.name) 
                        ? "bg-primary text-primary-foreground" 
                        : symptom.color
                    }`}
                    onClick={() => toggleArrayItem("symptoms", symptom.name)}
                  >
                    <span className="mr-1">{symptom.emoji}</span>
                    {symptom.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💊 Medications
                <span className="text-sm font-normal text-muted-foreground">
                  (Select all that apply)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {medicationsData.map((medication) => (
                  <Badge
                    key={medication.name}
                    variant={profileData.medications.includes(medication.name) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      profileData.medications.includes(medication.name) 
                        ? "bg-primary text-primary-foreground" 
                        : medication.color
                    }`}
                    onClick={() => toggleArrayItem("medications", medication.name)}
                  >
                    <span className="mr-1">{medication.emoji}</span>
                    {medication.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests & Hobbies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Interests & Hobbies
                <span className="text-sm font-normal text-muted-foreground">
                  (Select all that apply)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {hobbiesData.map((hobby) => (
                  <Badge
                    key={hobby.name}
                    variant={profileData.hobbies.includes(hobby.name) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleArrayItem("hobbies", hobby.name)}
                  >
                    <span className="mr-1">{hobby.emoji}</span>
                    {hobby.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📸 Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                  {profileData.avatarUrl ? (
                    <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground">No Avatar</span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    {profileData.avatarUrl && (
                      <Button variant="outline" onClick={rerollAvatar} title="Generate new avatar">
                        <Shuffle className="w-4 h-4 mr-2" />
                        Reroll
                      </Button>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Or choose an avatar style:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { style: "adventurer", name: "Adventurer" },
                        { style: "avataaars", name: "Avataaars" },
                        { style: "big-ears", name: "Big Ears" },
                        { style: "personas", name: "Personas" }
                      ].map(({ style, name }) => (
                        <Button
                          key={style}
                          variant={profileData.avatarUrl?.includes(style) ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateProfileData("avatarUrl", `https://api.dicebear.com/6.x/${style}/svg?seed=${avatarSeed}`)}
                          className="h-20 flex flex-col gap-1"
                        >
                          <img 
                            src={`https://api.dicebear.com/6.x/${style}/svg?seed=${avatarSeed}`} 
                            alt={style}
                            className="w-8 h-8 rounded"
                          />
                          <span className="text-xs">{name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Me */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ✍️ About Me
                <span className="text-sm font-normal text-muted-foreground">
                  (Optional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profileData.aboutMe}
                onChange={(e) => updateProfileData("aboutMe", e.target.value)}
                placeholder="Share a bit about yourself, your MS journey, what you're looking for in the community, or anything else you'd like others to know..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This helps others understand who you are and what you're looking for in connections.
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveProfile} 
              disabled={loading || !profileData.firstName || !profileData.lastName || !profileData.location}
              size="lg"
              className="min-w-32"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {existingProfile ? "Update Profile" : "Create Profile"}
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
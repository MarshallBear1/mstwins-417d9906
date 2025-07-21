import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  User, 
  MapPin, 
  Calendar as CalendarIcon, 
  Edit, 
  Save, 
  X, 
  LogOut 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
}

interface ProfileCardProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
  onSignOut: () => void;
}

const ProfileCard = ({ profile, onProfileUpdate, onSignOut }: ProfileCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    location: profile.location,
    ms_subtype: profile.ms_subtype || "",
    diagnosis_year: profile.diagnosis_year?.toString() || "",
    date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
    about_me: profile.about_me || "",
  });

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        location: editData.location,
        ms_subtype: editData.ms_subtype || null,
        diagnosis_year: editData.diagnosis_year ? parseInt(editData.diagnosis_year) : null,
        date_of_birth: editData.date_of_birth ? editData.date_of_birth.toISOString().split('T')[0] : null,
        about_me: editData.about_me || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', profile.user_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile. Please try again.",
        });
        return;
      }

      onProfileUpdate(data);
      setIsEditing(false);
      toast({
        title: "Profile Updated! ✨",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      first_name: profile.first_name,
      last_name: profile.last_name,
      location: profile.location,
      ms_subtype: profile.ms_subtype || "",
      diagnosis_year: profile.diagnosis_year?.toString() || "",
      date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      about_me: profile.about_me || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <Card className="overflow-hidden shadow-xl">
          <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    className="bg-white/80 hover:bg-white"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSave}
                    className="bg-white/80 hover:bg-white text-green-600"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="bg-white/80 hover:bg-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onSignOut}
                    className="bg-white/80 hover:bg-white text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <CardContent className="p-6 space-y-4">
            {/* Name and Age */}
            <div className="flex items-center justify-between">
              {isEditing ? (
                <div className="flex gap-2 flex-1">
                  <Input
                    value={editData.first_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="First name"
                    className="flex-1"
                  />
                  <Input
                    value={editData.last_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Last name"
                    className="flex-1"
                  />
                </div>
              ) : (
                <h3 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h3>
              )}
              {profile.date_of_birth && !isEditing && (
                <span className="text-xl font-semibold text-muted-foreground">
                  {calculateAge(profile.date_of_birth)}
                </span>
              )}
            </div>

            {/* Date of Birth (only when editing) */}
            {isEditing && (
              <div>
                <label className="text-sm font-medium mb-2 block">Date of Birth</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editData.date_of_birth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.date_of_birth ? format(editData.date_of_birth, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editData.date_of_birth}
                      onSelect={(date) => setEditData(prev => ({ ...prev, date_of_birth: date }))}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              {isEditing ? (
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State/Province, Country"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
            </div>

            {/* Diagnosis Year */}
            {isEditing ? (
              <div>
                <label className="text-sm font-medium mb-2 block">Diagnosis Year</label>
                <Input
                  type="number"
                  value={editData.diagnosis_year}
                  onChange={(e) => setEditData(prev => ({ ...prev, diagnosis_year: e.target.value }))}
                  placeholder="Year diagnosed"
                  min="1950"
                  max={new Date().getFullYear()}
                />
              </div>
            ) : (
              profile.diagnosis_year && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm">Diagnosed in {profile.diagnosis_year}</span>
                </div>
              )
            )}

            {/* MS Type */}
            {isEditing ? (
              <div>
                <label className="text-sm font-medium mb-2 block">MS Type</label>
                <Select value={editData.ms_subtype} onValueChange={(value) => setEditData(prev => ({ ...prev, ms_subtype: value }))}>
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
            ) : (
              profile.ms_subtype && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">MS Type</h4>
                  <span className="text-muted-foreground">{profile.ms_subtype}</span>
                </div>
              )
            )}

            {/* About Me */}
            {isEditing ? (
              <div>
                <label className="text-sm font-medium mb-2 block">About Me</label>
                <Textarea
                  value={editData.about_me}
                  onChange={(e) => setEditData(prev => ({ ...prev, about_me: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="min-h-[80px]"
                />
              </div>
            ) : (
              profile.about_me && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.about_me}
                  </p>
                </div>
              )
            )}

            {/* Interests (read-only for now) */}
            {!isEditing && profile.hobbies.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.slice(0, 6).map((hobby, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                      {hobby}
                    </Badge>
                  ))}
                  {profile.hobbies.length > 6 && (
                    <Badge variant="outline">
                      +{profile.hobbies.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {isEditing && (
              <div className="text-xs text-muted-foreground">
                💡 To edit interests, symptoms, and medications, visit the full profile setup.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCard;
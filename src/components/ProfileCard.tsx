import { useState } from "react";
import ProfileImageViewer from "@/components/ProfileImageViewer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  LogOut,
  Upload,
  Camera,
  Trash2,
  ArrowLeftRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  location: string;
  gender: string | null;
  ms_subtype: string | null;
  diagnosis_year: number | null;
  symptoms: string[];
  medications: string[];
  hobbies: string[];
  avatar_url: string | null;
  about_me: string | null;
  last_seen?: string | null;
  additional_photos?: string[];
  selected_prompts?: {
    question: string;
    answer: string;
  }[];
  extended_profile_completed?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
  onSignOut: () => void;
}

const ProfileCard = ({ profile, onProfileUpdate, onSignOut }: ProfileCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [editData, setEditData] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    location: profile.location,
    gender: profile.gender || "",
    ms_subtype: profile.ms_subtype || "",
    diagnosis_year: profile.diagnosis_year?.toString() || "",
    date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
    about_me: profile.about_me || "",
    avatar_url: profile.avatar_url || "",
    symptoms: profile.symptoms || [],
    medications: profile.medications || [],
    hobbies: profile.hobbies || [],
    newSymptom: "",
    newMedication: "",
    newHobby: ""
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

      setEditData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        location: editData.location,
        gender: editData.gender || null,
        ms_subtype: editData.ms_subtype || null,
        diagnosis_year: editData.diagnosis_year ? parseInt(editData.diagnosis_year) : null,
        date_of_birth: editData.date_of_birth ? editData.date_of_birth.toISOString().split('T')[0] : null,
        about_me: editData.about_me || null,
        avatar_url: editData.avatar_url || null,
        symptoms: editData.symptoms,
        medications: editData.medications,
        hobbies: editData.hobbies,
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

      onProfileUpdate({
        ...data,
        selected_prompts: Array.isArray(data.selected_prompts) ? data.selected_prompts as { question: string; answer: string; }[] : []
      });
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
      gender: profile.gender || "",
      ms_subtype: profile.ms_subtype || "",
      diagnosis_year: profile.diagnosis_year?.toString() || "",
      date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      about_me: profile.about_me || "",
      avatar_url: profile.avatar_url || "",
      symptoms: profile.symptoms || [],
      medications: profile.medications || [],
      hobbies: profile.hobbies || [],
      newSymptom: "",
      newMedication: "",
      newHobby: ""
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // First delete profile data
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      // Delete other user data
      await Promise.all([
        supabase.from('likes').delete().eq('liker_id', user.id),
        supabase.from('likes').delete().eq('liked_id', user.id),
        supabase.from('messages').delete().eq('sender_id', user.id),
        supabase.from('messages').delete().eq('receiver_id', user.id),
        supabase.from('matches').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        supabase.from('notifications').delete().eq('user_id', user.id),
        supabase.from('passes').delete().eq('passer_id', user.id),
        supabase.from('passes').delete().eq('passed_id', user.id),
        supabase.from('feedback').delete().eq('user_id', user.id),
        supabase.from('user_reports').delete().eq('reporter_id', user.id)
      ]);

      // Finally sign out the user (this will effectively "delete" their auth account from their perspective)
      await supabase.auth.signOut();
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Navigate to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Helper functions for managing arrays
  const addItem = (arrayField: 'symptoms' | 'medications' | 'hobbies', inputField: 'newSymptom' | 'newMedication' | 'newHobby') => {
    const value = editData[inputField].trim();
    if (value && !editData[arrayField].includes(value)) {
      setEditData(prev => ({
        ...prev,
        [arrayField]: [...prev[arrayField], value],
        [inputField]: ""
      }));
    }
  };

  const removeItem = (arrayField: 'symptoms' | 'medications' | 'hobbies', item: string) => {
    setEditData(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].filter(i => i !== item)
    }));
  };

  const hasExtendedContent = profile.additional_photos?.length || 
                           profile.selected_prompts?.length || 
                           profile.medications?.length || 
                           profile.symptoms?.length;

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto" style={{ perspective: '1000px' }}>
        <div 
          className={`relative w-full transition-transform duration-700`}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front Side */}
          <Card className={`overflow-hidden shadow-xl ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            position: isFlipped ? 'absolute' : 'relative',
            zIndex: isFlipped ? 1 : 2
          }}
          >
          <div className="relative h-32 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
            <div 
              className={`relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg ${!isEditing ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              onClick={!isEditing ? () => setShowImageViewer(true) : undefined}
            >
              {(isEditing ? editData.avatar_url : profile.avatar_url) ? (
                <img 
                  src={isEditing ? editData.avatar_url : profile.avatar_url} 
                  alt={profile.first_name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              {/* Upload Button in Edit Mode */}
              {isEditing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="text-white text-center">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs">Change</span>
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Flip button */}
            {!isEditing && hasExtendedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute top-3 left-3 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg animate-pulse"
              >
                <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
              </Button>
            )}

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

            {/* Date of Birth (only when editing) - Enhanced Year Selection */}
            {isEditing && (
              <div className="space-y-4">
                <label className="text-sm font-medium mb-2 block">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="birthMonth" className="text-xs">Month</Label>
                    <Select 
                      value={editData.date_of_birth ? (editData.date_of_birth.getMonth() + 1).toString() : ""} 
                      onValueChange={(month) => {
                        const currentDate = editData.date_of_birth || new Date();
                        const newDate = new Date(currentDate.getFullYear(), parseInt(month) - 1, currentDate.getDate());
                        setEditData(prev => ({ ...prev, date_of_birth: newDate }));
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
                      value={editData.date_of_birth ? editData.date_of_birth.getDate().toString() : ""} 
                      onValueChange={(day) => {
                        const currentDate = editData.date_of_birth || new Date();
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day));
                        setEditData(prev => ({ ...prev, date_of_birth: newDate }));
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
                      value={editData.date_of_birth ? editData.date_of_birth.getFullYear().toString() : ""} 
                      onValueChange={(year) => {
                        const currentDate = editData.date_of_birth || new Date();
                        const newDate = new Date(parseInt(year), currentDate.getMonth(), currentDate.getDate());
                        setEditData(prev => ({ ...prev, date_of_birth: newDate }));
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
            )}

            {/* Gender */}
            <div className="space-y-2">
              {isEditing ? (
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={editData.gender || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : profile.gender && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</span>
                </div>
              )}
            </div>

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
                  <span className="text-muted-foreground">{profile.ms_subtype.toUpperCase()}</span>
                </div>
              )
            )}

            {/* Interests/Hobbies - Editable */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Interests</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {editData.hobbies.map((hobby, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 pr-1">
                        {hobby}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                          onClick={() => removeItem('hobbies', hobby)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={editData.newHobby}
                      onChange={(e) => setEditData(prev => ({ ...prev, newHobby: e.target.value }))}
                      placeholder="Add an interest..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addItem('hobbies', 'newHobby')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem('hobbies', 'newHobby')}
                      disabled={!editData.newHobby.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No interests added yet</span>
                  )}
                </div>
              )}
            </div>

            {/* Medications - Editable */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Medications</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {editData.medications.map((medication, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-700 pr-1">
                        {medication}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0 hover:bg-green-200"
                          onClick={() => removeItem('medications', medication)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={editData.newMedication}
                      onChange={(e) => setEditData(prev => ({ ...prev, newMedication: e.target.value }))}
                      placeholder="Add a medication..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addItem('medications', 'newMedication')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem('medications', 'newMedication')}
                      disabled={!editData.newMedication.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.medications.length > 0 ? (
                    <>
                      {profile.medications.slice(0, 6).map((medication, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                          {medication}
                        </Badge>
                      ))}
                      {profile.medications.length > 6 && (
                        <Badge variant="outline">
                          +{profile.medications.length - 6} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No medications added yet</span>
                  )}
                </div>
              )}
            </div>

            {/* Symptoms - Editable */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Symptoms</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {editData.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-700 pr-1">
                        {symptom}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0 hover:bg-orange-200"
                          onClick={() => removeItem('symptoms', symptom)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={editData.newSymptom}
                      onChange={(e) => setEditData(prev => ({ ...prev, newSymptom: e.target.value }))}
                      placeholder="Add a symptom..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addItem('symptoms', 'newSymptom')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem('symptoms', 'newSymptom')}
                      disabled={!editData.newSymptom.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.symptoms.length > 0 ? (
                    <>
                      {profile.symptoms.slice(0, 6).map((symptom, index) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-700">
                          {symptom}
                        </Badge>
                      ))}
                      {profile.symptoms.length > 6 && (
                        <Badge variant="outline">
                          +{profile.symptoms.length - 6} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No symptoms added yet</span>
                  )}
                </div>
              )}
            </div>

            {/* See More Button - Moved to after symptoms */}
            {!isEditing && hasExtendedContent && (
              <Button 
                variant="outline" 
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 h-12"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                See More
              </Button>
            )}

            {/* Account Settings Section */}
            {!isEditing && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Account Settings</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/extended-profile')}
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 mb-2"
                  >
                    ✨ Edit Extended Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Side - Extended Profile */}
        <Card className={`overflow-hidden shadow-xl ${
          !isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          position: !isFlipped ? 'absolute' : 'relative',
          top: !isFlipped ? 0 : 'auto',
          zIndex: !isFlipped ? 1 : 2
        }}
        >
          <div className="relative h-32 bg-gradient-to-br from-purple-400 via-purple-300 to-pink-300 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFlipped(!isFlipped)}
              className="absolute top-3 left-3 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg"
            >
              <ArrowLeftRight className="w-4 h-4 text-white drop-shadow-sm" />
            </Button>
            <div className="text-center text-white">
              <h3 className="text-lg font-bold">My Extended Profile</h3>
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Medications */}
            {profile.medications?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Medications</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map((medication, index) => (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs"
                    >
                      {medication}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Symptoms */}
            {profile.symptoms?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Symptoms</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.symptoms.map((symptom, index) => (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 text-xs"
                    >
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Photos */}
            {profile.additional_photos && profile.additional_photos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">More Photos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {profile.additional_photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg border"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Stories */}
            {profile.selected_prompts && profile.selected_prompts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Personal Stories</h4>
                {profile.selected_prompts.map((prompt, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {prompt.question}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {prompt.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* No Extended Content */}
            {!hasExtendedContent && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">
                  No extended profile details yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/extended-profile')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  ✨ Add Extended Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-lg p-6 max-w-sm w-full">
              <h3 className="font-semibold text-lg mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data, matches, and messages.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {deleting ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Image Viewer */}
        <ProfileImageViewer 
          images={profile.avatar_url ? [profile.avatar_url] : []}
          currentIndex={0}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
        />
      </div>
    </div>
  );
};

export default ProfileCard;

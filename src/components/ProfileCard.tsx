import { useState } from "react";
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
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
  last_seen?: string | null;
}

interface ProfileCardProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
  onSignOut: () => void;
}

const ProfileCard = ({ profile, onProfileUpdate, onSignOut }: ProfileCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    location: profile.location,
    ms_subtype: profile.ms_subtype || "",
    diagnosis_year: profile.diagnosis_year?.toString() || "",
    date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
    about_me: profile.about_me || "",
    avatar_url: profile.avatar_url || "",
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
        ms_subtype: editData.ms_subtype || null,
        diagnosis_year: editData.diagnosis_year ? parseInt(editData.diagnosis_year) : null,
        date_of_birth: editData.date_of_birth ? editData.date_of_birth.toISOString().split('T')[0] : null,
        about_me: editData.about_me || null,
        avatar_url: editData.avatar_url || null,
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
      avatar_url: profile.avatar_url || "",
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // Delete the user account (this will cascade to delete related data due to foreign keys)
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error('Error deleting account:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete account. Please contact support.",
        });
        return;
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out the user
      onSignOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive", 
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <Card className="overflow-hidden shadow-xl">
          <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300 flex items-center justify-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
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

            {/* Medications (read-only for now) */}
            {!isEditing && profile.medications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Medications</h4>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            )}

            {/* Symptoms (read-only for now) */}
            {!isEditing && profile.symptoms.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Symptoms</h4>
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            )}

            {isEditing && (
              <div className="text-xs text-muted-foreground">
                💡 To edit interests, symptoms, and medications, visit the full profile setup.
              </div>
            )}

            {/* Account Settings Section */}
            {!isEditing && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Account Settings</h4>
                <div className="space-y-2">
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
      </div>
    </div>
  );
};

export default ProfileCard;
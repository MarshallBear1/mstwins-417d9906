import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Upload, 
  Calendar,
  MapPin,
  Heart,
  MessageSquare,
  Gift,
  Pill,
  Activity,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ClickableProfilePicture from "./ClickableProfilePicture";

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
  last_seen: string | null;
  additional_photos?: string[];
  selected_prompts?: {
    question: string;
    answer: string;
  }[];
  extended_profile_completed?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
  onSignOut: () => void;
}

const ProfileCard = ({ profile, onProfileUpdate, onSignOut }: ProfileCardProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    location: profile.location,
    about_me: profile.about_me || '',
    hobbies: profile.hobbies,
    symptoms: profile.symptoms,
    medications: profile.medications,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addArrayItem = (field: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ''],
    }));
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    setEditForm(prev => {
      const updatedArray = [...(prev[field] as string[])];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setEditForm(prev => {
      const updatedArray = [...(prev[field] as string[])];
      updatedArray.splice(index, 1);
      return { ...prev, [field]: updatedArray };
    });
  };

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
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          location: editForm.location,
          about_me: editForm.about_me,
          hobbies: editForm.hobbies,
          symptoms: editForm.symptoms,
          medications: editForm.medications,
        })
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile. Please try again.');
        return;
      }

      // Optimistically update the profile
      const updatedProfile = {
        ...profile,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        location: editForm.location,
        about_me: editForm.about_me,
        hobbies: editForm.hobbies,
        symptoms: editForm.symptoms,
        medications: editForm.medications,
      };

      onProfileUpdate(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        toast.error('Failed to upload avatar. Please try again.');
        return;
      }

      const publicURL = `${supabase.supabaseUrl}/storage/v1/object/public/avatars/${filePath}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicURL })
        .eq('user_id', user?.id);

      if (updateError) {
        console.error('Error updating profile with avatar:', updateError);
        toast.error('Failed to update profile with avatar. Please try again.');
        return;
      }

      // Optimistically update the profile
      const updatedProfile = { ...profile, avatar_url: publicURL };
      onProfileUpdate(updatedProfile);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderArrayField = (field: string, label: string, icon: React.ComponentType<any>) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      {editForm[field] && (editForm[field] as string[]).map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            id={`${field}-${index}`}
            value={item}
            onChange={(e) => updateArrayItem(field, index, e.target.value)}
            placeholder={label.slice(0, -1)}
          />
          <Button
            onClick={() => removeArrayItem(field, index)}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        onClick={() => addArrayItem(field)}
        variant="secondary"
        size="sm"
        className="w-full flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add {label.slice(0, -1)}
      </Button>
    </div>
  );

  if (isEditing) {
    return (
      <div className="p-3 sm:p-6 max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <h2 className="text-2xl font-bold">Edit Profile</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-primary border-4 border-white shadow-lg">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={`${profile.first_name}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                placeholder="City, State"
              />
            </div>

            {/* About Me */}
            <div className="space-y-2">
              <Label htmlFor="about_me">About Me</Label>
              <Textarea
                id="about_me"
                value={editForm.about_me}
                onChange={(e) => setEditForm({...editForm, about_me: e.target.value})}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            {/* Hobbies */}
            {renderArrayField('hobbies', 'Hobbies', Gift)}

            {/* Symptoms */}
            {renderArrayField('symptoms', 'Symptoms', Activity)}

            {/* Medications */}
            {renderArrayField('medications', 'Medications', Pill)}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-primary hover:opacity-90 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-blue-400 via-blue-300 to-teal-300">
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <ClickableProfilePicture
              avatarUrl={profile.avatar_url}
              additionalPhotos={profile.additional_photos}
              firstName={profile.first_name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>
        </div>
        
        <CardContent className="pt-20 pb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {profile.first_name} {profile.last_name}
            </h2>
            
            <div className="flex items-center justify-center text-muted-foreground mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{profile.location}</span>
            </div>

            {profile.date_of_birth && (
              <div className="flex items-center justify-center text-muted-foreground mb-4">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{calculateAge(profile.date_of_birth)} years old</span>
              </div>
            )}

            <Button
              onClick={() => setIsEditing(true)}
              className="mb-4"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* MS Information */}
          {profile.ms_subtype && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">MS Information</h3>
              <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                {profile.ms_subtype.toUpperCase()}
              </Badge>
              {profile.diagnosis_year && (
                <p className="text-sm text-muted-foreground mt-2">
                  Diagnosed in {profile.diagnosis_year}
                </p>
              )}
            </div>
          )}

          {/* About Me */}
          {profile.about_me && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">About Me</h3>
              <p className="text-muted-foreground leading-relaxed">
                {profile.about_me}
              </p>
            </div>
          )}

          {/* Hobbies */}
          {profile.hobbies && profile.hobbies.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('hobbies')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  Hobbies & Interests
                </h3>
                {expandedSections.hobbies ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {expandedSections.hobbies && (
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <Badge key={index} variant="secondary">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Symptoms */}
          {profile.symptoms && profile.symptoms.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('symptoms')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Symptoms
                </h3>
                {expandedSections.symptoms ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {expandedSections.symptoms && (
                <div className="flex flex-wrap gap-2">
                  {profile.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medications */}
          {profile.medications && profile.medications.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('medications')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <Pill className="w-5 h-5 mr-2" />
                  Medications
                </h3>
                {expandedSections.medications ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {expandedSections.medications && (
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map((medication, index) => (
                    <Badge key={index} variant="outline">
                      {medication}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Extended Profile Prompt */}
          {!profile.extended_profile_completed && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Make Your Profile Stand Out!</h4>
              <p className="text-blue-700 text-sm mb-3">
                Add more photos and personal stories to increase your chances of making meaningful connections.
              </p>
              <Button 
                size="sm" 
                onClick={() => window.location.href = '/extended-profile'}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More Details
              </Button>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="text-center pt-4 border-t">
            <Button
              onClick={onSignOut}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;

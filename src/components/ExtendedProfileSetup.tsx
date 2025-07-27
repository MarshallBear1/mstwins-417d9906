import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Check, X, Upload, Camera, Plus, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/lib/security";

interface ExtendedProfileData {
  additionalPhotos: string[];
  selectedPrompts: {
    question: string;
    answer: string;
  }[];
}

const availablePrompts = [
  "When and where were you first diagnosed with MS?",
  "Share a funny story related to your MS journey",
  "What's one thing you wish people knew about MS?",
  "What keeps you motivated on difficult days?",
  "What's your favorite way to manage stress?",
  "What hobby or activity brings you the most joy?",
  "What's the best advice you've received about living with MS?",
  "If you could travel anywhere in the world, where would it be and why?",
  "What's something you've accomplished that you're proud of?",
  "What kind of friend or companion are you looking for?",
  "What's your go-to comfort food or meal?",
  "What's a book, movie, or show that's made an impact on you?",
  "How do you typically spend your weekends?",
  "What's your favorite season and why?",
  "What's something that always makes you laugh?",
  "If you could have dinner with anyone (living or dead), who would it be?",
  "What's a skill you'd love to learn or improve?",
  "What's your favorite way to stay active despite MS challenges?",
  "What's the most beautiful place you've ever visited?",
  "What's something you're passionate about outside of MS advocacy?",
  "How do you prefer to receive support from friends?",
  "What's your morning routine like?",
  "What's a childhood memory that always makes you smile?",
  "What's your favorite way to connect with nature?",
  "If you could change one thing about how MS is perceived, what would it be?",
  "What's a goal you're working towards right now?",
  "What's your favorite type of music or artist?",
  "What's something you've learned about yourself since your MS diagnosis?",
  "What's your ideal way to spend a relaxing evening?",
  "What's a tradition or ritual that's important to you?",
  "What advice would you give to someone newly diagnosed with MS?",
  "What's something that surprised you about the MS community?",
  "How do you celebrate your wins, big or small?",
  "What's your favorite way to practice self-care?",
  "What's something you're looking forward to in the future?",
];

const ExtendedProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRobotPrompt, setShowRobotPrompt] = useState(true);
  const [showPhotoChoiceDialog, setShowPhotoChoiceDialog] = useState(false);
  
  const [extendedData, setExtendedData] = useState<ExtendedProfileData>({
    additionalPhotos: [],
    selectedPrompts: []
  });

  useEffect(() => {
    if (user) {
      fetchExtendedProfile();
    }
  }, [user]);

  const fetchExtendedProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('additional_photos, selected_prompts, extended_profile_completed')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching extended profile:', error);
        return;
      }

      if (data) {
        setExtendedData({
          additionalPhotos: data.additional_photos || [],
          selectedPrompts: Array.isArray(data.selected_prompts) ? data.selected_prompts as { question: string; answer: string; }[] : []
        });
        
        // Hide robot prompt if they've already completed extended profile
        if (data.extended_profile_completed) {
          setShowRobotPrompt(false);
        }
      }
    } catch (error) {
      console.error('Error fetching extended profile:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (extendedData.additionalPhotos.length >= 4) {
      toast({
        variant: "destructive",
        title: "Photo limit reached",
        description: "You can upload up to 4 additional photos.",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/additional/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setExtendedData(prev => ({
        ...prev,
        additionalPhotos: [...prev.additionalPhotos, data.publicUrl]
      }));
      
      toast({
        title: "Photo uploaded successfully!",
        description: "Your additional photo has been added.",
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
      setShowPhotoChoiceDialog(false);
      // Reset file input
      const fileInput = document.getElementById('additional-photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const cameraInput = document.getElementById('camera-photo-upload') as HTMLInputElement;
      if (cameraInput) cameraInput.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    if (extendedData.additionalPhotos.length >= 4) {
      toast({
        variant: "destructive",
        title: "Photo limit reached",
        description: "You can upload up to 4 additional photos.",
      });
      return;
    }
    setShowPhotoChoiceDialog(true);
  };

  const handleCameraChoice = () => {
    const input = document.getElementById('camera-photo-upload') as HTMLInputElement;
    input?.click();
  };

  const handleGalleryChoice = () => {
    const input = document.getElementById('additional-photo-upload') as HTMLInputElement;
    input?.click();
  };

  const removePhoto = (index: number) => {
    setExtendedData(prev => ({
      ...prev,
      additionalPhotos: prev.additionalPhotos.filter((_, i) => i !== index)
    }));
  };

  const addPrompt = (question: string) => {
    if (extendedData.selectedPrompts.length >= 3) {
      toast({
        variant: "destructive",
        title: "Prompt limit reached",
        description: "You can select up to 3 prompts to answer.",
      });
      return;
    }

    if (extendedData.selectedPrompts.some(p => p.question === question)) {
      return; // Already selected
    }

    setExtendedData(prev => ({
      ...prev,
      selectedPrompts: [...prev.selectedPrompts, { question, answer: "" }]
    }));
  };

  const removePrompt = (index: number) => {
    setExtendedData(prev => ({
      ...prev,
      selectedPrompts: prev.selectedPrompts.filter((_, i) => i !== index)
    }));
  };

  const updatePromptAnswer = (index: number, answer: string) => {
    setExtendedData(prev => ({
      ...prev,
      selectedPrompts: prev.selectedPrompts.map((prompt, i) => 
        i === index ? { ...prompt, answer } : prompt
      )
    }));
  };

  const saveExtendedProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Sanitize prompt answers
      const sanitizedPrompts = extendedData.selectedPrompts.map(prompt => ({
        question: prompt.question,
        answer: sanitizeInput(prompt.answer, 500)
      }));

      const { error } = await supabase
        .from('profiles')
        .update({
          additional_photos: extendedData.additionalPhotos,
          selected_prompts: sanitizedPrompts,
          extended_profile_completed: true
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Extended profile saved! ✨",
        description: "Your additional details have been added to your profile.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Extended profile save error:', error);
      toast({
        variant: "destructive",
        title: "Error saving extended profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const availablePromptsToShow = availablePrompts.filter(
    prompt => !extendedData.selectedPrompts.some(selected => selected.question === prompt)
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Robot Introduction */}
      {showRobotPrompt && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start space-x-3">
            <img 
              src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
              alt="Helpful robot"
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="bg-white rounded-lg p-4 shadow-sm relative">
                <div className="absolute -left-2 top-4 w-0 h-0 border-t-4 border-t-transparent border-r-4 border-r-white border-b-4 border-b-transparent"></div>
                <p className="text-sm text-foreground mb-2">
                  <strong>Great job completing your basic profile!</strong> 🎉
                </p>
                <p className="text-sm text-foreground">
                  Want to stand out even more? Add additional photos and share some personal stories. These details will appear on the "other side" of your profile card and help create deeper connections!
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRobotPrompt(false)}
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">
                Extended Profile
              </div>
            </div>
            <div className="w-16" />
          </div>

          {/* Content Card */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Skip button at top */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  size="sm"
                >
                  Skip for Now
                </Button>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Add More to Your Story</h2>
                <p className="text-muted-foreground text-sm">
                  These details help others connect with you on a deeper level
                </p>
              </div>

              {/* Additional Photos Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Additional Photos</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add up to 4 more photos (these will appear on the flip side of your profile card)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {extendedData.additionalPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {extendedData.additionalPhotos.length < 4 && (
                      <div className="border-2 border-dashed border-muted rounded-lg h-24 flex items-center justify-center">
                        {/* Hidden file inputs */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="hidden"
                          id="additional-photo-upload"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="hidden"
                          id="camera-photo-upload"
                        />
                        
                        <Button
                          variant="ghost"
                          className="h-full w-full flex flex-col items-center gap-1"
                          disabled={uploading}
                          onClick={handleAddPhotoClick}
                        >
                          {uploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span className="text-xs">Add Photo</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Prompts Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Personal Stories & Questions</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose up to 3 prompts to answer and share your story
                  </p>
                </div>

                {/* Selected Prompts */}
                {extendedData.selectedPrompts.map((prompt, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium pr-2">{prompt.question}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrompt(index)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={prompt.answer}
                      onChange={(e) => updatePromptAnswer(index, e.target.value)}
                      placeholder="Share your story here..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {prompt.answer.length}/500 characters
                    </p>
                  </div>
                ))}

                {/* Available Prompts */}
                {extendedData.selectedPrompts.length < 3 && availablePromptsToShow.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Choose a prompt to answer:</p>
                    <Select onValueChange={(value) => addPrompt(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a question to answer..." />
                      </SelectTrigger>
                       <SelectContent className="max-h-60 bg-background border shadow-lg z-50">
                         {availablePromptsToShow.map((prompt, index) => (
                           <SelectItem 
                             key={index} 
                             value={prompt}
                             className="cursor-pointer hover:bg-accent min-h-12 p-3"
                           >
                             <span className="text-sm leading-relaxed whitespace-normal">
                               {prompt}
                             </span>
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={saveExtendedProfile} 
              disabled={loading || (extendedData.additionalPhotos.length === 0 && extendedData.selectedPrompts.length === 0)}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Extended Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Photo Choice Dialog */}
        <Dialog open={showPhotoChoiceDialog} onOpenChange={setShowPhotoChoiceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Photo</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center gap-2"
                onClick={handleCameraChoice}
              >
                <Camera className="w-8 h-8" />
                <span className="text-sm">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center gap-2"
                onClick={handleGalleryChoice}
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Camera Roll</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ExtendedProfileSetup;
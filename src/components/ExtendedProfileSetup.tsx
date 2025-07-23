import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, X, Upload, Camera, Plus } from "lucide-react";
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
];

const ExtendedProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRobotPrompt, setShowRobotPrompt] = useState(true);
  
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
    }
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
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="hidden"
                          id="additional-photo-upload"
                        />
                        <label htmlFor="additional-photo-upload">
                          <Button
                            variant="ghost"
                            className="h-full w-full flex flex-col items-center gap-1"
                            disabled={uploading}
                            asChild
                          >
                            <span>
                              {uploading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span className="text-xs">Add Photo</span>
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
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
                {extendedData.selectedPrompts.length < 3 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Choose from these prompts:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availablePromptsToShow.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => addPrompt(prompt)}
                          className="w-full text-left justify-start h-auto p-3 text-sm"
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
            >
              Skip for Now
            </Button>
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
      </div>
    </div>
  );
};

export default ExtendedProfileSetup;
import { useState } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  makePublic?: boolean;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFromCamera = async (
    photoDataUrl: string, 
    options: UploadOptions
  ): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert data URL to blob
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = options.fileName || `photo_${timestamp}.jpg`;
      const filePath = options.folder 
        ? `${options.folder}/${user.id}/${fileName}`
        : `${user.id}/${fileName}`;

      setUploadProgress(25);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true
        });

      setUploadProgress(75);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      setUploadProgress(100);

      // Get public URL if requested
      if (options.makePublic) {
        const { data: publicData } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(data.path);
        
        toast({
          title: "Upload Successful",
          description: "Photo uploaded successfully!",
        });
        
        return publicData.publicUrl;
      }

      toast({
        title: "Upload Successful",
        description: "File uploaded successfully!",
      });
      
      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = options.fileName || `file_${timestamp}.${fileExtension}`;
      const filePath = options.folder 
        ? `${options.folder}/${user.id}/${fileName}`
        : `${user.id}/${fileName}`;

      setUploadProgress(25);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      setUploadProgress(75);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      setUploadProgress(100);

      // Get public URL if requested
      if (options.makePublic) {
        const { data: publicData } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(data.path);
        
        toast({
          title: "Upload Successful",
          description: "File uploaded successfully!",
        });
        
        return publicData.publicUrl;
      }

      toast({
        title: "Upload Successful",
        description: "File uploaded successfully!",
      });
      
      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (bucket: string, filePath: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Delete Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Delete Successful",
        description: "File deleted successfully!",
      });
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  const saveToDevice = async (url: string, fileName: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // For web, trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      return true;
    }

    try {
      // For native platforms, use Filesystem
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents,
              encoding: Encoding.UTF8
            });
            
            toast({
              title: "Save Successful",
              description: "File saved to device!",
            });
            resolve(true);
          } catch (error) {
            console.error('Save error:', error);
            toast({
              title: "Save Failed",
              description: "Could not save file to device.",
              variant: "destructive",
            });
            resolve(false);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save file to device.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadFromCamera,
    uploadFile,
    deleteFile,
    saveToDevice
  };
};
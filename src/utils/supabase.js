import { createClient } from '@supabase/supabase-js';

// Supabase config - anon key is safe to expose (it's public by design)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ywidcejdgtbjyyannprl.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWRjZWpkZ3Rianl5YW5ucHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzE0ODgsImV4cCI6MjEwMTQ0NzQ4OH0.DzGbE4uWzgNHvDGLxHqHgF96qTDxrTkG9IpcIBciKDU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload image to Supabase Storage
export const uploadImage = async (file, fileName) => {
  const fileExt = fileName.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('outfits')
    .upload(uniqueName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('outfits')
    .getPublicUrl(uniqueName);

  return urlData.publicUrl;
};

// Delete image from Supabase Storage
export const deleteImage = async (imageUrl) => {
  // Extract filename from URL
  const urlParts = imageUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from('outfits')
    .remove([fileName]);

  if (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

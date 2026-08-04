import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload image to Supabase Storage
export const uploadImage = async (file, fileName) => {
  const fileExt = fileName.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
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

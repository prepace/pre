import { supabase } from './supabase';

const uploadImage = async (folderName, file) => {
  const fileName = `${folderName}/${file.name}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading image:', error.message);
    throw error; // Throw an error to catch it in the calling function
  }

  return fileName;
};

export { uploadImage };

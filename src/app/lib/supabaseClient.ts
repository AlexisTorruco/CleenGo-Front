import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función helper para subir imagen de perfil
export const uploadProfileImage = async (
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> => {
  try {
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { url: null, error: 'Solo se permiten archivos de imagen (JPG, PNG, WEBP, GIF)' };
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { url: null, error: 'La imagen no debe superar los 5MB' };
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage.from('profile-images').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Error uploading file:', error);
      return { url: null, error: 'Error al subir la imagen' };
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from('profile-images').getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    return { url: null, error: 'Error inesperado al subir la imagen' };
  }
};

// Función para eliminar imagen anterior
export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extraer el path del archivo de la URL
    const urlParts = imageUrl.split('/profile-images/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    await supabase.storage.from('profile-images').remove([`avatars/${filePath}`]);
  } catch (error) {
    console.error('Error deleting old image:', error);
  }
};

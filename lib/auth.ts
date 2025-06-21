// lib/auth.ts
import { supabase } from './supabase';

export const signUp = async (
  email: string, 
  password: string, 
  fullName: string, 
  whatsappNumber?: string
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          whatsapp_number: whatsappNumber,
        },
      },
    });

    if (error) throw error;

    // Jika user langsung confirmed (email confirmation disabled)
    if (data.user && !data.user.email_confirmed_at) {
      console.log('Please check your email for verification link');
      return { 
        ...data, 
        message: 'Please check your email for verification link' 
      };
    }

    // Jika user langsung confirmed, buat profile manual jika belum ada
    if (data.user && data.user.email_confirmed_at) {
      await ensureProfileExists(data.user.id, email, fullName, whatsappNumber);
      
      // Create default categories
      try {
        await supabase.rpc('create_default_categories', {
          user_uuid: data.user.id
        });
      } catch (categoriesError) {
        console.error('Error creating default categories:', categoriesError);
      }
    }

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    // Ensure profile exists after sign in
    if (data.user) {
      await ensureProfileExists(data.user.id, data.user.email || '', '', '');
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const updateProfile = async (updates: {
  full_name?: string;
  whatsapp_number?: string;
  avatar_url?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper function untuk memastikan profile ada
async function ensureProfileExists(
  userId: string, 
  email: string, 
  fullName: string, 
  whatsappNumber?: string
) {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          whatsapp_number: whatsappNumber || null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
  }
}
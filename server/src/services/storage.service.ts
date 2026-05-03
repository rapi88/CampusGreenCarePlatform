import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import crypto from 'crypto';

if (!config.supabase.url || !config.supabase.serviceKey) {
  console.warn('Supabase configuration is missing. Storage service will not work properly.');
}

const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceKey || 'placeholder'
);

export class StorageService {
  /**
   * Upload a file to a Supabase Storage bucket.
   * @param bucket The name of the bucket (e.g., 'avatars', 'trees', 'awards')
   * @param path The path/filename inside the bucket
   * @param fileBuffer The binary content of the file
   * @param mimetype The MIME type of the file
   * @returns The public URL of the uploaded file
   */
  static async uploadFile(
    bucket: string,
    path: string,
    fileBuffer: Buffer,
    mimetype: string
  ): Promise<string> {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Supabase configuration is missing. Cannot upload file.');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    // Append a timestamp to bypass cache if it was overwritten
    const timestamp = new Date().getTime();
    return `${publicUrlData.publicUrl}?t=${timestamp}`;
  }

  /**
   * Delete a file from a Supabase Storage bucket.
   */
  static async deleteFile(bucket: string, path: string): Promise<void> {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Supabase configuration is missing. Cannot delete file.');
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);
    
    if (error) {
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
  }

  /**
   * Generate a unique filename using UUID or random hex.
   */
  static generateFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || 'jpg';
    const uuid = crypto.randomUUID();
    return `${uuid}.${ext}`;
  }
}

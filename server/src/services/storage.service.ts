import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import crypto from 'crypto';

if (!config.supabase.url || !config.supabase.key) {
  console.warn('Supabase configuration is missing. Storage service will not work properly.');
} else if (!config.supabase.usesServiceRoleKey) {
  console.warn('Supabase Storage is using a publishable/anon key. Uploads require an insert policy on the target bucket; a service role key is recommended on the backend.');
}

const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.key || 'placeholder'
);

function normalizeStoragePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
}

export class StorageService {
  static async ensureBucket(bucket: string): Promise<void> {
    const { error: getError } = await supabase.storage.getBucket(bucket);
    if (!getError) return;

    if (!config.supabase.usesServiceRoleKey) return;

    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: config.upload.maxFileSize,
    });

    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      throw new Error(`Failed to create Supabase bucket "${bucket}": ${createError.message}`);
    }
  }

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
    if (!config.supabase.url || !config.supabase.key) {
      throw new Error('Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY in server/.env.');
    }

    const storagePath = normalizeStoragePath(path);

    await this.ensureBucket(bucket);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      const bucketHint = error.message.toLowerCase().includes('bucket not found')
        ? ` Create a Supabase Storage bucket with id "${bucket}" or set SUPABASE_TREES_BUCKET to your existing bucket id.`
        : '';
      const policyHint = config.supabase.usesServiceRoleKey
        ? ''
        : ' Backend is using a publishable/anon key; add SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY or create a Storage insert policy for this bucket.';
      throw new Error(`Failed to upload to Supabase bucket "${bucket}": ${error.message}.${bucketHint}${policyHint}`);
    }

    return this.getPublicUrl(bucket, storagePath);
  }

  /**
   * Delete a file from a Supabase Storage bucket.
   */
  static async deleteFile(bucket: string, path: string): Promise<void> {
    if (!config.supabase.url || !config.supabase.key) {
      throw new Error('Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY in server/.env.');
    }

    const { error } = await supabase.storage.from(bucket).remove([normalizeStoragePath(path)]);
    
    if (error) {
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
  }

  /**
   * Generate a unique filename using UUID or random hex.
   */
  static generateFilename(originalName: string): string {
    const ext = originalName.split('.').pop()?.split('?')[0] || 'jpg';
    const uuid = crypto.randomUUID();
    return `${uuid}.${ext}`;
  }

  static generateObjectPath(folder: string, ownerId: string, originalName: string): string {
    return normalizeStoragePath(`${folder}/${ownerId}/${this.generateFilename(originalName)}`);
  }

  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(normalizeStoragePath(path));

    return `${data.publicUrl}?t=${Date.now()}`;
  }

  static pathFromPublicUrl(bucket: string, publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);
      const marker = `/storage/v1/object/public/${bucket}/`;
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex === -1) return null;

      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  }
}

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Resolve the upload root relative to the process working directory.
// On SmarterASP this will be inside the deployed wwwroot folder.
// Locally it maps to server/public/uploads/.
const UPLOAD_BASE = path.resolve(process.cwd(), 'public', 'uploads');

export class StorageService {
  /**
   * Generate a UUID-based filename preserving the original extension.
   */
  static generateFilename(originalName: string): string {
    const ext = originalName.split('.').pop()?.split('?')[0] || 'jpg';
    return `${crypto.randomUUID()}.${ext}`;
  }

  /**
   * Generate a storage path: <folder>/<ownerId>/<uuid>.<ext>
   */
  static generateObjectPath(folder: string, ownerId: string, originalName: string): string {
    return `${folder}/${ownerId}/${this.generateFilename(originalName)}`;
  }

  /**
   * Save a file to disk and return its public URL path (relative).
   * The full URL is: <PUBLIC_API_URL> + <returned path>
   * e.g. /uploads/trees/abc123.jpg
   */
  static async uploadFile(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    _mimetype: string
  ): Promise<string> {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fullPath = path.join(UPLOAD_BASE, bucket, normalizedPath);

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, fileBuffer);

    return `/uploads/${bucket}/${normalizedPath}`;
  }

  /**
   * Delete a file from disk. Silently ignores missing files.
   */
  static async deleteFile(bucket: string, filePath: string): Promise<void> {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fullPath = path.join(UPLOAD_BASE, bucket, normalizedPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  /**
   * Return the public URL path for a stored file.
   */
  static getPublicUrl(bucket: string, filePath: string): string {
    return `/uploads/${bucket}/${filePath.replace(/\\/g, '/')}`;
  }

  /**
   * Extract the relative file path from a public URL.
   * Returns null if the URL does not match the expected pattern.
   */
  static pathFromPublicUrl(bucket: string, publicUrl: string): string | null {
    try {
      const marker = `/uploads/${bucket}/`;
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return publicUrl.slice(idx + marker.length).split('?')[0];
    } catch {
      return null;
    }
  }
}

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MediaService {
  private uploadDir = path.join(__dirname, '../../uploads');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  private ensureDirectories() {
    const dirs = ['images', 'audio', 'video', 'documents'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Download media from URL and save locally
   */
  async downloadMedia(url: string, type: string): Promise<{ path: string; filename: string; size: number }> {
    try {
      const typeDir = path.join(this.uploadDir, type);
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = this.getExtensionFromUrl(url);
      const filename = `${timestamp}_${random}${ext}`;
      const filepath = path.join(typeDir, filename);

      // Download file
      const response = await axios.get(url, { 
        responseType: 'stream',
        timeout: 30000 // 30 seconds timeout
      });

      // Save to disk
      const writer = fs.createWriteStream(filepath);
      await pipeline(response.data, writer);

      // Get file size
      const stats = fs.statSync(filepath);

      return {
        path: `/uploads/${type}/${filename}`,
        filename: filename,
        size: stats.size
      };
    } catch (error) {
      console.error('[MediaService] Download error:', error);
      throw new Error('Failed to download media');
    }
  }

  /**
   * Get file extension from URL
   */
  private getExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|mp3|ogg|aac|wav|pdf|doc|docx|xls|xlsx|txt|zip|rar)$/i);
      return match ? match[0] : '.bin';
    } catch {
      return '.bin';
    }
  }

  /**
   * Detect media type from MIME type
   */
  detectMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) {
      return 'document';
    }
    return 'document';
  }

  /**
   * Get directory for media type
   */
  getMediaDirectory(type: string): string {
    const typeMap: Record<string, string> = {
      'image': 'images',
      'audio': 'audio',
      'video': 'video',
      'document': 'documents',
      'voice': 'audio',
      'sticker': 'images'
    };
    return typeMap[type] || 'documents';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaPath: string): Promise<void> {
    try {
      const fullPath = path.join(__dirname, '../..', mediaPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('[MediaService] Delete error:', error);
    }
  }
}

export const mediaService = new MediaService();

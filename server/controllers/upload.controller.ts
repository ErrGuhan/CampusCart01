import { Request, Response } from 'express';
import { saveValidatedFile } from '../middleware/upload';

export class UploadController {
  /**
   * Handles cryptographically validated file upload
   */
  public static async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded or file was rejected during stream validation.',
        });
        return;
      }

      const folder = (req.body.folder as string) || 'listings';
      // Sanitize subfolder to prevent directory traversal
      const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

      // Persist memory buffer to storage
      const relativeUrl = saveValidatedFile(req.file, safeFolder);

      res.status(201).json({
        success: true,
        message: 'File uploaded and validated successfully.',
        data: {
          url: relativeUrl,
          mimeType: (req.file as any).verifiedMime,
          extension: (req.file as any).verifiedExtension,
          sizeBytes: req.file.size,
        },
      });
    } catch (err: any) {
      console.error('[Upload Controller] Upload Processing Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'File processing failed.',
      });
    }
  }
}

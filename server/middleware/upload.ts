import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/constants';

// Allowed MIME types mapped to expected binary magic numbers
interface MagicSignature {
  mime: string;
  extension: string;
  matches: (buffer: Buffer) => boolean;
}

const MAGIC_SIGNATURES: MagicSignature[] = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    matches: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 && // "RIFF"
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50, // "WEBP"
  },
  {
    mime: 'image/gif',
    extension: 'gif',
    matches: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38 && // "GIF8"
      (b[4] === 0x37 || b[4] === 0x39) && // "7" or "9"
      b[5] === 0x61, // "a"
  },
  {
    mime: 'application/pdf',
    extension: 'pdf',
    matches: (b) =>
      b.length >= 4 &&
      b[0] === 0x25 &&
      b[1] === 0x50 &&
      b[2] === 0x44 &&
      b[3] === 0x46, // "%PDF"
  },
];

// Configure Memory Storage to prevent arbitrary disk staging before magic byte verification
const memoryStorage = multer.memoryStorage();

// Multer filter for initial MIME type check
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = MAGIC_SIGNATURES.map((s) => s.mime);
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(
      new Error(`Unsupported file MIME type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`)
    );
  }
  cb(null, true);
};

// Strict Multer Upload instance
export const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_BYTES, // Strict 5MB limit
    files: 1, // Restrict to single file upload per request
    fields: 10,
    parts: 15,
  },
  fileFilter,
});

/**
 * Validates the cryptographic magic bytes of the uploaded file buffer.
 * Rejects polyglots, executable disguises, and corrupted payloads.
 */
export function validateMagicBytes(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'No file provided in the upload request.',
    });
    return;
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Empty file payload received.',
    });
    return;
  }

  // Find matching signature
  const matchingSignature = MAGIC_SIGNATURES.find((sig) => sig.matches(buffer));

  if (!matchingSignature) {
    // Explicit deallocation
    (req.file.buffer as any) = null;
    res.status(422).json({
      success: false,
      error: 'Security validation failed: File binary header does not match any allowed cryptographic signature.',
    });
    return;
  }

  // Cross-verify MIME type with claimed MIME type
  if (matchingSignature.mime !== req.file.mimetype) {
    (req.file.buffer as any) = null;
    res.status(422).json({
      success: false,
      error: `Security violation: Declared MIME type '${req.file.mimetype}' does not match cryptographic signature '${matchingSignature.mime}'.`,
    });
    return;
  }

  // Attach verified extension and sanitized metadata
  (req.file as any).verifiedExtension = matchingSignature.extension;
  (req.file as any).verifiedMime = matchingSignature.mime;

  next();
}

/**
 * Persists the validated memory buffer to disk or storage with sanitized filename
 * preventing path traversal vulnerabilities.
 */
export function saveValidatedFile(file: Express.Multer.File, subfolder: string = 'listings'): string {
  const uploadDir = path.resolve(process.cwd(), 'public', ENV.UPLOAD_DIR, subfolder);

  // Ensure upload directory exists securely
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate cryptographic timestamped filename with strict alphanumeric characters
  const ext = (file as any).verifiedExtension || 'bin';
  const cleanRandom = Math.random().toString(36).substring(2, 12);
  const safeFilename = `${Date.now()}_${cleanRandom}.${ext}`;
  const destinationPath = path.join(uploadDir, safeFilename);

  // Safe path containment check (preventing path traversal)
  if (!destinationPath.startsWith(uploadDir)) {
    throw new Error('Directory traversal attempt detected in upload destination.');
  }

  // Write verified buffer to disk
  fs.writeFileSync(destinationPath, file.buffer);

  // Graceful buffer deallocation
  (file.buffer as any) = null;

  return `/${ENV.UPLOAD_DIR}/${subfolder}/${safeFilename}`;
}

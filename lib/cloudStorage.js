import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

let useCloudinary = false;

// Initialize Cloudinary (called once)
// Matches Express backend behavior: Cloudinary only in production, local disk in development
const PLACEHOLDER_VALUES = ['your_cloud_name', 'your_api_key', 'your_api_secret', 'CHANGE_ME'];

const initStorage = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  const isValid = (val) => val && !PLACEHOLDER_VALUES.some(p => val.startsWith(p));

  console.log(`🔧 Storage init — NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   CLOUDINARY_CLOUD_NAME: ${cloudName ? 'SET' : 'NOT SET'}`);
  console.log(`   CLOUDINARY_API_KEY: ${apiKey ? 'SET' : 'NOT SET'}`);
  console.log(`   CLOUDINARY_API_SECRET: ${apiSecret ? 'SET' : 'NOT SET'}`);

  if (isProduction && isValid(cloudName) && isValid(apiKey) && isValid(apiSecret)) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    useCloudinary = true;
    console.log('✅ Cloudinary storage initialized (production)');
    return true;
  }

  if (!isProduction) {
    console.log('💾 Local development — using local file storage (uploads/)');
  } else {
    console.warn('⚠️  Production but Cloudinary credentials missing/invalid — falling back to local storage');
  }
  return false;
};

initStorage();

/**
 * Upload a file buffer to cloud (Cloudinary) or local disk.
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file
 * @param {string} folder - 'avatars' | 'certificates'
 * @returns {Promise<string>} URL or path of uploaded file
 */
export const uploadFile = async (file, folder = 'certificates') => {
  const { buffer, originalname, mimetype } = file;

  if (useCloudinary) {
    const fileExt = originalname.split('.').pop()?.toLowerCase();
    const sanitizedName = originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);

    const resourceType =
      fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx' ? 'raw' : 'auto';

    const publicId =
      resourceType === 'raw'
        ? `${Date.now()}-${sanitizedName}.${fileExt}`
        : `${Date.now()}-${sanitizedName}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `smart-student-hub/${folder}`,
          resource_type: resourceType,
          public_id: publicId,
          use_filename: false,
          unique_filename: false,
          access_mode: 'public',
          type: 'upload',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  } else {
    // Local storage fallback (dev) — write to public/uploads/ so Next.js serves it as static
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`💾 Saved locally: /uploads/${folder}/${filename}`);
    return `/uploads/${folder}/${filename}`;
  }
};

/**
 * Delete a file from Cloudinary (or ignore for local).
 * @param {string} fileUrl
 */
export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  if (useCloudinary && fileUrl.includes('res.cloudinary.com')) {
    try {
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex === -1) return;

      const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
      const publicId = publicIdWithVersion.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
      const resourceType = fileUrl.includes('/raw/') ? 'raw' : 'image';

      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  }
  // For local files, ignore deletion (not critical for dev)
};

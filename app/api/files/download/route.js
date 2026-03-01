export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const PLACEHOLDER_VALUES = ['your_cloud_name', 'your_api_key', 'your_api_secret'];
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const isValid = (v) => v && !PLACEHOLDER_VALUES.some((p) => v.startsWith(p));
  return isValid(name) && isValid(key) && isValid(secret);
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ message: 'File URL is required' }, { status: 400 });

    // ── Local file (dev) ────────────────────────────────────
    if (url.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), 'public', url);
      if (!fs.existsSync(localPath)) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
      }
      const buffer = fs.readFileSync(localPath);
      const filename = path.basename(url);
      const ext = path.extname(url).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // ── Cloudinary download ─────────────────────────────────
    if (!url.includes('res.cloudinary.com')) {
      return NextResponse.json({ message: 'Invalid file URL' }, { status: 403 });
    }

    // If Cloudinary creds not configured, just redirect to the raw URL
    if (!isCloudinaryConfigured()) {
      return NextResponse.redirect(url);
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return NextResponse.json({ message: 'Invalid Cloudinary URL format' }, { status: 400 });

    const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
    const resourceType = url.includes('/raw/') ? 'raw' : 'image';
    // For 'raw' resources (PDF, DOC, etc.), the file extension IS part of the public_id
    // and must NOT be stripped. For images, Cloudinary stores public_id without extension.
    const publicId = resourceType === 'raw'
      ? publicIdWithVersion.replace(/^v\d+\//, '')
      : publicIdWithVersion.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');

    const downloadUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      flags: 'attachment',
    });

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('Download error:', error.message);
    return NextResponse.json({ message: 'Failed to generate download URL', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { uploadFile, deleteFile } from '@/lib/cloudStorage';

export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const formData = await request.formData();
    const avatarFile = formData.get('avatar');

    if (!avatarFile || typeof avatarFile !== 'object') {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = /jpeg|jpg|png/;
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedTypes.test(ext)) {
      return NextResponse.json({ message: 'Only JPEG and PNG images are allowed' }, { status: 400 });
    }

    if (avatarFile.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be under 2MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const profilePictureUrl = await uploadFile({ buffer, originalname: avatarFile.name, mimetype: avatarFile.type }, 'avatars');

    const { User } = await initDB();
    const user = await User.findByPk(auth.user.id);

    if (user.profilePicture) {
      try { await deleteFile(user.profilePicture); } catch {}
    }

    await user.update({ profilePicture: profilePictureUrl });

    return NextResponse.json({ message: 'Profile picture updated', profilePicture: profilePictureUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

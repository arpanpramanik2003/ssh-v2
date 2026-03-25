export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudStorage';

// GET /api/students/profile
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { User } = await initDB();
    const user = await User.findByPk(auth.user.id, {
      attributes: [
        'id', 'name', 'email', 'department', 'programCategory', 'program', 'specialization', 'year', 'studentId',
        'profilePicture', 'tenthResult', 'twelfthResult', 'address',
        'languages', 'skills', 'otherDetails',
        'phone', 'dateOfBirth', 'gender', 'category', 'hobbies',
        'achievements', 'projects', 'certifications',
        'linkedinUrl', 'githubUrl', 'portfolioUrl',
        'createdAt', 'updatedAt',
      ],
    });

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, profile: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch profile', error: error.message }, { status: 500 });
  }
}

// PUT /api/students/profile
export async function PUT(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { User } = await initDB();
    const user = await User.findByPk(auth.user.id);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const allowedFields = [
      'tenthResult', 'twelfthResult', 'address', 'languages', 'skills',
      'otherDetails', 'phone', 'dateOfBirth', 'gender', 'category',
      'hobbies', 'achievements', 'projects', 'certifications',
      'linkedinUrl', 'githubUrl', 'portfolioUrl',
    ];

    const updateData = {};
    let profilePictureFile = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const field of allowedFields) {
        const val = formData.get(field);
        if (val !== null) updateData[field] = val === '' ? null : val;
      }
      profilePictureFile = formData.get('profilePicture');
    } else {
      const body = await request.json();
      for (const field of allowedFields) {
        if (body[field] !== undefined) updateData[field] = body[field] === '' ? null : body[field];
      }
    }

    // Handle profile picture upload
    if (profilePictureFile && typeof profilePictureFile === 'object') {
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      const fileObj = { buffer, originalname: profilePictureFile.name, mimetype: profilePictureFile.type };
      updateData.profilePicture = await uploadFile(fileObj, 'avatars');
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(auth.user.id, {
      attributes: [
        'id', 'name', 'email', 'department', 'programCategory', 'program', 'specialization', 'year', 'studentId',
        'profilePicture', 'tenthResult', 'twelfthResult', 'address',
        'languages', 'skills', 'otherDetails',
        'phone', 'dateOfBirth', 'gender', 'category', 'hobbies',
        'achievements', 'projects', 'certifications',
        'linkedinUrl', 'githubUrl', 'portfolioUrl', 'updatedAt',
      ],
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully', profile: updatedUser.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update profile', error: error.message }, { status: 500 });
  }
}

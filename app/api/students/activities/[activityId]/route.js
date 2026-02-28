export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { uploadFile, deleteFile } from '@/lib/cloudStorage';

// PUT /api/students/activities/[activityId]
export async function PUT(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { activityId } = params;
    const contentType = request.headers.get('content-type') || '';

    let title, type, description, date, duration, organizer;
    let certificateFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title');
      type = formData.get('type');
      description = formData.get('description');
      date = formData.get('date');
      duration = formData.get('duration');
      organizer = formData.get('organizer');
      certificateFile = formData.get('certificate');
    } else {
      const body = await request.json();
      ({ title, type, description, date, duration, organizer } = body);
    }

    const { Activity } = await initDB();
    const activity = await Activity.findByPk(activityId);

    if (!activity) return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
    if (activity.studentId !== auth.user.id) return NextResponse.json({ message: 'Unauthorized to update this activity' }, { status: 403 });
    if (activity.status !== 'pending') return NextResponse.json({ message: 'Cannot update activity that has been reviewed' }, { status: 400 });

    let filePath = activity.filePath;
    if (certificateFile && typeof certificateFile === 'object') {
      if (activity.filePath) {
        try { await deleteFile(activity.filePath); } catch {}
      }
      const buffer = Buffer.from(await certificateFile.arrayBuffer());
      filePath = await uploadFile({ buffer, originalname: certificateFile.name, mimetype: certificateFile.type }, 'certificates');
    }

    await activity.update({ title, type, description, date: new Date(date), duration, organizer, filePath });

    return NextResponse.json({ message: 'Activity updated successfully', activity });
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/students/activities/[activityId]
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { activityId } = params;
    const { Activity } = await initDB();
    const activity = await Activity.findByPk(activityId);

    if (!activity) return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
    if (activity.studentId !== auth.user.id) return NextResponse.json({ message: 'Unauthorized to delete this activity' }, { status: 403 });
    if (activity.status !== 'pending') return NextResponse.json({ message: 'Cannot delete activity that has been reviewed' }, { status: 400 });

    if (activity.filePath) {
      try { await deleteFile(activity.filePath); } catch {}
    }

    await activity.destroy();
    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

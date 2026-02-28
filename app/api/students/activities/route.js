export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';
import { authenticateAndAuthorize } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudStorage';

// GET /api/students/activities
export async function GET(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { Activity, User } = await initDB();

    const where = { studentId: auth.user.id };
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [{ model: User, as: 'approver', attributes: ['name', 'email'], required: false }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      activities: rows,
      pagination: {
        total: count, page, pages: Math.ceil(count / limit),
        hasMore: offset + rows.length < count,
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/students/activities
export async function POST(request) {
  try {
    const auth = await authenticateAndAuthorize(request, ['student', 'admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const contentType = request.headers.get('content-type') || '';
    let title, type, description, date, duration, organizer, credits;
    let certificateFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title');
      type = formData.get('type');
      description = formData.get('description');
      date = formData.get('date');
      duration = formData.get('duration');
      organizer = formData.get('organizer');
      credits = formData.get('credits');
      certificateFile = formData.get('certificate');
    } else {
      const body = await request.json();
      ({ title, type, description, date, duration, organizer, credits } = body);
    }

    if (!title || !type || !date) {
      return NextResponse.json({ message: 'Validation error', details: 'title, type, and date are required' }, { status: 400 });
    }

    const validTypes = ['conference', 'workshop', 'certification', 'competition', 'internship', 'leadership', 'community_service', 'club_activity', 'online_course'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ message: 'Validation error', details: 'Invalid activity type' }, { status: 400 });
    }

    let fileUrl = null;
    if (certificateFile && typeof certificateFile === 'object') {
      const buffer = Buffer.from(await certificateFile.arrayBuffer());
      fileUrl = await uploadFile({ buffer, originalname: certificateFile.name, mimetype: certificateFile.type }, 'certificates');
    }

    const { Activity } = await initDB();
    const activity = await Activity.create({
      title,
      type,
      description: description || null,
      date: new Date(date),
      duration: duration || null,
      organizer: organizer || null,
      credits: credits ? parseFloat(credits) : 0,
      studentId: auth.user.id,
      filePath: fileUrl,
    });

    return NextResponse.json({
      message: 'Activity submitted successfully',
      activity: {
        id: activity.id, title: activity.title, type: activity.type,
        date: activity.date, status: activity.status, credits: activity.credits,
        filePath: activity.filePath,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Submit activity error:', error);
    return NextResponse.json({ message: 'Internal server error', details: error.message }, { status: 500 });
  }
}

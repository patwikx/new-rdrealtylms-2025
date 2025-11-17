import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { minioClient, DOCUMENTS_BUCKET } from '@/lib/minio';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName } = await params;

    if (!fileName) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }

    const decodedFileName = decodeURIComponent(fileName);

    // Verify the file belongs to the user OR user is ADMIN/HR (security check)
    const isOwnFile = decodedFileName.startsWith(`profile-pictures/${session.user.id}/`);
    const canAccessOtherFiles = session.user.role === 'ADMIN' || session.user.role === 'HR';
    
    if (!isOwnFile && !canAccessOtherFiles) {
      return NextResponse.json({ error: 'Unauthorized to access this file' }, { status: 403 });
    }

    // Generate a presigned URL for the file (valid for 1 hour)
    const presignedUrl = await minioClient.presignedGetObject(
      DOCUMENTS_BUCKET,
      decodedFileName,
      60 * 60 // 1 hour
    );

    return NextResponse.json({
      success: true,
      fileUrl: presignedUrl,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate URL' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'File parameter required' }, { status: 400 });
    }
    
    // Security: only allow specific files
    const allowedFiles = [
      'SIKDAHU_SOURCE_CODE.zip',
    ];
    
    if (!allowedFiles.includes(file)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }
    
    const filePath = path.join(process.cwd(), file);
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}

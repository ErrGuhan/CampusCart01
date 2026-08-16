import { NextResponse } from 'next/server';
import { getRequests, createRequest } from '@/lib/collaboration-hub';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') || 'ALL';
    const requests = await getRequests(tag);
    return NextResponse.json({ success: true, count: requests.length, data: requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.description || !body.authorId) {
      return NextResponse.json(
        { success: false, error: 'authorId, title, and description are required.' },
        { status: 400 }
      );
    }
    const newReq = await createRequest(body);
    return NextResponse.json({ success: true, data: newReq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

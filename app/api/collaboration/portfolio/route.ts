import { NextResponse } from 'next/server';
import { getUserPortfolio } from '@/lib/collaboration-hub';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default_user';
    const portfolio = await getUserPortfolio(userId);
    return NextResponse.json({ success: true, data: portfolio });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

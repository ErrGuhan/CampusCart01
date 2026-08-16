import { NextResponse } from 'next/server';
import { getBounties, createBounty, claimBounty, completeBounty } from '@/lib/collaboration-hub';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as any) || 'ALL';
    const bounties = await getBounties(status);
    return NextResponse.json({ success: true, count: bounties.length, data: bounties });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.description || !body.creatorId) {
      return NextResponse.json(
        { success: false, error: 'creatorId, title, and description are required.' },
        { status: 400 }
      );
    }
    const newBounty = await createBounty(body);
    return NextResponse.json({ success: true, data: newBounty }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, bountyId, userId, userName, userAvatar, solverId } = body;

    if (!bountyId || !action) {
      return NextResponse.json(
        { success: false, error: 'bountyId and action (claim|complete) are required.' },
        { status: 400 }
      );
    }

    if (action === 'claim') {
      if (!userId || !userName) {
        return NextResponse.json(
          { success: false, error: 'userId and userName are required to claim a bounty.' },
          { status: 400 }
        );
      }
      const updated = await claimBounty(bountyId, userId, userName, userAvatar);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'complete') {
      const updated = await completeBounty(bountyId, solverId);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

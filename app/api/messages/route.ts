import { NextResponse } from 'next/server';
import { getConversations, getMessages, sendChatMessage } from '@/lib/firebase-queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const messages = await getMessages(conversationId);
      return NextResponse.json({ success: true, data: messages });
    }

    if (userId) {
      const conversations = await getConversations(userId);
      return NextResponse.json({ success: true, data: conversations });
    }

    return NextResponse.json({ success: false, error: 'userId or conversationId is required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, senderId, senderName, senderAvatar, recipientId, text } = body;

    if (!conversationId || !senderId || !text) {
      return NextResponse.json(
        { success: false, error: 'conversationId, senderId, and text are required.' },
        { status: 400 }
      );
    }

    const newMsg = await sendChatMessage({
      conversationId,
      senderId,
      senderName: senderName || 'Campus Student',
      senderAvatar: senderAvatar || '',
      recipientId: recipientId || '',
      text: text.trim(),
    });

    return NextResponse.json({ success: true, data: newMsg }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

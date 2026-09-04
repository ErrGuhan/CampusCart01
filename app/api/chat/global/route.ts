import { NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendChatMessage, getMessages } from '@/lib/firebase-queries';

const GLOBAL_HUB_ID = 'campus_global_hub';

// Default starter messages if Firestore is completely fresh
const DEFAULT_GLOBAL_MESSAGES = [
  {
    id: 'global_init_1',
    chatType: 'GLOBAL',
    conversationId: GLOBAL_HUB_ID,
    senderId: 'svcet_admin',
    senderName: 'CampusCart Team',
    senderAvatar: '',
    content: '🎉 Welcome to the SVCET Campus Hub! Connect with peers, share requests, or announce campus projects.',
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'global_init_2',
    chatType: 'GLOBAL',
    conversationId: GLOBAL_HUB_ID,
    senderId: 'svcet_safety',
    senderName: 'Student Safety Bot',
    senderAvatar: '',
    content: '🛡️ Reminder: Always inspect physical items in public campus areas (Central Library, Canteen, or Main Quad). Happy trading!',
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

/**
 * GET /api/chat/global
 * Fetches recent messages from Firestore chats/campus_global_hub/messages
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);

    const msgsRef = collection(db, 'chats', GLOBAL_HUB_ID, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'), limit(limitParam));

    let messages: any[] = [];
    try {
      const snap = await getDocs(q);
      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          messages.push({
            id: docSnap.id,
            chatType: 'GLOBAL',
            conversationId: GLOBAL_HUB_ID,
            senderId: d.senderId,
            senderName: d.senderName || 'Campus Student',
            senderAvatar: d.senderAvatar || '',
            content: d.text || d.content || '',
            productContext: d.productContext || null,
            status: 'DELIVERED',
            createdAt: d.createdAt || new Date().toISOString(),
          });
        });
      }
    } catch (fsErr) {
      console.warn('Firestore global chat fetch warning:', fsErr);
    }

    // If Firestore has no global messages yet, use default welcoming messages
    if (messages.length === 0) {
      messages = DEFAULT_GLOBAL_MESSAGES;
    }

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch global chat history',
        messages: DEFAULT_GLOBAL_MESSAGES,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/global
 * Saves a new message to the global hub in Firestore
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, senderName, senderAvatar, content, productContext } = body;

    if (!senderId || !content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'senderId and content are required' },
        { status: 400 }
      );
    }

    const messageId = `global_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();
    const cleanContent = content.trim();

    const newMsg = {
      id: messageId,
      chatType: 'GLOBAL',
      conversationId: GLOBAL_HUB_ID,
      senderId,
      senderName: senderName || 'Campus Student',
      senderAvatar: senderAvatar || '',
      content: cleanContent,
      text: cleanContent,
      productContext: productContext || null,
      status: 'DELIVERED',
      createdAt,
    };

    // 1. Write to Firestore subcollection
    try {
      await setDoc(doc(db, 'chats', GLOBAL_HUB_ID, 'messages', messageId), {
        senderId,
        senderName: newMsg.senderName,
        senderAvatar: newMsg.senderAvatar,
        recipientId: 'global',
        text: cleanContent,
        content: cleanContent,
        productContext: newMsg.productContext,
        createdAt,
      });

      // Update parent hub doc
      await setDoc(
        doc(db, 'chats', GLOBAL_HUB_ID),
        {
          id: GLOBAL_HUB_ID,
          lastMessage: cleanContent,
          lastMessageTimestamp: createdAt,
          updatedAt: createdAt,
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Firestore write notice in /api/chat/global:', fsErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: newMsg,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save global message' },
      { status: 500 }
    );
  }
}

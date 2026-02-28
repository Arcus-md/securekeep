/**
 * Notes API Routes
 * All note data is stored encrypted - the server never sees plaintext content
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notes - Get all notes for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const notes = await db.note.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
    
    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const { userId, title, content, color, isPinned, images, labels } = await request.json();
    
    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: 'User ID and title are required' },
        { status: 400 }
      );
    }
    
    // Create note with images
    const note = await db.note.create({
      data: {
        userId,
        title,
        content: content || null,
        color: color || null,
        isPinned: isPinned || false,
        images: images && images.length > 0 ? {
          create: images.map((img: { data: string; mimeType: string; order: number }) => ({
            data: img.data,
            mimeType: img.mimeType,
            order: img.order,
          })),
        } : undefined,
        labels: labels && labels.length > 0 ? {
          create: labels.map((labelId: string) => ({
            labelId,
          })),
        } : undefined,
      },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

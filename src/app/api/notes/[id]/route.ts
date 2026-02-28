/**
 * Single Note API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notes/[id] - Get a single note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const note = await db.note.findUnique({
      where: { id },
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
    
    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Update note
    const note = await db.note.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        color: data.color,
        isPinned: data.isPinned,
        isArchived: data.isArchived,
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
    
    // Update images if provided
    if (data.images !== undefined) {
      // Delete existing images
      await db.image.deleteMany({
        where: { noteId: id },
      });
      
      // Create new images
      if (data.images.length > 0) {
        await db.image.createMany({
          data: data.images.map((img: { data: string; mimeType: string; order: number }) => ({
            noteId: id,
            data: img.data,
            mimeType: img.mimeType,
            order: img.order,
          })),
        });
      }
    }
    
    // Update labels if provided
    if (data.labels !== undefined) {
      // Delete existing labels
      await db.noteLabel.deleteMany({
        where: { noteId: id },
      });
      
      // Add new labels
      if (data.labels.length > 0) {
        await db.noteLabel.createMany({
          data: data.labels.map((labelId: string) => ({
            noteId: id,
            labelId,
          })),
        });
      }
    }
    
    // Fetch the updated note with relations
    const updatedNote = await db.note.findUnique({
      where: { id },
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
      note: updatedNote,
    });
  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a note (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete
    await db.note.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

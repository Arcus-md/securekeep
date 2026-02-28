/**
 * Labels API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/labels - Get all labels for a user
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
    
    const labels = await db.label.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      labels,
    });
  } catch (error) {
    console.error('Get labels error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/labels - Create a new label
export async function POST(request: NextRequest) {
  try {
    const { userId, name, color } = await request.json();
    
    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'User ID and name are required' },
        { status: 400 }
      );
    }
    
    const label = await db.label.create({
      data: {
        userId,
        name,
        color: color || null,
      },
    });
    
    return NextResponse.json({
      success: true,
      label,
    });
  } catch (error) {
    console.error('Create label error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

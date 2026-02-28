/**
 * Authentication API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSalt, hashPassword } from '@/lib/server-crypto';

export const runtime = 'edge';
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Generate salts
    const keySalt = generateSalt();
    const passwordHash = await hashPassword(password + keySalt);
    
    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        passwordHash,
        keySalt,
      },
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        keySalt: user.keySalt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

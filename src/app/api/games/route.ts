import { NextResponse } from 'next/server';
import { getAllGames } from '../../../lib/redis';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await getAllGames();
    return new NextResponse(
      JSON.stringify({ games }),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error listing games:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error listing games' }),
      { status: 500 }
    );
  }
} 
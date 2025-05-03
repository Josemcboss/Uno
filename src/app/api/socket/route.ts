import { NextResponse } from 'next/server';
import type { GameState } from '../../../types/game';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return new NextResponse(
    JSON.stringify({ message: 'WebSocket server running' }),
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const data = await req.json();
  
  // Aquí implementaremos la lógica del juego
  return new NextResponse(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
} 
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'frontend',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

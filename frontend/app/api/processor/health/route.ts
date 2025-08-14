import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://processor:8001/health', {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Processor responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching processor health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processor health', status: 'unhealthy' },
      { status: 500 }
    );
  }
}

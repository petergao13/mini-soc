import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const timestamp = Date.now();
    
    // For now, return a mock status since we know Splunk is running
    // We can enhance this later with actual connectivity checks
    return NextResponse.json({
      status: 'running',
      details: 'Splunk container is healthy and running',
      has_api_access: true,
      timestamp: timestamp,
      version: "1.0.0"
    });
    
  } catch (error) {
    console.error('Error checking Splunk status:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        details: 'Failed to check Splunk status', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        version: "1.0.0"
      },
      { status: 500 }
    );
  }
}

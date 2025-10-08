import { NextRequest, NextResponse } from 'next/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '../../../../convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const { query, args } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query name is required' },
        { status: 400 }
      );
    }

    // Map query names to actual API functions
    const queryMap: Record<string, any> = {
      'otp:getOTPStats': api.otp.getOTPStats,
      'otp:isAdminEmail': api.otp.isAdminEmail,
      'otp:validateAdminSession': api.otp.validateAdminSession,
      'otp:getAdminEmails': api.otp.getAdminEmails,
    };

    const queryFunction = queryMap[query];
    if (!queryFunction) {
      return NextResponse.json(
        { error: 'Unknown query function' },
        { status: 400 }
      );
    }

    const result = await fetchQuery(queryFunction, args || {});

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in convex query API:', error);

    // Handle Convex errors
    if (error.data?.code) {
      return NextResponse.json(
        { error: error.data.message, code: error.data.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
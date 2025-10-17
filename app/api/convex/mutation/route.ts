import { NextRequest, NextResponse } from 'next/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../../../convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const { mutation, args } = await request.json();

    if (!mutation) {
      return NextResponse.json(
        { error: 'Mutation name is required' },
        { status: 400 }
      );
    }

    // Map mutation names to actual API functions
    const mutationMap: Record<string, any> = {
      'auth:storeAdminOTP': api.authFunctions.storeAdminOTP,
      'auth:verifyAdminOTP': api.authFunctions.verifyAdminOTP,
      'auth:createAdminSession': api.authFunctions.createAdminSession,
      'auth:updateSessionAccess': api.authFunctions.updateSessionAccess,
      'auth:revokeSession': api.authFunctions.revokeSession,
      'auth:cleanupExpiredOTPs': api.authFunctions.cleanupExpiredOTPs,
      'auth:cleanupExpiredSessions': api.authFunctions.cleanupExpiredSessions,
    };

    const mutationFunction = mutationMap[mutation];
    if (!mutationFunction) {
      return NextResponse.json(
        { error: 'Unknown mutation function' },
        { status: 400 }
      );
    }

    const result = await fetchMutation(mutationFunction, args || {});

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in convex mutation API:', error);

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
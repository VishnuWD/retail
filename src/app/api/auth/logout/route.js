import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ 
    success: true, 
    data: { message: 'Logged out successfully.' } 
  });
  
  response.cookies.set('token', '', { maxAge: 0 });
  return response;
}

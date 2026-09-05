import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Security validation: only allow HTTP/HTTPS links
    if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
      return new Response('Invalid URL protocol', { status: 400 });
    }

    console.log(`[Image Proxy] Fetching and streaming image: ${decodedUrl}`);

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return new Response('Failed to retrieve target image from external source.', { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    return new Response(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, must-revalidate',
        'Access-Control-Allow-Origin': '*' // Allow CORS access locally
      }
    });
  } catch (error) {
    console.error('[Image Proxy] Error streaming image:', error);
    return new Response('Internal proxy error.', { status: 500 });
  }
}

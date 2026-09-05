import { NextResponse } from 'next/server';
import { ImageSearchProvider } from '@/lib/integrations/product-data/ImageSearchProvider';

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const body = await request.json();
    const query = (body.query || '').trim();
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Search query is required.' } },
        { status: 400 }
      );
    }
    
    const imageSearch = new ImageSearchProvider();
    const results = await imageSearch.searchImages(query, businessId);
    
    // Map to the shape expected by the frontend
    const formattedResults = results.map(r => {
      const proxiedUrl = `/api/images/proxy?url=${encodeURIComponent(r.url)}`;
      return {
        title: r.title || query,
        thumbnailUrl: r.thumb || proxiedUrl,
        imageUrl: r.url, // Full-resolution original image
        proxiedUrl: proxiedUrl,
        sourceUrl: r.url,
        sourceName: r.source || 'Bing Packaging Engine'
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        results: formattedResults
      }
    });
  } catch (error) {
    console.error('Image search route error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process image search.' } },
      { status: 500 }
    );
  }
}

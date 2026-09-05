async function testScrape() {
  const query = 'amul butter';
  try {
    // Step 1: Get vqd token from main DuckDuckGo page
    const indexUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    console.log('Fetching main page to extract VQD:', indexUrl);
    const indexResponse = await fetch(indexUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!indexResponse.ok) {
      console.error('Failed to load DuckDuckGo index page:', indexResponse.status);
      return;
    }

    const html = await indexResponse.text();
    
    // Extract vqd value using regex
    const vqdMatch = html.match(/vqd=["']([^"']+)["']/i);
    if (!vqdMatch) {
      console.error('VQD token not found in page HTML.');
      return;
    }

    const vqd = vqdMatch[1];
    console.log('Extracted VQD Token:', vqd);

    // Step 2: Query the image JSON API with vqd token
    const imgUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,`;
    console.log('Querying images endpoint:', imgUrl);
    const imgResponse = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/'
      }
    });

    if (!imgResponse.ok) {
      console.error('Images request failed with status:', imgResponse.status);
      return;
    }

    const data = await imgResponse.json();
    const results = (data.results || []).map(r => ({
      url: r.image,
      thumbnailUrl: r.thumbnail,
      title: r.title
    }));

    console.log(`Extracted ${results.length} results:`);
    console.log(JSON.stringify(results.slice(0, 6), null, 2));

  } catch (error) {
    console.error('DuckDuckGo Scrape error:', error);
  }
}
testScrape();

// Define the types for the gold price data
interface GoldPriceItem {
  id: string;
  dir: string;
  title: string;
  changepercent: string;
  maxprice: string;
  minprice: string;
  buyprice: string;
  recycleprice: string;
  date: string;
}

interface GoldPriceResponse {
  code: number;
  msg: string;
  time: string;
  price: string;
  data: GoldPriceItem[];
}

export default {
  async fetch(request, _env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/goldprice') {
      const cache = caches.default;
      const cacheKey = new Request(request.url, request);
      
      // Check if we have cached data
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      try {
        // Call the external gold price API
        const apiResponse = await fetch('https://api.pearktrue.cn/api/goldprice/');
        
        if (!apiResponse.ok) {
          throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json() as GoldPriceResponse;
        
        // Format the response to include only necessary fields
        const formattedResponse = {
          code: data.code,
          msg: data.msg,
          time: data.time,
          price: data.price,
          data: data.data.map((item: GoldPriceItem) => ({
            id: item.id,
            dir: item.dir,
            title: item.title,
            changepercent: item.changepercent,
            maxprice: item.maxprice,
            minprice: item.minprice,
            buyprice: item.buyprice,
            recycleprice: item.recycleprice,
            date: item.date
          }))
        };
        
        // Create a response to cache
        const response = new Response(JSON.stringify(formattedResponse), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          }
        });
        
        // Cache the response
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        
        return response;
      } catch (error) {
        console.error('Error fetching gold price:', error);
        return new Response(JSON.stringify({
          code: 500,
          msg: 'Failed to fetch gold price',
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;

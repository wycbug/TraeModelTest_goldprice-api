

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
        // Call the external gold price API with retry mechanism
        let apiResponse;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            apiResponse = await fetch('https://api.pearktrue.cn/api/goldprice/', {
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            break;
          } catch (fetchError) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw fetchError;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
        
        if (!apiResponse || !apiResponse.ok) {
          throw new Error(`HTTP error! status: ${apiResponse?.status || 'unknown'}`);
        }
        
        const data = await apiResponse.json() as any;
        
        // Validate response data
        if (!data || data.code !== 200 || !data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid API response format');
        }
        
        // Format the response to include only necessary fields
        const formattedResponse = {
          code: data.code,
          msg: data.msg,
          time: data.time,
          price: data.price,
          data: (data.data || []).map((item: any) => ({
            id: item.id,
            dir: item.dir,
            title: item.title,
            changepercent: item.changepercent,
            maxprice: Number(item.maxprice),
            minprice: Number(item.minprice),
            buyprice: Number(item.buyprice),
            recycleprice: Number(item.recycleprice),
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
        
        // Try to return stale cached data if available
        try {
          const staleResponse = await cache.match(cacheKey);
          if (staleResponse) {
            const staleData = await staleResponse.json() as any;
            return new Response(JSON.stringify({
              code: staleData.code,
              msg: '显示缓存数据 (API暂时不可用)',
              time: staleData.time,
              price: staleData.price,
              data: staleData.data,
              stale: true
            }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Warning': '110 - Response is stale'
              }
            });
          }
        } catch (cacheError) {
          console.error('Error accessing cache:', cacheError);
        }
        
        return new Response(JSON.stringify({
          code: 500,
          msg: 'Failed to fetch gold price',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true
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

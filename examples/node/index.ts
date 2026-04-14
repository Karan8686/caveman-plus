/**
 * Node.js Integration Example
 * 
 * Demonstrates how to use compress() in a Node.js app
 * to post-process AI responses before returning them to users.
 */

import { compress, getCompressionStats } from 'caveman-plus';

// Simulated AI response (verbose)
const aiResponse = `I think that the reason why you're basically seeing this error is actually because the function is not properly handling the case where the input is undefined. In order to fix this issue, you should really make sure that you check for null or undefined before you attempt to access any properties on the object. It's also important to note that you might want to consider using optional chaining as well, which is a really useful feature that can help you avoid these kinds of errors in the future.`;

// Post-process AI response before sending to user
function postProcessAIResponse(response: string): {
  compressed: string;
  savings: number;
} {
  const compressed = compress(response, {
    mode: 'full',
    preserveErrors: true,
    preserveLogs: true,
  });
  
  const stats = getCompressionStats(response, compressed);
  
  return {
    compressed,
    savings: stats.reductionPercent,
  };
}

// Express.js middleware example
function compressionMiddleware(req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  
  res.json = function (body: any) {
    if (body.response && typeof body.response === 'string') {
      const { compressed } = postProcessAIResponse(body.response);
      body.response = compressed;
      body.compressed = true;
    }
    return originalJson(body);
  };
  
  next();
}

// Usage example
console.log('=== Node.js Integration Example ===\n');

console.log('Original AI Response:');
console.log(aiResponse);
console.log(`\nLength: ${aiResponse.length} chars`);

const { compressed, savings } = postProcessAIResponse(aiResponse);

console.log('\n--- After Compression ---\n');
console.log('Compressed Response:');
console.log(compressed);
console.log(`\nLength: ${compressed.length} chars`);
console.log(`\n✅ Saved ${savings}% tokens!`);

// Example with Express (commented out - requires express package)
/*
import express from 'express';
const app = express();

app.use(compressionMiddleware);

app.post('/api/chat', async (req, res) => {
  const aiResponse = await generateAIResponse(req.body.message);
  // Middleware automatically compresses the response
  res.json({ response: aiResponse });
});

app.listen(3000, () => console.log('Server running on port 3000'));
*/

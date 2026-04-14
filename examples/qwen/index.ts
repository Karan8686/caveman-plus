/**
 * Qwen Integration Example
 * 
 * Demonstrates how to use Caveman's getPrompt() to inject
 * compression instructions into Qwen's system prompt.
 */

import { getPrompt, compress } from 'caveman-plus';

// Example 1: Generate compression system prompt
function createQwenSystemPrompt(): string {
  // Get the full compression prompt for Qwen
  const compressionPrompt = getPrompt({
    mode: 'full',
    domain: 'technical',
    customInstructions: [
      '- Preserve code examples exactly as written',
      '- Keep technical terminology intact',
    ],
  });

  return `You are a helpful technical assistant. ${compressionPrompt}`;
}

// Example 2: Post-process Qwen's response
function compressQwenResponse(response: string): string {
  return compress(response, {
    mode: 'context',      // Context-aware compression
    preserveErrors: true, // Keep error messages intact
    preserveLogs: true,   // Preserve log structure
  });
}

// Example 3: Full integration flow
async function qwenWithCompression(userQuery: string): Promise<{
  originalTokens: number;
  compressedTokens: number;
  savings: number;
}> {
  // Step 1: Build system prompt with compression instructions
  const systemPrompt = createQwenSystemPrompt();
  
  console.log('=== System Prompt ===');
  console.log(systemPrompt.slice(0, 200) + '...\n');
  
  // Step 2: Call Qwen (simulated)
  const simulatedResponse = `I think that the reason why this error is basically occurring is actually because the function is not properly handling the undefined value that is being passed to it. In order to fix this issue, you should really make sure that you check for null or undefined before attempting to access properties on the object.`;
  
  console.log('=== Original Response ===');
  console.log(simulatedResponse);
  console.log(`\nToken estimate: ~${Math.ceil(simulatedResponse.length / 4)}\n`);
  
  // Step 3: Compress the response
  const compressed = compressQwenResponse(simulatedResponse);
  
  console.log('=== Compressed Response ===');
  console.log(compressed);
  console.log(`\nToken estimate: ~${Math.ceil(compressed.length / 4)}\n`);
  
  // Step 4: Calculate savings
  const originalTokens = Math.ceil(simulatedResponse.length / 4);
  const compressedTokens = Math.ceil(compressed.length / 4);
  const savings = Math.round((1 - compressedTokens / originalTokens) * 100);
  
  console.log(`=== Compression Stats ===`);
  console.log(`Tokens saved: ${originalTokens} → ${compressedTokens} (${savings}% reduction)`);
  
  return { originalTokens, compressedTokens, savings };
}

// Run the example
console.log('=== Qwen Integration Example ===\n');

qwenWithCompression('Why am I getting an undefined error?')
  .then(({ savings }) => {
    console.log(`\n✅ Successfully integrated with Qwen! Saved ${savings}% tokens.`);
  })
  .catch(console.error);

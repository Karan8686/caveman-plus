/**
 * Streaming Example
 * 
 * Demonstrates how to use compressStream() for chunk-by-chunk
 * processing of streaming AI responses.
 */

import { compressStream, finalizeStream, StreamState } from 'caveman-plus';

// Simulates a streaming AI response (chunk by chunk)
async function* simulateStreamingResponse(): AsyncGenerator<string> {
  const chunks = [
    'I think that the',
    ' reason why this error',
    ' is basically occurring',
    ' is because the function',
    ' is not properly handling',
    ' the undefined value.\n\n',
    'In order to fix this,',
    ' you should really check',
    ' for null before accessing',
    ' properties on the object.',
  ];
  
  for (const chunk of chunks) {
    yield chunk;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function streamCompressionExample(): Promise<void> {
  console.log('=== Streaming Compression Example ===\n');
  
  let state: StreamState | undefined;
  let fullOriginal = '';
  let fullCompressed = '';
  
  console.log('Streaming (compressed in real-time):\n');
  
  // Process streaming response chunk by chunk
  for await (const chunk of simulateStreamingResponse()) {
    fullOriginal += chunk;
    
    // Compress this chunk
    const { output, state: newState } = compressStream(chunk, state, 'full');
    state = newState;
    
    // Output compressed text (may be empty if buffering)
    if (output) {
      process.stdout.write(output);
      fullCompressed += output;
    }
  }
  
  // Flush any remaining buffered text
  const final = finalizeStream(state!, 'full');
  if (final) {
    process.stdout.write(final);
    fullCompressed += final;
  }
  
  console.log('\n\n--- Compression Stats ---');
  console.log(`Original: ${fullOriginal.length} chars`);
  console.log(`Compressed: ${fullCompressed.length} chars`);
  const savings = Math.round((1 - fullCompressed.length / fullOriginal.length) * 100);
  console.log(`Saved: ${savings}%`);
}

// Run the example
streamCompressionExample().catch(console.error);

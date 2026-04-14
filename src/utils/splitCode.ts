export interface CodeSegment {
  type: 'code';
  content: string;
}

export interface TextSegment {
  type: 'text';
  content: string;
}

export type Segment = CodeSegment | TextSegment;

/**
 * Splits markdown text into code blocks and normal text segments.
 * Preserves code blocks exactly as they appear without modification.
 * 
 * @param text - The markdown text to split
 * @returns Array of segments with type 'code' or 'text'
 */
export function splitCodeBlocks(text: string): Segment[] {
  if (!text) return [];

  const segments: Segment[] = [];
  const codeBlockRegex = /```([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text segment before code block if there's any content
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      segments.push({ type: 'text', content: textContent });
    }

    // Add code block segment (preserving exact content)
    segments.push({ type: 'code', content: match[0] });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    segments.push({ type: 'text', content: remainingText });
  }

  return segments;
}

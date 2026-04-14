/**
 * Markdown structure preservation types and utilities.
 * Identifies and preserves markdown formatting elements
 * while allowing compression of textual content.
 */

export interface MarkdownSegment {
  /**
   * Type of markdown segment
   */
  type: 'heading' | 'list-item' | 'table-row' | 'blockquote' | 'thematic-break' | 'text';
  /**
   * The full segment content including markdown markers
   */
  content: string;
  /**
   * The compressible text content (without markdown markers)
   */
  text?: string;
  /**
   * The markdown markers/prefixes to preserve
   */
  prefix?: string;
}

/**
 * Parses markdown text into segments that separate structure from content.
 * Preserves headings, lists, tables, blockquotes, and thematic breaks.
 *
 * @param text - The markdown text to parse
 * @returns Array of segments with compressible text separated from structure
 */
export function parseMarkdown(text: string): MarkdownSegment[] {
  if (!text) return [];

  const segments: MarkdownSegment[] = [];
  const lines = text.split('\n');
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      segments.push({
        type: 'text',
        content: currentParagraph.join('\n'),
      });
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const segment = parseLine(line);

    // If it's a structural element, flush any accumulated paragraph first
    if (segment.type !== 'text') {
      flushParagraph();
      segments.push(segment);
    } else {
      // Accumulate text lines into paragraphs
      currentParagraph.push(line);
    }
  }

  // Flush remaining paragraph
  flushParagraph();

  return segments;
}

/**
 * Recompresses markdown segments back into a single string.
 *
 * @param segments - Array of markdown segments
 * @returns Recomposed markdown text
 */
export function recompressMarkdown(segments: MarkdownSegment[]): string {
  return segments
    .map((segment) => {
      if (segment.type === 'thematic-break') {
        return segment.content;
      }
      if (segment.type === 'text') {
        return segment.content;
      }
      if (segment.prefix && segment.text !== undefined) {
        return segment.prefix + segment.text;
      }
      return segment.content;
    })
    .join('\n');
}

/**
 * Compresses textual content within markdown while preserving structure.
 * Applies a compression function only to the text parts, keeping markdown markers intact.
 *
 * @param text - The markdown text to compress
 * @param compressor - Function to apply to compressible text content
 * @returns Compressed markdown with preserved structure
 */
export function compressMarkdown(
  text: string,
  compressor: (content: string) => string
): string {
  const segments = parseMarkdown(text);

  const compressed = segments.map((segment) => {
    // Don't compress structural elements
    if (segment.type === 'thematic-break') {
      return segment;
    }

    // For text segments, apply the compressor directly to the content
    if (segment.type === 'text') {
      return { ...segment, content: compressor(segment.content) };
    }

    // For structured elements (headings, lists, etc.), compress the text part
    if (segment.text !== undefined) {
      const compressedText = compressor(segment.text);
      return { ...segment, text: compressedText };
    }

    return segment;
  });

  return recompressMarkdown(compressed);
}

/**
 * Parses a single line of markdown into a segment.
 * Detects headings, lists, tables, blockquotes, and thematic breaks.
 */
function parseLine(line: string): MarkdownSegment {
  // Thematic breaks: ---, ***, ___
  if (/^(\s*-{3,}\s*)$/.test(line) || /^(\s*\*{3,}\s*)$/.test(line) || /^(\s*_{3,}\s*)$/.test(line)) {
    return { type: 'thematic-break', content: line };
  }

  // Headings: # Heading, ## Heading, etc.
  const headingMatch = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    return {
      type: 'heading',
      content: line,
      prefix: headingMatch[1] + headingMatch[2] + ' ',
      text: headingMatch[3],
    };
  }

  // Blockquotes: > text
  const blockquoteMatch = line.match(/^(\s*>+\s*)(.+)$/);
  if (blockquoteMatch) {
    return {
      type: 'blockquote',
      content: line,
      prefix: blockquoteMatch[1],
      text: blockquoteMatch[2],
    };
  }

  // List items: - item, * item, + item, 1. item
  const listMatch = line.match(/^(\s*)([*\-+]|\d+\.)\s+(.+)$/);
  if (listMatch) {
    return {
      type: 'list-item',
      content: line,
      prefix: listMatch[1] + listMatch[2] + ' ',
      text: listMatch[3],
    };
  }

  // Table rows: | col1 | col2 |
  const tableMatch = line.match(/^(\s*\|.+\|)$/);
  if (tableMatch) {
    // Parse table row to compress cell contents
    return parseTableRow(line);
  }

  // Plain text
  return { type: 'text', content: line };
}

/**
 * Parses a table row and makes cell contents compressible.
 */
function parseTableRow(line: string): MarkdownSegment {
  // Don't compress separator rows (|---|---|)
  if (/^\s*\|[\s\-:|]+\|\s*$/.test(line)) {
    return { type: 'table-row', content: line };
  }

  // Extract cells and make them compressible
  const cells = line.split('|').slice(1, -1);
  const compressedCells = cells.map((cell) => ' ' + cell.trim() + ' ');

  return {
    type: 'table-row',
    content: line,
    prefix: '|',
    text: compressedCells.join('|') + '|',
  };
}

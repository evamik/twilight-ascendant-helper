/**
 * Extract the load code from character data content
 */
export function extractLoadCode(content: string): string | null {
  // Find the line with "-l " followed by the code
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/call Preload\(\s*"(-l\s+[^"]+)"\s*\)/);
    if (match) {
      // Extract just the code part after "-l "
      const fullCode = match[1];
      const code = fullCode.replace(/^-l\s+/, "");
      return code.trim();
    }
  }
  return null;
}

/**
 * Split a long string into chunks of max length
 */
export function splitIntoChunks(str: string, maxLength: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += maxLength) {
    chunks.push(str.substring(i, i + maxLength));
  }
  return chunks;
}

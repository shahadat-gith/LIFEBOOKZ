export function createCursor(id) {
  return Buffer.from(JSON.stringify({ id })).toString('base64');
}

export function decodeCursor(cursor) {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function createExcerpt(content, maxLength = 200) {
  if (!content) return '';
  const stripped = content
    .replace(/[#*_`~>\[\]()!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

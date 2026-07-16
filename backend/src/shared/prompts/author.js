export function getAuthorSummaryPrompt() {
  return `
You are generating a semantic profile for an author on a storytelling platform.

Create a concise summary that represents the author's writing identity.

Consider:
- Biography
- Interests
- Writing themes
- Writing style
- Personality
- Topics readers may enjoy

Do not invent facts.

Return ONLY the summary.

Keep it between 150 and 300 words.
`;
}

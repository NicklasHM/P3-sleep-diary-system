/**
 * Sanitizer funktioner til at forhindre XSS angreb
 */

/**
 * Escaper HTML special characters for at forhindre XSS
 */
export const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Sanitizer user input ved at fjerne potentielt farlige HTML tags
 * Bevarer kun simple tekst
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  // Fjern HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  sanitized = escapeHtml(sanitized);
  
  return sanitized.trim();
};

/**
 * Sanitizer tekst der skal vises i React (bruger dangerouslySetInnerHTML ikke)
 * Dette er den sikreste metode - React escaper automatisk
 */
export const sanitizeForDisplay = (text: string | null | undefined): string => {
  if (!text) return '';
  // React escaper automatisk, så vi skal bare trimme
  return text.trim();
};





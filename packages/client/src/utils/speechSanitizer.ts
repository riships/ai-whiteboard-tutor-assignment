/**
 * Sanitizes markdown and LaTeX formulas into fluent, natural English
 * for browser Text-to-Speech (Web Speech API).
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';

  let speech = text;

  // 1. Math formulas conversions
  // Big-O notations
  speech = speech.replace(/\$?O\(\\log\s*n\)\$?/gi, 'Big O of log n');
  speech = speech.replace(/\$?O\(n\s*\\log\s*n\)\$?/gi, 'Big O of n log n');
  speech = speech.replace(/\$?O\(n\^2\)\$?/gi, 'Big O of n squared');
  speech = speech.replace(/\$?O\(1\)\$?/gi, 'Big O of one');
  speech = speech.replace(/\$?O\(n\)\$?/gi, 'Big O of n');
  speech = speech.replace(/\$?O\(([a-zA-Z0-9_+*\s]+)\)\$?/gi, 'Big O of $1');

  // Common math symbols
  speech = speech.replace(/\$?a\^2\s*\+\s*b\^2\s*=\s*c\^2\$?/gi, 'a squared plus b squared equals c squared');
  speech = speech.replace(/\b([a-zA-Z0-9])\^2\b/g, '$1 squared');
  speech = speech.replace(/\b([a-zA-Z0-9])\^3\b/g, '$1 cubed');
  speech = speech.replace(/\b([a-zA-Z0-9])\^([0-9]+)\b/g, '$1 to the power of $2');

  // Invariants and inequalities
  speech = speech.replace(/<=|\\le/g, ' is less than or equal to ');
  speech = speech.replace(/>=|\\ge/g, ' is greater than or equal to ');
  speech = speech.replace(/<|\\lt/g, ' is less than ');
  speech = speech.replace(/>|\\gt/g, ' is greater than ');
  speech = speech.replace(/!=|\\neq/g, ' does not equal ');
  speech = speech.replace(/=/g, ' equals ');

  // LaTeX Greek and operators
  speech = speech.replace(/\\Delta/g, 'delta');
  speech = speech.replace(/\\theta/g, 'theta');
  speech = speech.replace(/\\nabla/g, 'gradient');
  speech = speech.replace(/\\times/g, ' times ');
  speech = speech.replace(/\\cdot/g, ' times ');
  speech = speech.replace(/\\text\{([^}]+)\}/g, '$1');
  speech = speech.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2');

  // Remove remaining math dollar delimiters
  speech = speech.replace(/\$\$([^\$]+)\$\$/g, '$1');
  speech = speech.replace(/\$([^\$]+)\$/g, '$1');

  // 2. Markdown formatting cleanup
  speech = speech.replace(/```[\s\S]*?```/g, ''); // code blocks
  speech = speech.replace(/`([^`]+)`/g, '$1'); // inline code
  speech = speech.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1'); // bold / italic
  speech = speech.replace(/#{1,6}\s+/g, ''); // headings
  speech = speech.replace(/^\s*[-*+]\s+/gm, ''); // list bullets
  speech = speech.replace(/^\s*\d+\.\s+/gm, ''); // numbered lists

  // 3. Spacing and punctuation normalization
  speech = speech.replace(/[\r\n]+/g, '. '); // newlines into clean speech pauses
  speech = speech.replace(/\s+/g, ' '); // collapse whitespace
  speech = speech.replace(/\.{2,}/g, '.'); // collapse multi dots
  speech = speech.trim();

  return speech;
}

import rateLimit from 'express-rate-limit';

/**
 * IP-based rate limiter to protect Gemini API quota on public demo deployments.
 * Permits up to 10 lesson generations per IP per hour.
 */
export const lessonRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Rate limit exceeded',
    message:
      'You have reached the maximum of 10 AI lesson generations per hour on this public demo. You can continue exploring using the built-in interactive preset lessons!',
    isRateLimited: true,
  },
});

/**
 * IP-based rate limiter for Socratic Q&A follow-ups.
 * Permits up to 20 questions per IP per hour.
 */
export const qaRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 questions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded',
    message:
      'You have reached the maximum of 20 Q&A follow-up questions per hour on this public demo. Please continue the lesson or replay the visual demonstration!',
    isRateLimited: true,
  },
});


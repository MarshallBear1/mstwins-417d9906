/**
 * Frontend Security Utilities
 * These complement the database-level security validations
 */

// Input sanitization function
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Remove HTML tags for basic XSS prevention
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

// Text input validation
export const validateTextInput = (
  input: string, 
  fieldName: string, 
  maxLength: number = 1000, 
  required: boolean = false
): { isValid: boolean; error?: string; sanitized: string } => {
  const sanitized = sanitizeInput(input, maxLength);
  
  if (required && !sanitized) {
    return { isValid: false, error: `${fieldName} is required`, sanitized };
  }
  
  if (sanitized.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be ${maxLength} characters or less`, 
      sanitized 
    };
  }
  
  return { isValid: true, sanitized };
};

// Age validation (must be 18+)
export const validateAge = (dateOfBirth: Date): { isValid: boolean; error?: string } => {
  if (!dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required' };
  }
  
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    // Birthday hasn't occurred this year yet
    if (age - 1 < 18) {
      return { isValid: false, error: 'You must be at least 18 years old' };
    }
  } else if (age < 18) {
    return { isValid: false, error: 'You must be at least 18 years old' };
  }
  
  return { isValid: true };
};

// Rate limiting helper (client-side feedback)
export const checkRateLimit = (
  userId: string, 
  action: 'like' | 'message', 
  timeWindow: number = 3600000 // 1 hour in milliseconds
): { allowed: boolean; remaining: number; resetTime: number } => {
  const key = `rateLimit_${action}_${userId}`;
  const now = Date.now();
  
  // Get stored data
  const stored = localStorage.getItem(key);
  let data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + timeWindow };
  
  // Reset if time window has passed
  if (now >= data.resetTime) {
    data = { count: 0, resetTime: now + timeWindow };
  }
  
  // Check limits (matching database limits)
  const maxActions = action === 'like' ? 50 : 100;
  const allowed = data.count < maxActions;
  
  if (allowed) {
    data.count++;
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  return {
    allowed,
    remaining: Math.max(0, maxActions - data.count),
    resetTime: data.resetTime
  };
};

// OpenAI Moderation API Integration
export const checkWithOpenAIModerator = async (content: string): Promise<{ flagged: boolean; categories: string[]; reason?: string }> => {
  try {
    // Check if OpenAI API key is available (from environment or Supabase Edge Function)
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    
    // Call Supabase Edge Function that handles OpenAI moderation
    const { data, error } = await supabase.functions.invoke('moderate-content', {
      body: { content }
    });
    
    if (error) {
      console.warn('OpenAI moderation check failed:', error);
      return { flagged: false, categories: [] };
    }
    
    return data || { flagged: false, categories: [] };
  } catch (error) {
    console.warn('OpenAI moderation unavailable:', error);
    return { flagged: false, categories: [] };
  }
};

// Enhanced content filtering with scam detection
export const filterContent = async (content: string): Promise<{ 
  filtered: string; 
  flagged: boolean; 
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}> => {
  let filtered = content;
  let flagged = false;
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  // Scam detection patterns
  const scamPatterns = [
    { pattern: /\b(?:cash.?app|venmo|paypal|zelle)\b/gi, reason: 'Payment app mention', severity: 'high' as const },
    { pattern: /\b(?:send.?money|wire.?transfer|bitcoin|crypto)\b/gi, reason: 'Money request', severity: 'high' as const },
    { pattern: /\b(?:instagram|snapchat|telegram|whatsapp|kik)\b/gi, reason: 'External platform redirect', severity: 'medium' as const },
    { pattern: /\b(?:lonely|horny|sexy|hookup)\b/gi, reason: 'Inappropriate content', severity: 'medium' as const },
    { pattern: /\b(?:inheritance|lottery|prince|million.?dollars)\b/gi, reason: 'Classic scam keywords', severity: 'high' as const },
  ];
  
  // URL/Link detection
  const urlPatterns = [
    { pattern: /https?:\/\/[^\s]+/gi, reason: 'External link', severity: 'medium' as const },
    { pattern: /www\.[^\s]+/gi, reason: 'Website mention', severity: 'medium' as const },
    { pattern: /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, reason: 'Domain mention', severity: 'low' as const },
  ];
  
  // Technical/XSS patterns (existing)
  const securityPatterns = [
    { pattern: /\b(?:script|javascript|vbscript)\b/gi, reason: 'Script injection attempt', severity: 'high' as const },
    { pattern: /on\w+\s*=/gi, reason: 'Event handler injection', severity: 'high' as const },
    { pattern: /\bdata:(?:text\/html|application\/)/gi, reason: 'Data URI injection', severity: 'high' as const },
    { pattern: /\bjavascript:/gi, reason: 'JavaScript protocol', severity: 'high' as const },
  ];
  
  // Check all patterns
  const allPatterns = [...scamPatterns, ...urlPatterns, ...securityPatterns];
  
  for (const { pattern, reason, severity: patternSeverity } of allPatterns) {
    if (pattern.test(filtered)) {
      flagged = true;
      reasons.push(reason);
      
      // Update severity to highest found
      if (patternSeverity === 'high' || (patternSeverity === 'medium' && severity === 'low')) {
        severity = patternSeverity;
      }
      
      // Filter out the content based on severity
      if (patternSeverity === 'high') {
        filtered = filtered.replace(pattern, '[BLOCKED]');
      } else if (patternSeverity === 'medium') {
        filtered = filtered.replace(pattern, '[FLAGGED]');
      }
    }
  }
  
  // If content passed basic filters, check with OpenAI
  if (!flagged || severity === 'low') {
    try {
      const aiResult = await checkWithOpenAIModerator(content);
      if (aiResult.flagged) {
        flagged = true;
        reasons.push(`AI detected: ${aiResult.categories.join(', ')}`);
        severity = 'high';
        filtered = '[CONTENT BLOCKED BY AI MODERATION]';
      }
    } catch (error) {
      // Continue without AI moderation if it fails
      console.warn('AI moderation check failed:', error);
    }
  }
  
  return { filtered, flagged, reasons, severity };
};

// Image content moderation (for profile photos)
export const moderateImage = async (imageUrl: string): Promise<{ approved: boolean; reason?: string }> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    
    // Call Supabase Edge Function for image moderation
    const { data, error } = await supabase.functions.invoke('moderate-image', {
      body: { imageUrl }
    });
    
    if (error) {
      console.warn('Image moderation failed:', error);
      return { approved: true }; // Allow by default if moderation fails
    }
    
    return data || { approved: true };
  } catch (error) {
    console.warn('Image moderation unavailable:', error);
    return { approved: true };
  }
};

// Report suspicious content for admin review
// TODO: Enable after creating content_reports table
/*
export const reportSuspiciousContent = async (
  contentId: string,
  contentType: 'message' | 'profile' | 'photo',
  userId: string,
  reason: string,
  details?: string
): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    
    const { error } = await supabase
      .from('content_reports')
      .insert({
        content_id: contentId,
        content_type: contentType,
        reported_user_id: userId,
        reason,
        details: details || null,
        status: 'pending'
      });
    
    return !error;
  } catch (error) {
    console.error('Failed to report suspicious content:', error);
    return false;
  }
};
*/

// Secure error message handling (avoid leaking sensitive info)
export const sanitizeErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  // If it's a string, return it directly (but limit length)
  if (typeof error === 'string') {
    return error.length > 200 ? error.substring(0, 200) + '...' : error;
  }
  
  // If it has a message property, use that
  if (error.message) {
    const message = error.message.toString();
    return message.length > 200 ? message.substring(0, 200) + '...' : message;
  }
  
  // For database errors, provide user-friendly messages
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return 'This action has already been completed';
      case '23503': // Foreign key violation
        return 'Unable to complete action due to data constraints';
      case '42501': // Insufficient privilege
        return 'You do not have permission to perform this action';
      default:
        return 'A database error occurred. Please try again.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Enhanced password validation with server-side checks
export const validatePasswordStrength = async (password: string): Promise<{ isValid: boolean; errors: string[] }> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    const { data, error } = await supabase.rpc('validate_password_strength', { password_input: password });
    
    if (error) {
      console.error('Password validation error:', error);
      return { isValid: false, errors: ['Unable to validate password strength'] };
    }
    
    // Type assertion for the database response
    const result = data as { valid: boolean; errors: string[] };
    return { isValid: result.valid, errors: result.errors || [] };
  } catch (error) {
    console.error('Password validation failed:', error);
    return { isValid: false, errors: ['Unable to validate password strength'] };
  }
};

// Check login rate limiting
export const checkLoginRateLimit = async (email: string): Promise<{ allowed: boolean; reason?: string; attemptsRemaining?: number }> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    const { data, error } = await supabase.rpc('check_login_rate_limit', { email_input: email });
    
    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Allow on error to prevent lockout
    }
    
    // Type assertion for the database response
    const result = data as { allowed: boolean; reason?: string; attempts_remaining?: number };
    return { 
      allowed: result.allowed, 
      reason: result.reason, 
      attemptsRemaining: result.attempts_remaining 
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true }; // Allow on error to prevent lockout
  }
};

// Log failed login attempt
export const logFailedLogin = async (email: string): Promise<void> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    await supabase.rpc('log_failed_login_attempt', { 
      email_input: email,
      user_agent_input: navigator.userAgent 
    });
  } catch (error) {
    console.error('Failed to log failed login:', error);
  }
};

// Clear failed login attempts on successful login
export const clearFailedLogins = async (email: string): Promise<void> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    await supabase.rpc('clear_failed_login_attempts', { email_input: email });
  } catch (error) {
    console.error('Failed to clear failed logins:', error);
  }
};

// Security headers helper
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.posthog.com https://api.openai.com;"
  };
};

// API versioning helper
export const getApiVersion = async (): Promise<string> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client').catch(() => {
      throw new Error('Failed to import Supabase client');
    });
    const { data, error } = await supabase.rpc('get_api_version');
    
    if (error) {
      console.error('API version check error:', error);
      return '1'; // Default version
    }
    
    return data || '1';
  } catch (error) {
    console.error('API version check failed:', error);
    return '1'; // Default version
  }
};

// Validation schema for profile data
export const validateProfileData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate required fields
  const firstNameValidation = validateTextInput(data.firstName, 'First name', 50, true);
  if (!firstNameValidation.isValid) {
    errors.push(firstNameValidation.error!);
  }
  
  const lastNameValidation = validateTextInput(data.lastName, 'Last name', 50, true);
  if (!lastNameValidation.isValid) {
    errors.push(lastNameValidation.error!);
  }
  
  const locationValidation = validateTextInput(data.location, 'Location', 100, true);
  if (!locationValidation.isValid) {
    errors.push(locationValidation.error!);
  }
  
  // Validate gender (required)
  if (!data.gender) {
    errors.push('Gender is required');
  } else if (!['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'].includes(data.gender)) {
    errors.push('Invalid gender selection');
  }
  
  // Validate optional fields with length limits
  if (data.aboutMe) {
    const aboutMeValidation = validateTextInput(data.aboutMe, 'About me', 1000, false);
    if (!aboutMeValidation.isValid) {
      errors.push(aboutMeValidation.error!);
    }
  }
  
  if (data.msSubtype) {
    const msSubtypeValidation = validateTextInput(data.msSubtype, 'MS subtype', 50, false);
    if (!msSubtypeValidation.isValid) {
      errors.push(msSubtypeValidation.error!);
    }
  }
  
  // Validate age if date of birth is provided
  if (data.dateOfBirth) {
    const ageValidation = validateAge(new Date(data.dateOfBirth));
    if (!ageValidation.isValid) {
      errors.push(ageValidation.error!);
    }
  }
  
  // Validate diagnosis year
  if (data.diagnosisYear) {
    const year = parseInt(data.diagnosisYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1950 || year > currentYear) {
      errors.push('Invalid diagnosis year');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
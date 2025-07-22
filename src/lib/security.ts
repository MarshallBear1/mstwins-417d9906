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

// Content filtering for potentially harmful patterns
export const filterContent = (content: string): { filtered: string; flagged: boolean } => {
  let filtered = content;
  let flagged = false;
  
  // List of patterns that might be concerning (basic implementation)
  const suspiciousPatterns = [
    /\b(?:script|javascript|vbscript)\b/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /\bdata:(?:text\/html|application\/)/gi,
    /\bjavascript:/gi,
  ];
  
  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filtered)) {
      flagged = true;
      filtered = filtered.replace(pattern, '[FILTERED]');
    }
  }
  
  return { filtered, flagged };
};

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
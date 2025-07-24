import React, { useState, useEffect } from 'react';
import { validatePasswordStrength } from '@/lib/security';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange: (isValid: boolean, errors: string[]) => void;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  onValidationChange
}) => {
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkPasswordStrength = async () => {
      if (!password) {
        setIsValid(false);
        setErrors([]);
        onValidationChange(false, []);
        return;
      }

      setIsChecking(true);
      
      try {
        const validation = await validatePasswordStrength(password);
        setIsValid(validation.isValid);
        setErrors(validation.errors);
        onValidationChange(validation.isValid, validation.errors);
      } catch (error) {
        console.error('Password validation error:', error);
        setIsValid(false);
        setErrors(['Unable to validate password']);
        onValidationChange(false, ['Unable to validate password']);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkPasswordStrength, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [password, onValidationChange]);

  const getStrengthScore = () => {
    if (!password) return 0;
    if (isValid) return 100;
    
    // Basic scoring based on criteria met
    let score = 0;
    if (password.length >= 8) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    return Math.min(score, isValid ? 100 : 80);
  };

  const getStrengthColor = () => {
    const score = getStrengthScore();
    if (score < 40) return 'bg-destructive';
    if (score < 70) return 'bg-yellow-500';
    if (score < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    const score = getStrengthScore();
    if (score < 40) return 'Weak';
    if (score < 70) return 'Fair';
    if (score < 100) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${
          isValid ? 'text-green-600' : 
          getStrengthScore() > 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {isChecking ? 'Checking...' : getStrengthText()}
        </span>
      </div>
      
      <Progress 
        value={getStrengthScore()} 
        className="h-2"
      />
      
      {errors.length > 0 && (
        <ul className="text-sm text-destructive space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start">
              <span className="text-destructive mr-1">•</span>
              {error}
            </li>
          ))}
        </ul>
      )}
      
      {isValid && (
        <p className="text-sm text-green-600 flex items-center">
          <span className="mr-1">✓</span>
          Password meets all security requirements
        </p>
      )}
    </div>
  );
};
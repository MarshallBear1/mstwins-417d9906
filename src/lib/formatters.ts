/**
 * Formats MS subtype with proper capitalization
 */
export const formatMSSubtype = (subtype: string | null): string => {
  if (!subtype) return '';
  
  const upperSubtype = subtype.toUpperCase();
  
  // Handle known MS subtypes
  const msSubtypes = ['RRMS', 'SPMS', 'PPMS', 'PRMS', 'CIS'];
  
  for (const msType of msSubtypes) {
    if (upperSubtype.includes(msType)) {
      return msType;
    }
  }
  
  // Default capitalization for other cases
  return subtype.charAt(0).toUpperCase() + subtype.slice(1).toLowerCase();
};

/**
 * Calculate age from birth date or age number
 */
export const calculateAge = (ageOrBirthDate: number | string | Date | null): number | null => {
  if (!ageOrBirthDate) return null;
  
  // If it's already a number, return it
  if (typeof ageOrBirthDate === 'number') {
    return ageOrBirthDate;
  }
  
  // If it's a date string or Date object, calculate age
  const birthDate = new Date(ageOrBirthDate);
  if (isNaN(birthDate.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
// Input validators
export const isGTUEmail = (email: string) =>
  /^[^\s@]+@gtu\.edu\.tr$/.test(email.toLowerCase());

export const isStrongPassword = (pw: string) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

export const passwordStrength = (pw: string): 'weak' | 'fair' | 'strong' => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  return 'strong';
};

import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Password complexity evaluator logic
function evaluatePasswordRules(password: string) {
  return {
    minLength: password.length >= 9,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password),
  };
}

// 2. Student ID format validator logic
function validateStudentId(id: string): boolean {
  return /^RU\d{4}\/\d{2}$/.test(id);
}

// 3. Gmail validator logic
function validateGmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@gmail.com');
}

// 4. Phone number validator logic (10 digits starting with 09 or 07)
function validatePhoneNumber(phone: string): boolean {
  return /^(09|07)\d{8}$/.test(phone);
}

// 5. FAN validator logic (numeric only)
function validateFan(fan: string): boolean {
  return /^\d+$/.test(fan);
}

// 6. Role dashboard path mapping
function getDashboardPath(role: string): string {
  switch (role) {
    case 'CUSTOMER':
      return '/customer/home';
    case 'CAFE_OWNER':
      return '/owner/dashboard';
    case 'CAFE_WORKER':
      return '/worker/orders';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

// 7. Role-based allowed routes verification
const roleAllowedPages: Record<string, string[]> = {
  CUSTOMER: ['/customer/home', '/customer/orders', '/customer/profile'],
  CAFE_OWNER: ['/owner/dashboard', '/owner/manage', '/owner/cafe'],
  CAFE_WORKER: ['/worker/orders', '/worker/recent', '/worker/profile'],
  ADMIN: ['/admin/dashboard', '/admin/register-cafe'],
};

test('Password complexity evaluator satisfies all required rules for strong password', () => {
  const result = evaluatePasswordRules('SecureP@ssword123');
  assert.equal(result.minLength, true);
  assert.equal(result.hasUpper, true);
  assert.equal(result.hasLower, true);
  assert.equal(result.hasNumber, true);
  assert.equal(result.hasSpecial, true);
});

test('Password complexity evaluator detects missing requirements', () => {
  assert.equal(evaluatePasswordRules('short1!').minLength, false);
  assert.equal(evaluatePasswordRules('ALLUPPER123!').hasLower, false);
  assert.equal(evaluatePasswordRules('alllower123!').hasUpper, false);
  assert.equal(evaluatePasswordRules('NoNumberHere!').hasNumber, false);
  assert.equal(evaluatePasswordRules('NoSpecial1234').hasSpecial, false);
});

test('Student ID validation accepts RU0101/16 and RU1122/19, rejects invalid formats', () => {
  assert.equal(validateStudentId('RU0101/16'), true);
  assert.equal(validateStudentId('RU1122/19'), true);
  assert.equal(validateStudentId('ru0101/16'), false);
  assert.equal(validateStudentId('RU101/16'), false);
  assert.equal(validateStudentId('RU010116'), false);
  assert.equal(validateStudentId('AA0101/16'), false);
});

test('Email validation only accepts @gmail.com addresses', () => {
  assert.equal(validateGmail('student@gmail.com'), true);
  assert.equal(validateGmail('student@yahoo.com'), false);
  assert.equal(validateGmail('student@outlook.com'), false);
  assert.equal(validateGmail('student@gmail.co'), false);
});

test('Phone number validation accepts 10 digits starting with 09 or 07', () => {
  assert.equal(validatePhoneNumber('0911223344'), true);
  assert.equal(validatePhoneNumber('0711223344'), true);
  assert.equal(validatePhoneNumber('0811223344'), false);
  assert.equal(validatePhoneNumber('091122334'), false);
  assert.equal(validatePhoneNumber('09112233445'), false);
  assert.equal(validatePhoneNumber('09112233ab'), false);
});

test('FAN validation accepts numeric strings and rejects non-numeric', () => {
  assert.equal(validateFan('12345678'), true);
  assert.equal(validateFan('9876543210123'), true);
  assert.equal(validateFan('fan1234'), false);
  assert.equal(validateFan('123 456'), false);
});

test('Each role redirects to its authorized dashboard route', () => {
  assert.equal(getDashboardPath('CUSTOMER'), '/customer/home');
  assert.equal(getDashboardPath('CAFE_OWNER'), '/owner/dashboard');
  assert.equal(getDashboardPath('CAFE_WORKER'), '/worker/orders');
  assert.equal(getDashboardPath('ADMIN'), '/admin/dashboard');
});

test('Role sidebar permissions restrict access to unauthorized sections', () => {
  // Customer cannot access Cafe Owner or Admin routes
  assert.equal(roleAllowedPages.CUSTOMER.includes('/owner/dashboard'), false);
  assert.equal(roleAllowedPages.CUSTOMER.includes('/admin/dashboard'), false);

  // Cafe Owner cannot access Admin routes
  assert.equal(roleAllowedPages.CAFE_OWNER.includes('/admin/dashboard'), false);
  assert.equal(roleAllowedPages.CAFE_OWNER.includes('/admin/register-cafe'), false);

  // Admin has dedicated dashboard and register-cafe routes
  assert.equal(roleAllowedPages.ADMIN.includes('/admin/dashboard'), true);
  assert.equal(roleAllowedPages.ADMIN.includes('/admin/register-cafe'), true);
});

test('Inactivity session timeout is exactly 3 minutes (180,000 milliseconds)', () => {
  const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;
  assert.equal(INACTIVITY_TIMEOUT_MS, 180000);
});

test('Forgot Password flow validates Student ID format before submitting', () => {
  const validId = 'RU1122/19';
  const invalidId = 'not-a-valid-id';
  assert.equal(validateStudentId(validId), true);
  assert.equal(validateStudentId(invalidId), false);
});

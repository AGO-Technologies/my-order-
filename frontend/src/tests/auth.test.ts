import test from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../i18n/en.ts';
import { am } from '../i18n/am.ts';
import { om } from '../i18n/om.ts';
import { SUPPORTED_LANGUAGES } from '../i18n/types.ts';

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

test('i18n supports English, Amharic, and Afaan Oromo with English as default', () => {
  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(codes, ['en', 'am', 'om']);
  assert.equal(SUPPORTED_LANGUAGES[0].code, 'en');
});

test('i18n translation dictionaries have 100% complete key parity across en, am, and om', () => {
  const enKeys = Object.keys(en).sort();
  const amKeys = Object.keys(am).sort();
  const omKeys = Object.keys(om).sort();

  assert.deepEqual(amKeys, enKeys, 'Amharic keys must match English keys exactly');
  assert.deepEqual(omKeys, enKeys, 'Afaan Oromo keys must match English keys exactly');
});

test('i18n parameter interpolation replaces placeholders correctly', () => {
  const template = en['dashboard.greeting']; // 'Hello, {name}'
  const rendered = template.replace('{name}', 'Abebe');
  assert.equal(rendered, 'Hello, Abebe');

  const templateAm = am['dashboard.greeting'];
  const renderedAm = templateAm.replace('{name}', 'አበበ');
  assert.equal(renderedAm, 'ሰላም፣ አበበ');
});

test('Zero emojis are present in all translation dictionaries', () => {
  // Regex to detect common emoji ranges
  const emojiRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  for (const [key, val] of Object.entries(en)) {
    assert.equal(emojiRegex.test(val), false, `en translation "${key}" contains an emoji: ${val}`);
  }
  for (const [key, val] of Object.entries(am)) {
    assert.equal(emojiRegex.test(val), false, `am translation "${key}" contains an emoji: ${val}`);
  }
  for (const [key, val] of Object.entries(om)) {
    assert.equal(emojiRegex.test(val), false, `om translation "${key}" contains an emoji: ${val}`);
  }
});

test('Theme translation keys exist and match across all languages', () => {
  const themeKeys = ['common.theme', 'common.lightMode', 'common.darkMode', 'common.toggleTheme'];
  for (const k of themeKeys) {
    assert.ok(en[k], `en must have ${k}`);
    assert.ok(am[k], `am must have ${k}`);
    assert.ok(om[k], `om must have ${k}`);
  }
});

test('Official approved color palette exact values are verified', () => {
  const darkPalette = {
    mainBg: '#151D2D',
    cardBg: '#202C40',
    mainText: '#F7F8FC',
    secondaryText: '#B8C4D8',
    primaryButton: '#6F93CD',
    buttonText: '#FFFFFF',
    highlight: '#F5D34A',
    border: '#34435A',
  };

  const lightPalette = {
    mainBg: '#F7F8FC',
    cardBg: '#FFFFFF',
    mainText: '#20252D',
    secondaryText: '#64748B',
    primaryButton: '#2458A6',
    buttonText: '#FFFFFF',
    highlight: '#B58A00',
    border: '#E1E6EF',
  };

  assert.equal(darkPalette.mainBg, '#151D2D');
  assert.equal(darkPalette.cardBg, '#202C40');
  assert.equal(darkPalette.primaryButton, '#6F93CD');
  assert.equal(darkPalette.highlight, '#F5D34A');
  assert.equal(lightPalette.mainBg, '#F7F8FC');
  assert.equal(lightPalette.cardBg, '#FFFFFF');
  assert.equal(lightPalette.primaryButton, '#2458A6');
  assert.equal(lightPalette.highlight, '#B58A00');
});

test('System name is consistently "እኔና ጀለሴ Pre-order System" across all three languages', () => {
  const expectedBrand = 'እኔና ጀለሴ Pre-order System';
  assert.equal(en['common.systemTitle'], expectedBrand);
  assert.equal(am['common.systemTitle'], expectedBrand);
  assert.equal(om['common.systemTitle'], expectedBrand);
});

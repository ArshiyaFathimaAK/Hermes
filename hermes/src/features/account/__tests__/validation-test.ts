import { MAX_NAME_LENGTH, validateName } from '../validation';

it('needs a name', () => {
  expect(validateName('')).toBe('Enter your name.');
  expect(validateName('   ')).toBe('Enter your name.');
});

it('allows names up to the database limit, ignoring spaces around them', () => {
  expect(validateName('Ana')).toBeUndefined();
  expect(validateName(` ${'a'.repeat(MAX_NAME_LENGTH)} `)).toBeUndefined();
  expect(validateName('a'.repeat(MAX_NAME_LENGTH + 1))).toBe('Use 80 characters or fewer.');
});

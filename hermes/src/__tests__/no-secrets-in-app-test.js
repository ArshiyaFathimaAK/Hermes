// Plain JavaScript: it reads files with Node, which the app's TypeScript setup leaves out on purpose.
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

// Everything in the app's .env files ends up inside the app, where anyone can read it.
// This catches the usual mistake: pasting Supabase's secret key where the publishable one goes.

const root = join(__dirname, '../..');
const envFiles = readdirSync(root).filter((name) => name.startsWith('.env'));

function jwtRole(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role;
  } catch {
    return undefined;
  }
}

it.each(envFiles)('%s holds nothing secret', (name) => {
  const text = readFileSync(join(root, name), 'utf8');
  expect(text).not.toMatch(/sb_secret_/);
  expect(text).not.toMatch(/postgres(ql)?:\/\/[^\s:]+:[^\s@]+@/);
  expect(text).not.toMatch(/^[^#]*SERVICE_ROLE/m);
  for (const token of text.match(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g) ?? []) {
    expect(jwtRole(token)).not.toBe('service_role');
  }
});

it('found the env files to check', () => {
  expect(envFiles).toContain('.env');
});

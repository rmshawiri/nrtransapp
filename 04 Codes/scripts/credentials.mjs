import { readFileSync } from 'node:fs';

// Local operations only. Never bundle this module in application/client code.
export function credentials() {
  const text = readFileSync(new URL('../../02 Documentation/Informations des comptes.txt', import.meta.url), 'utf8');
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^:=]+?)\s*[:=]\s*(.*)$/);
    if (match) values[match[1].trim()] = match[2].trim();
  }
  // The dashboard also presents a heading followed by a standalone URI.
  const pooler = text.match(/postgres(?:ql)?:\/\/[^\s]+\.pooler\.supabase\.com[^\s]*/);
  if (!values['Session pooler'] && pooler) values['Session pooler'] = pooler[0];
  return values;
}

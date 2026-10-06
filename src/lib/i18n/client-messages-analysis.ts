/**
 * Static analysis behind client-messages.test.ts: which message keys the
 * browser can ask for under a route.
 *
 * Walks the import graph from a route's page file. A module marked
 * 'use client', and everything it imports, runs in the browser; inside those
 * modules every useTranslations(namespace) call and the literal keys passed to
 * its `t` are collected. A namespace whose keys are not all literal (a key
 * built at runtime) is required whole. Server components are skipped: they
 * read messages on the server and ship only the rendered text.
 *
 * Node-only and test-only; nothing in the app imports it.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.mdx'];

function resolveImport(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith('@/')) base = path.join(SRC, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(from), specifier);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) if (fs.existsSync(base + ext)) return base + ext;
  for (const ext of EXTENSIONS) {
    const index = path.join(base, `index${ext}`);
    if (fs.existsSync(index)) return index;
  }
  return null;
}

const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?[^'";]*?from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bexport\s+[^'";]*?from\s*['"]([^'"]+)['"]/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const sourceCache = new Map<string, string>();
function read(file: string): string {
  let source = sourceCache.get(file);
  if (source === undefined) {
    source = fs.readFileSync(file, 'utf8');
    sourceCache.set(file, source);
  }
  return source;
}

function importsOf(file: string): string[] {
  const source = read(file);
  const found = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      // `import type` brings no code into the bundle.
      if (/^import\s+type\b/.test(match[0])) continue;
      const resolved = resolveImport(file, match[1]);
      if (resolved) found.add(resolved);
    }
  }
  return [...found];
}

function isClientModule(file: string): boolean {
  return /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(read(file));
}

/** Every module that ends up in the browser bundle of a route entry. */
export function clientModules(entry: string): string[] {
  const client = new Set<string>();
  const seen = new Set<string>();
  const walk = (file: string, inClient: boolean) => {
    const key = `${file}|${inClient}`;
    if (seen.has(key)) return;
    seen.add(key);
    const nowClient = inClient || isClientModule(file);
    if (nowClient) client.add(file);
    for (const dependency of importsOf(file)) walk(dependency, nowClient);
  };
  walk(entry, false);
  return [...client].sort();
}

/**
 * The message keys one module reads through useTranslations: a full key path
 * per literal call ("economics.staleBanner"), or the bare namespace when some
 * key is computed. `useTranslations()` without a namespace yields the literal
 * dotted keys found in the file.
 */
export function messageKeysOf(file: string): string[] {
  const source = read(file);
  const keys = new Set<string>();
  const calls = [...source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useTranslations\(\s*(?:['"]([^'"]*)['"])?\s*\)/g)];
  for (const [, name, namespace] of calls) {
    const prefix = namespace ? `${namespace}.` : '';
    const literal = new RegExp(`\\b${name}(?:\\.rich|\\.markup|\\.raw|\\.has)?\\(\\s*(['"\`])([^'"\`$]+)\\1`, 'g');
    const any = new RegExp(`\\b${name}(?:\\.rich|\\.markup|\\.raw|\\.has)?\\(`, 'g');
    const literals = [...source.matchAll(literal)].map(match => match[2]);
    const total = [...source.matchAll(any)].length;
    if (namespace && literals.length < total) keys.add(namespace);
    for (const key of literals) keys.add(`${prefix}${key}`);
    if (!namespace && literals.length < total) {
      // t(condition ? 'a.b' : 'c.d'): every dotted literal in the file that
      // could be a key. Over-collecting only makes the assertion stricter.
      for (const match of source.matchAll(/['"]([a-zA-Z]+\.[\w.]+)['"]/g)) keys.add(match[1]);
    }
  }
  return [...keys].sort();
}

/** Every key the browser can ask for under a route entry. */
export function clientMessageKeys(entry: string): Map<string, string[]> {
  const byKey = new Map<string, string[]>();
  for (const file of clientModules(entry)) {
    for (const key of messageKeysOf(file)) {
      const users = byKey.get(key) ?? [];
      users.push(path.relative(process.cwd(), file));
      byKey.set(key, users);
    }
  }
  return byKey;
}

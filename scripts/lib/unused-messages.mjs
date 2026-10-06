// Which keys in messages/{pt,en}.json nothing reads.
//
// The catalogue is shipped to every page (the client provider gets all of
// it), so a dead key costs bytes on every view and invites translators to
// keep copy nobody sees. The scan is deliberately conservative: a key counts
// as used on any plausible reference, so what it reports is safe to delete.
//
// A leaf key `a.b.c` is used when, in some file under src/ or scripts/ (tests
// excluded, they read the catalogue directly):
//   1. its full path appears quoted: t('a.b.c'), nameKey: 'a.b.c', '…a.b.c…';
//   2. a tail of it appears quoted ('b.c' or 'c') in a file that also quotes
//      the matching head as a namespace ('a' or 'a.b'): useTranslations('a'),
//      getTranslations({ namespace: 'a.b' });
//   3. a template literal builds it from an ancestor: t(`a.b.${x}`), or
//      t(`b.${x}`) in a file that quotes the namespace 'a';
//   4. an ancestor is read whole: t.raw('a.b'), or messages.a.b in code.
//
//   node scripts/lib/unused-messages.mjs          # list unused keys
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'scripts'];
const SOURCE = /\.(tsx?|mjs|cjs|js|mdx)$/;

/** Every leaf path of a message tree, dotted. */
export function leafPaths(tree, prefix = []) {
  return Object.entries(tree).flatMap(([key, value]) => (
    value && typeof value === 'object' && !Array.isArray(value)
      ? leafPaths(value, [...prefix, key])
      : [[...prefix, key].join('.')]
  ));
}

function walk(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, found);
    } else if (SOURCE.test(entry.name) && !/\.test\./.test(entry.name) && !entry.name.endsWith('.generated.ts')) {
      found.push(full);
    }
  }
  return found;
}

export function readSources(root = ROOT) {
  return SCAN_DIRS.flatMap(dir => walk(path.join(root, dir)))
    .filter(file => !file.endsWith(path.join('scripts', 'lib', 'unused-messages.mjs')))
    .map(file => fs.readFileSync(file, 'utf8'));
}

const QUOTES = ["'", '"', '`'];
const quoted = (text, value) => QUOTES.some(q => text.includes(`${q}${value}${q}`));

/**
 * @param {string[]} paths  leaf paths
 * @param {string[]} sources  file contents
 * @returns {string[]} the paths no source references
 */
export function findUnused(paths, sources) {
  // Per-file indices are cheap to rebuild: the catalogue is ~1,500 keys.
  return paths.filter(full => {
    const parts = full.split('.');
    for (const text of sources) {
      // 1. Full path quoted (or inside a longer quoted list of paths).
      if (quoted(text, full) || text.includes(`'${full}'`)) return false;
      for (let i = 1; i < parts.length; i++) {
        const head = parts.slice(0, i).join('.');
        const tail = parts.slice(i).join('.');
        // 2. Namespace + tail.
        if (quoted(text, head) && quoted(text, tail)) return false;
      }
      for (let i = 1; i < parts.length; i++) {
        const ancestor = parts.slice(0, i).join('.');
        // 3. Template built from the full ancestor path.
        if (text.includes(`\`${ancestor}.\${`)) return false;
        // 3b. Template built from a tail of the ancestor, under its namespace.
        for (let j = 1; j < i; j++) {
          const ns = parts.slice(0, j).join('.');
          const rest = parts.slice(j, i).join('.');
          if (quoted(text, ns) && text.includes(`\`${rest}.\${`)) return false;
        }
        // 4. The ancestor read whole.
        if (new RegExp(`\\.raw\\(\\s*['"\`]${ancestor.replace(/\./g, '\\.')}['"\`]`).test(text)) return false;
        if (text.includes(`messages.${ancestor}`) && i === parts.length - 1) return false;
      }
      // 4b. A t.raw of a tail under a namespace quoted in the file.
      for (let i = 1; i < parts.length; i++) {
        const head = parts.slice(0, i).join('.');
        for (let k = i + 1; k < parts.length; k++) {
          const sub = parts.slice(i, k).join('.');
          if (quoted(text, head) && new RegExp(`\\.raw\\(\\s*['"\`]${sub.replace(/\./g, '\\.')}['"\`]`).test(text)) return false;
        }
      }
    }
    return true;
  });
}

export function unusedMessageKeys(root = ROOT) {
  const pt = JSON.parse(fs.readFileSync(path.join(root, 'messages/pt.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(root, 'messages/en.json'), 'utf8'));
  const paths = [...new Set([...leafPaths(pt), ...leafPaths(en)])].sort();
  return findUnused(paths, readSources(root));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const unused = unusedMessageKeys();
  for (const key of unused) console.log(key);
  console.error(`${unused.length} unused message keys`);
}

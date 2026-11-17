import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const from = join(dist, 'index.html');
const to = join(dist, 'DevOps-Academy.html');
if (!existsSync(from)) {
  console.error('Build output missing:', from);
  process.exit(1);
}
copyFileSync(from, to);
const docs = join(process.cwd(), 'docs');
mkdirSync(docs, { recursive: true });
copyFileSync(from, join(docs, 'index.html'));
console.log('Built:', to);
console.log('Pages:', join(docs, 'index.html'));

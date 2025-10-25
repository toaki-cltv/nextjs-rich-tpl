import fs from 'fs';
import path from 'path';

// This script is intentionally minimal and safe for CI testing.
// It writes a marker file to the created project root to indicate it ran.

const marker = path.join(process.cwd(), 'POSTCREATE_RAN');
try {
  fs.writeFileSync(marker, 'ok');
  console.log('post-create: marker written');
  process.exit(0);
} catch (err) {
  console.error('post-create: failed to write marker', err);
  process.exit(2);
}

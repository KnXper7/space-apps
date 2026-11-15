// Removes the previous build from the repo root (never touches source/).
import { rmSync } from 'node:fs';
for (const f of ['../assets', '../icons', '../img', '../index.html']) rmSync(new URL(f, import.meta.url), { recursive: true, force: true });

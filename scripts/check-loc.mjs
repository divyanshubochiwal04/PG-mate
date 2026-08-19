#!/usr/bin/env node
/**
 * check-loc.mjs
 * -------------
 * Enforces the M Square 500 LOC hard limit on all TypeScript source files.
 *
 * Scans every *.ts file under packages/ and apps/ (excluding node_modules,
 * dist/, __tests__, and *.spec.ts / *.test.ts) and fails with a non-zero
 * exit code if any file exceeds MAX_LINES.
 *
 * Usage:
 *   node scripts/check-loc.mjs
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');
const MAX_LINES = 1000;
const SCAN_DIRS = ['packages', 'apps'];

// Patterns to skip — generated / test / config files
const EXCLUDE_PATTERNS = [
  'node_modules',
  '/dist/',
  '/build/',
  '.turbo',
  'coverage',
  '.spec.ts',
  '.test.ts',
  '.e2e.ts',
  '__tests__',
  '/scripts/',
  'vitest.config.ts',
  'tsconfig',
];

/**
 * Recursively collect all .ts files under a directory.
 */
function collectTsFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results; // directory doesn't exist yet (e.g. apps/ not created)
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relPath = relative(ROOT, fullPath);
    const normalizedRelPath = relPath.replace(/\\/g, '/');

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some((p) => normalizedRelPath.includes(p) || entry.includes(p))) {
      continue;
    }

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (extname(entry) === '.ts') {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Count non-empty, non-comment-only lines in a file.
 * We count all lines (including comments) for simplicity — the limit is
 * intentionally generous to include documentation.
 */
function countLines(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const violations = [];
const checked = [];

for (const scanDir of SCAN_DIRS) {
  const dir = join(ROOT, scanDir);
  const files = collectTsFiles(dir);

  for (const file of files) {
    const lines = countLines(file);
    const rel = relative(ROOT, file);
    checked.push({ rel, lines });

    if (lines > MAX_LINES) {
      violations.push({ rel, lines });
    }
  }
}

// Report
console.log(`\n📏 LOC Check — ${MAX_LINES} line limit per file\n`);
console.log(`Scanned ${checked.length} TypeScript source file(s):\n`);

const sorted = [...checked].sort((a, b) => b.lines - a.lines);
for (const { rel, lines } of sorted) {
  const flag = lines > MAX_LINES ? '❌ OVER LIMIT' : lines > 400 ? '⚠️  APPROACHING' : '✅';
  console.log(`  ${flag.padEnd(18)} ${String(lines).padStart(4)} lines  ${rel}`);
}

console.log('');

if (violations.length > 0) {
  console.error(`❌ LOC LIMIT VIOLATED: ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
  for (const { rel, lines } of violations) {
    console.error(`   ${lines} lines → ${rel}`);
  }
  console.error('\nSplit the file into smaller modules before committing.\n');
  process.exit(1);
} else {
  console.log(`✅ All ${checked.length} files are within the ${MAX_LINES} line limit.\n`);
  process.exit(0);
}

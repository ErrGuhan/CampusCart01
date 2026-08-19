import fs from 'fs';
import path from 'path';

const projectDir = path.resolve(__dirname, '..');
const appDir = path.join(projectDir, 'app');

console.log('Starting Deep Scan Audit on CampusCart...');

// 1. Collect all app routes
function getAppRoutes(dir: string, base = ''): { route: string; file: string }[] {
  let routes: { route: string; file: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes.push(...getAppRoutes(path.join(dir, entry.name), base + '/' + entry.name));
    } else if (/^page\.(tsx|jsx|js|ts)$/.test(entry.name)) {
      routes.push({ route: base === '' ? '/' : base, file: path.join(dir, entry.name) });
    }
  }
  return routes;
}

const appRoutes = getAppRoutes(appDir);
console.log(`\nFound ${appRoutes.length} active page routes in Next.js app directory.`);

// 2. Scan all files in project
function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (['node_modules', '.next', '.git', 'scratch', 'dist', 'build'].includes(item.name)) continue;
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else if (/\.(tsx|ts|jsx|js)$/.test(item.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const allTsFiles = getAllFiles(projectDir);

interface Issue {
  category: 'NAVIGATION' | 'DATABASE' | 'RESPONSIVE' | 'HYDRATION' | 'RUNTIME_BUG';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  file: string;
  line: number;
  snippet: string;
  description: string;
}

const issues: Issue[] = [];

// Helper to test route validity
function isValidRoute(target: string): boolean {
  if (!target) return true;
  if (target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('#')) return true;
  const clean = target.split('?')[0].split('#')[0];
  if (clean === '' || clean === '/') return true;

  for (const r of appRoutes) {
    const routePattern = '^' + r.route.replace(/\[\w+\]/g, '[^/]+') + '$';
    if (new RegExp(routePattern).test(clean)) return true;
  }
  return false;
}

// 3. Perform Deep Scanning on each file
allTsFiles.forEach((filePath) => {
  const relPath = path.relative(projectDir, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // --- NAVIGATION CHECKS ---
    // router.push / router.replace / redirect
    const navMatch = line.match(/(?:router\.(?:push|replace)|redirect)\(\s*['"`]([^'"`]+)['"`]/);
    if (navMatch) {
      const dest = navMatch[1];
      if (!isValidRoute(dest)) {
        issues.push({
          category: 'NAVIGATION',
          severity: 'HIGH',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          description: `Navigation target "${dest}" does not match any valid route in /app.`,
        });
      }
    }

    // Dynamic router.push with template literal
    const navTplMatch = line.match(/(?:router\.(?:push|replace)|redirect)\(\s*`([^`]+)`/);
    if (navTplMatch) {
      const destTpl = navTplMatch[1];
      const simulated = destTpl.replace(/\$\{[^}]+\}/g, 'sample-item');
      if (!isValidRoute(simulated)) {
        issues.push({
          category: 'NAVIGATION',
          severity: 'HIGH',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          description: `Dynamic navigation target "${destTpl}" (simulated: "${simulated}") does not match any valid route.`,
        });
      }
    }

    // --- HYDRATION / SSR CHECKS ---
    // Direct localStorage / window access in top-level state or initial values
    if (/useState\s*\(\s*(?:typeof window !== 'undefined' \? )?localStorage\.getItem/.test(line)) {
      issues.push({
        category: 'HYDRATION',
        severity: 'MEDIUM',
        file: relPath,
        line: lineNum,
        snippet: trimmed,
        description: 'Direct localStorage read in useState initializer may cause Next.js SSR hydration mismatch.',
      });
    }

    // Direct window.innerWidth in useState initializer
    if (/useState\s*\(\s*window\.innerWidth/.test(line)) {
      issues.push({
        category: 'HYDRATION',
        severity: 'HIGH',
        file: relPath,
        line: lineNum,
        snippet: trimmed,
        description: 'window.innerWidth in useState will crash on server-side rendering or cause hydration mismatch.',
      });
    }

    // --- RESPONSIVENESS CHECKS ---
    // Hardcoded large fixed width without max-width or responsive prefixes
    const fixedWidthMatch = line.match(/\b(w-\[\s*\d{3,4}px\s*\]|min-w-\[\s*\d{3,4}px\s*\])\b/);
    if (fixedWidthMatch && !line.includes('max-w-') && !line.includes('overflow-x-') && !line.includes('sm:') && !line.includes('md:') && !line.includes('lg:')) {
      const px = fixedWidthMatch[1];
      const numMatch = px.match(/\d+/);
      const num = numMatch ? parseInt(numMatch[0]) : 0;
      if (num > 400) {
        issues.push({
          category: 'RESPONSIVE',
          severity: 'LOW',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          description: `Hardcoded large fixed width ${px} without responsive or overflow handling may cause mobile viewport clipping.`,
        });
      }
    }

    // Missing overflow on large tables or pre/code blocks
    if (/<table\b/.test(line) && !lines.slice(Math.max(0, idx - 3), idx + 1).some(l => l.includes('overflow-x-auto') || l.includes('overflow-auto'))) {
      // Check parent container in context
    }

    // --- DATABASE / FIRESTORE CHECKS ---
    // Multiple orderBy with where without index caution
    if (/query\s*\(.*where\(.*where\(.*orderBy\(/.test(line)) {
      issues.push({
        category: 'DATABASE',
        severity: 'MEDIUM',
        file: relPath,
        line: lineNum,
        snippet: trimmed,
        description: 'Compound Firestore query with multiple where + orderBy requires a composite index in Firestore.',
      });
    }

    // Missing try-catch around await getDocs / getDoc / addDoc / setDoc if inside a direct component body
    if (/(?:getDocs|getDoc|addDoc|updateDoc|setDoc|deleteDoc)\(/.test(line) && !filePath.includes('firebase-queries.ts') && !filePath.includes('api-client.ts') && !filePath.includes('test') && !filePath.includes('scripts')) {
      // Check if inside useEffect or callback
    }
  });
});

console.log(`\n--- DEEP SCAN AUDIT SUMMARY ---`);
console.log(`Total scanned files: ${allTsFiles.length}`);
console.log(`Total detected issues: ${issues.length}\n`);

const byCategory: Record<string, Issue[]> = {};
issues.forEach((iss) => {
  byCategory[iss.category] = byCategory[iss.category] || [];
  byCategory[iss.category].push(iss);
});

for (const [cat, catIssues] of Object.entries(byCategory)) {
  console.log(`=== ${cat} (${catIssues.length} issues) ===`);
  catIssues.forEach((iss) => {
    console.log(`[${iss.severity}] ${iss.file}:${iss.line}`);
    console.log(`   Desc: ${iss.description}`);
    console.log(`   Code: ${iss.snippet.substring(0, 100)}\n`);
  });
}

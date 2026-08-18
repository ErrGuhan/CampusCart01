import fs from 'fs';
import path from 'path';

const projectDir = process.cwd();
const appDir = path.join(projectDir, 'app');

function getValidAppRoutes(dir: string, baseRoute = ''): string[] {
  let routes: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes.push(...getValidAppRoutes(path.join(dir, entry.name), baseRoute + '/' + entry.name));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx' || entry.name === 'page.js') {
      routes.push(baseRoute === '' ? '/' : baseRoute);
    }
  }
  return routes;
}

const validRoutes = getValidAppRoutes(appDir);
console.log('--- VALID APP ROUTES ---');
console.log(validRoutes.sort().join('\n'));

// Regex route matcher
function routeMatches(targetHref: string, routePatterns: string[]): boolean {
  if (targetHref.startsWith('http') || targetHref.startsWith('mailto:') || targetHref.startsWith('tel:') || targetHref.startsWith('#')) {
    return true;
  }
  const cleanPath = targetHref.split('?')[0].split('#')[0];
  if (cleanPath === '') return true;

  for (const pattern of routePatterns) {
    const regexPattern = '^' + pattern.replace(/\[\w+\]/g, '[^/]+') + '$';
    if (new RegExp(regexPattern).test(cleanPath)) {
      return true;
    }
  }
  return false;
}

interface LinkIssue {
  file: string;
  line: number;
  href: string;
  reason: string;
}

const issues: LinkIssue[] = [];

function checkFileForLinks(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // match href="..." or href='...'
    const literalMatches = Array.from(line.matchAll(/href=["']([^"']+)["']/g));
    for (const match of literalMatches) {
      const href = match[1];
      if (!routeMatches(href, validRoutes)) {
        issues.push({
          file: path.relative(projectDir, filePath),
          line: lineNum,
          href,
          reason: 'No matching app route found for literal href',
        });
      }
    }

    // match href={`...`}
    const tplMatches = Array.from(line.matchAll(/href=\{`([^`]+)`\}/g));
    for (const match of tplMatches) {
      const tpl = match[1];
      // replace ${...} with dummy placeholder 'item-slug'
      const simulatedHref = tpl.replace(/\$\{[^}]+\}/g, 'sample-item');
      if (!routeMatches(simulatedHref, validRoutes)) {
        issues.push({
          file: path.relative(projectDir, filePath),
          line: lineNum,
          href: tpl,
          reason: `No matching app route for dynamic href template (simulated: ${simulatedHref})`,
        });
      }
    }
  });
}

function scanDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFileForLinks(fullPath);
    }
  }
}

scanDir(path.join(projectDir, 'app'));
scanDir(path.join(projectDir, 'components'));

console.log('\n--- LINK AUDIT RESULTS ---');
console.log(`Found ${issues.length} potential link issues:`);
issues.forEach((iss) => {
  console.log(`[ISSUE] ${iss.file}:${iss.line} -> href="${iss.href}" (${iss.reason})`);
});

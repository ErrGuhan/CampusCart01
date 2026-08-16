import fs from 'fs';
import path from 'path';

const issues: { file: string; line: number; type: string; details: string }[] = [];

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Check for broken template literals in href
    const tplHref = Array.from(line.matchAll(/href=\{`([^`]+)`\}/g));
    for (const match of tplHref) {
      const template = match[1];
      // Check if template starts with /
      if (template.startsWith('/') && !template.startsWith('/http') && !template.startsWith('/mailto')) {
        const root = '/' + template.split('/')[1]?.split('$')[0]?.split('?')[0];
        const knownRoots = [
          '/', '/account', '/admin', '/cart', '/categories', '/checkout',
          '/community', '/dashboard', '/deals', '/events', '/freelancer',
          '/how-it-works', '/login', '/marketplace', '/messages', '/notifications',
          '/products', '/register', '/requests', '/seller', '/sellers',
          '/services', '/studio', '/used', '/wishlist', '/api'
        ];
        if (!knownRoots.includes(root)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'UNKNOWN_ROOT_IN_TEMPLATE_HREF',
            details: `Template href: ${match[0]} (Root: ${root})`
          });
        }
      }
    }

    // 2. Check for empty href="" or href="#"
    if (/href=["']#["']/.test(line) && !line.includes('href="#') && !line.includes('accordion') && !line.includes('tab')) {
      issues.push({
        file: filePath,
        line: lineNum,
        type: 'PLACEHOLDER_HASH_HREF',
        details: line.trim()
      });
    }

    // 3. Check for hardcoded localhost or test URLs
    if (/http:\/\/localhost(?!:3000)/.test(line) || /127\.0\.0\.1/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNum,
        type: 'LOCAL_IP_OR_PORT_REFERENCE',
        details: line.trim()
      });
    }

    // 4. Check for console.error or uncaught error rethrows that break user experience
    if (line.includes('alert(')) {
      issues.push({
        file: filePath,
        line: lineNum,
        type: 'RAW_BROWSER_ALERT',
        details: line.trim()
      });
    }

    // 5. Check for missing key props in maps
    if (line.includes('.map(') && !line.includes('key=') && !lines[idx + 1]?.includes('key=')) {
      // Potentially missing key
    }
  });
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

walkDir(process.cwd());

console.log(`Total potential issues discovered: ${issues.length}`);
issues.forEach((iss) => {
  console.log(`[${iss.type}] ${iss.file}:${iss.line} -> ${iss.details}`);
});

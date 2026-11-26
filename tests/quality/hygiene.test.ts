import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

describe('Automated Repository Hygiene', () => {
  it('contains all required documentation and configuration files', () => {
    const required = [
      '.editorconfig',
      '.prettierrc',
      '.prettierignore',
      '.env.example',
      '.gitignore',
      'SECURITY.md',
      'CONTRIBUTING.md',
      'README.md',
      'vercel.json',
      'docs/ARCHITECTURE.md',
      'docs/SECURITY.md',
      'docs/ACCESSIBILITY.md',
      'docs/TESTING.md',
      'docs/DATA_SOURCES.md',
      'docs/OFFLINE_SUPPORT.md',
      'docs/DEPLOYMENT.md',
      '.github/workflows/ci.yml',
    ];
    for (const relPath of required) {
      expect(existsSync(join(ROOT, relPath)), `Missing required file: ${relPath}`).toBe(true);
    }
  });

  it('re-includes .env.example in .gitignore and excludes .env.local', () => {
    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.env.local');
    expect(gitignore).toContain('!.env.example');
  });

  it('has all required scripts and Node >= 20 engine constraint in package.json', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
      engines?: Record<string, string>;
    };
    const requiredScripts = [
      'dev',
      'build',
      'typecheck',
      'lint',
      'format',
      'format:check',
      'test',
      'coverage',
      'e2e',
      'check',
    ];
    for (const s of requiredScripts) {
      expect(pkg.scripts[s], `Missing script ${s}`).toBeTruthy();
    }
    expect(pkg.engines?.node).toContain('20');
  });

  it('enforces zero unsafe any/suppressions, zero client console logging, and <=250 line modules across src/ and api/', () => {
    const srcFiles = collectSourceFiles(join(ROOT, 'src'));
    const apiFiles = collectSourceFiles(join(ROOT, 'api'));
    expect(srcFiles.length).toBeGreaterThan(20);

    for (const file of [...srcFiles, ...apiFiles]) {
      const rel = relative(ROOT, file);
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/).length;

      expect(content, `${rel} contains explicit 'as any'`).not.toMatch(/\bas\s+any\b/);
      expect(content, `${rel} contains ': any'`).not.toMatch(/:\s*any\b/);
      expect(content, `${rel} contains '<any>'`).not.toContain('<any>');
      expect(content, `${rel} contains @ts-ignore`).not.toContain('@ts-ignore');
      expect(content, `${rel} contains @ts-nocheck`).not.toContain('@ts-nocheck');
      expect(content, `${rel} contains lint disable`).not.toMatch(/eslint-disable|oxlint-disable/);
      expect(lines, `${rel} exceeded 200 lines (${lines})`).toBeLessThanOrEqual(200);
      expect(content.toLowerCase(), `${rel} contains stale gemini reference`).not.toContain(
        'gemini',
      );
      expect(content, `${rel} contains leftover @google/genai`).not.toContain('@google/genai');

      if (file.startsWith(join(ROOT, 'src'))) {
        expect(content, `${rel} contains client console logging`).not.toMatch(
          /\bconsole\.(log|debug|info|warn|error)\s*\(/,
        );
      }
    }
  });

  it('contains no hardcoded Google API key in tracked source or docs', () => {
    const trackedDirs = ['src', 'api', 'docs'];
    for (const dir of trackedDirs) {
      for (const file of collectSourceFiles(join(ROOT, dir))) {
        const content = readFileSync(file, 'utf8');
        expect(content).not.toMatch(/AQ\.[A-Za-z0-9_-]{20,}/);
        expect(content).not.toMatch(/AIza[A-Za-z0-9_-]{20,}/);
        expect(content).not.toMatch(/gsk_[A-Za-z0-9]{20,}/);
      }
    }
  });
});

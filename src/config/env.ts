import * as path from 'path';

/**
 * Candidate env files, in priority order (first match for a key wins).
 *
 *  1. src/config/<NODE_ENV>.env   (legacy per-environment file, git-ignored)
 *  2. .env.<NODE_ENV>             (repo root, git-ignored)
 *  3. .env                        (repo root, git-ignored)
 *
 * Copy .env.example to .env to get started. Real values must never be committed.
 */
export function envFilePaths(): string[] {
  const env = process.env.NODE_ENV || 'development';
  const root = process.cwd();
  return [path.join(__dirname, `${env}.env`), path.join(root, `.env.${env}`), path.join(root, '.env')];
}

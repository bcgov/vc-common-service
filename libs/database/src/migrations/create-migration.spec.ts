import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('readline');

const mockFs = fs as jest.Mocked<typeof fs>;

// Helper to extract functions for testing
const toClassName = (name: string): string =>
  name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const getNextMigrationNumber = (directory: string): number => {
  const numbers = fs
    .readdirSync(directory)
    .filter((file) => /^\d{6}_/.test(file))
    .map((file) => Number(file.slice(0, 6)));

  return numbers.length ? Math.max(...numbers) + 1 : 1;
};

function addMigrationImport(source: string, importStatement: string): string {
  const migrationImportsMatch = source.match(
    /(import\s+.*from\s+['"]\.\/migrations\/[^'"]*['"];(?:\n|$))+/,
  );

  if (migrationImportsMatch) {
    return source.replace(
      migrationImportsMatch[0],
      migrationImportsMatch[0] + importStatement,
    );
  }

  return source.replace(
    /export const AppDataSource/,
    `${importStatement}\nexport const AppDataSource`,
  );
}

function addMigrationToArray(source: string, migrationClass: string): string {
  return source.replace(/migrations:\s*\[([^\]]*)\]/, (_, current: string) => {
    const migrations = current.trim();

    return migrations.length
      ? `migrations: [${migrations}, ${migrationClass}]`
      : `migrations: [${migrationClass}]`;
  });
}

describe('create-migration', () => {
  describe('toClassName', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toClassName('create-users-table')).toBe('CreateUsersTable');
    });

    it('should handle single word', () => {
      expect(toClassName('users')).toBe('Users');
    });

    it('should handle multiple hyphens', () => {
      expect(toClassName('add-user-profile-table')).toBe('AddUserProfileTable');
    });
  });

  describe('getNextMigrationNumber', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 1 when no migrations exist', () => {
      mockFs.readdirSync.mockReturnValue([]);
      const result = getNextMigrationNumber('/migrations');
      expect(result).toBe(1);
    });

    it('should return next number after highest existing migration', () => {
      mockFs.readdirSync.mockReturnValue([
        '000001_initial.ts',
        '000002_add-users.ts',
      ] as any);
      const result = getNextMigrationNumber('/migrations');
      expect(result).toBe(3);
    });

    it('should ignore non-migration files', () => {
      mockFs.readdirSync.mockReturnValue([
        '000001_initial.ts',
        'random-file.ts',
        '000003_test.ts',
      ] as any);
      const result = getNextMigrationNumber('/migrations');
      expect(result).toBe(4);
    });
  });

  describe('addMigrationImport', () => {
    it('should add import after existing migration imports', () => {
      const source = `import { DataSource } from 'typeorm';

import { InitialExtensions1783630501649 } from './migrations/000001_initial-extensions';

export const AppDataSource = new DataSource({`;

      const result = addMigrationImport(
        source,
        "import { Test1783639437965 } from './migrations/000002_test';\n",
      );

      expect(result).toContain(
        "import { InitialExtensions1783630501649 } from './migrations/000001_initial-extensions';",
      );
      expect(result).toContain(
        "import { Test1783639437965 } from './migrations/000002_test';",
      );
      expect(result).not.toContain(
        "import { InitialExtensions1783630501649 } from './migrations/000001_initial-extensions';\n\nimport { Test1783639437965 }",
      );
    });

    it('should add import before export if no migration imports exist', () => {
      const source = `import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({`;

      const result = addMigrationImport(
        source,
        "import { Test1783639437965 } from './migrations/000002_test';\n",
      );

      expect(result).toMatch(
        /import { Test1783639437965 } from '.\/migrations\/000002_test';[\s\n]+export const AppDataSource/,
      );
    });
  });

  describe('addMigrationToArray', () => {
    it('should add first migration to empty array', () => {
      const source = 'migrations: []';
      const result = addMigrationToArray(source, 'TestMigration123');
      expect(result).toBe('migrations: [TestMigration123]');
    });

    it('should add migration to existing migrations', () => {
      const source = 'migrations: [ExistingMigration456]';
      const result = addMigrationToArray(source, 'NewMigration789');
      expect(result).toBe('migrations: [ExistingMigration456, NewMigration789]');
    });

    it('should handle multiple existing migrations', () => {
      const source = 'migrations: [Migration1, Migration2, Migration3]';
      const result = addMigrationToArray(source, 'Migration4');
      expect(result).toBe('migrations: [Migration1, Migration2, Migration3, Migration4]');
    });

    it('should handle migrations array with whitespace', () => {
      const source = 'migrations: [ Migration1 , Migration2 ]';
      const result = addMigrationToArray(source, 'Migration3');
      expect(result).toBe('migrations: [Migration1 , Migration2, Migration3]');
    });
  });
});

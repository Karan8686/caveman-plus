import { describe, it, expect } from 'vitest';
import { findConfig, loadConfig, mergeConfig } from '../src/utils/config.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('config file support', () => {
  describe('findConfig', () => {
    it('finds caveman.config.json', () => {
      const tempDir = join(tmpdir(), `caveman-test-${Date.now()}`);
      mkdirSync(tempDir);
      writeFileSync(join(tempDir, 'caveman.config.json'), JSON.stringify({ mode: 'ultra' }));

      const result = findConfig(tempDir);
      expect(result.configPath).toBeTruthy();
      expect(result.configPath).toContain('caveman.config.json');

      rmSync(tempDir, { recursive: true });
    });

    it('finds .cavemanrc', () => {
      const tempDir = join(tmpdir(), `caveman-test-${Date.now()}-rc`);
      mkdirSync(tempDir);
      writeFileSync(join(tempDir, '.cavemanrc'), JSON.stringify({ mode: 'lite' }));

      const result = findConfig(tempDir);
      expect(result.configPath).toBeTruthy();
      expect(result.configPath).toContain('.cavemanrc');

      rmSync(tempDir, { recursive: true });
    });

    it('prefers caveman.config.json over .cavemanrc', () => {
      const tempDir = join(tmpdir(), `caveman-test-${Date.now()}-both`);
      mkdirSync(tempDir);
      writeFileSync(join(tempDir, 'caveman.config.json'), JSON.stringify({ mode: 'ultra' }));
      writeFileSync(join(tempDir, '.cavemanrc'), JSON.stringify({ mode: 'lite' }));

      const result = findConfig(tempDir);
      expect(result.configPath).toBeTruthy();
      expect(result.configPath).toContain('caveman.config.json');

      rmSync(tempDir, { recursive: true });
    });

    it('returns null when no config exists', () => {
      const tempDir = join(tmpdir(), `caveman-test-${Date.now()}-empty`);
      mkdirSync(tempDir);

      const result = findConfig(tempDir);
      expect(result.configPath).toBeNull();

      rmSync(tempDir, { recursive: true });
    });
  });

  describe('loadConfig', () => {
    it('loads from caveman.config.json', () => {
      const tempDir = join(tmpdir(), `caveman-load-${Date.now()}`);
      mkdirSync(tempDir);
      writeFileSync(join(tempDir, 'caveman.config.json'), JSON.stringify({ mode: 'full', customFillers: ['um'] }));

      const config = loadConfig(tempDir);
      expect(config.mode).toBe('full');
      expect(config.customFillers).toContain('um');

      rmSync(tempDir, { recursive: true });
    });

    it('loads from .cavemanrc', () => {
      const tempDir = join(tmpdir(), `caveman-load-rc-${Date.now()}`);
      mkdirSync(tempDir);
      writeFileSync(join(tempDir, '.cavemanrc'), JSON.stringify({ mode: 'context' }));

      const config = loadConfig(tempDir);
      expect(config.mode).toBe('context');

      rmSync(tempDir, { recursive: true });
    });
  });

  describe('mergeConfig with .cavemanrc', () => {
    it('applies mode from .cavemanrc config', () => {
      const config = { mode: 'context' as const };
      const merged = mergeConfig(config, {});
      expect(merged.mode).toBe('context');
    });

    it('CLI override takes precedence over config', () => {
      const config = { mode: 'lite' as const };
      const merged = mergeConfig(config, { mode: 'ultra' });
      expect(merged.mode).toBe('ultra');
    });

    it('merges custom fillers from config', () => {
      const config = { customFillers: ['like', 'youKnow'] };
      const merged = mergeConfig(config, {});
      expect(merged.filler).not.toBe(false);
      if (typeof merged.filler === 'object' && merged.filler?.fillers) {
        expect(merged.filler.fillers).toContain('like');
        expect(merged.filler.fillers).toContain('youKnow');
      }
    });
  });
});

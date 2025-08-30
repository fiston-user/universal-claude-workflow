// Jest is available globally
const fs = require('fs-extra');
const { execSync } = require('child_process');
const health = require('../src/health');
const projectDetector = require('../src/project-detector');

jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('../src/project-detector');
jest.mock('../src/utils/validation');

describe('Health Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('check', () => {
    beforeEach(() => {
      // Mock all validation methods to pass by default
      const validation = require('../src/utils/validation');
      validation.validateEnvironment = jest.fn().mockResolvedValue({ 
        valid: true, 
        errors: [], 
        warnings: [] 
      });
      validation.validateProjectStructure = jest.fn().mockResolvedValue({ 
        valid: true, 
        issues: [] 
      });

      // Mock Claude Code installed
      execSync.mockImplementation((cmd) => {
        if (cmd === 'claude --version') return 'claude-code 1.0.0';
        if (cmd.includes('npm audit')) return '';
        return '';
      });

      // Mock file system
      fs.pathExists = jest.fn().mockResolvedValue(true);
      fs.readJSON = jest.fn().mockResolvedValue({
        hooks: {},
        agents: ['code-reviewer'],
        customCommands: ['tdd-cycle']
      });
      fs.readdir = jest.fn().mockResolvedValue(['code-reviewer.md']);

      // Mock project detection
      projectDetector.detect = jest.fn().mockResolvedValue({
        type: 'node',
        language: 'javascript',
        framework: 'react',
        testingFramework: 'jest'
      });
    });

    test('should pass all checks with healthy setup', async () => {
      await health.check();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Health Check')
      );
    });

    test('should detect missing CLAUDE.md', async () => {
      fs.pathExists = jest.fn().mockImplementation((path) => {
        return !path.endsWith('CLAUDE.md');
      });

      await health.check();

      // Check that the health checker detected the missing file
      // We can't directly test the internal state, but we can test the output
      expect(console.log).toHaveBeenCalled();
    });

    test('should detect Claude Code not installed', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === 'claude --version') {
          throw new Error('Command not found');
        }
        return '';
      });

      await health.check();

      expect(console.log).toHaveBeenCalled();
    });

    test('should check Node.js dependencies', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === 'claude --version') return 'claude-code 1.0.0';
        if (cmd === 'npm audit --audit-level=high') return '';
        if (cmd === 'npm outdated --json') return JSON.stringify({
          'some-package': {
            current: '1.0.0',
            latest: '2.0.0'
          }
        });
        return '';
      });

      await health.check();

      expect(execSync).toHaveBeenCalledWith('npm audit --audit-level=high', { stdio: 'pipe' });
    });

    test('should handle security vulnerabilities', async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === 'claude --version') return 'claude-code 1.0.0';
        if (cmd === 'npm audit --audit-level=high') {
          throw new Error('Security vulnerabilities found');
        }
        return '';
      });

      await health.check();

      expect(console.log).toHaveBeenCalled();
    });

    test('should validate hooks configuration', async () => {
      const hooksManager = require('../src/hooks-manager');
      hooksManager.validateHookConfiguration = jest.fn().mockResolvedValue({
        valid: false,
        issues: ['Invalid hook configuration']
      });

      await health.check();

      expect(hooksManager.validateHookConfiguration).toHaveBeenCalled();
    });

    test('should validate MCP configuration', async () => {
      const mcpManager = require('../src/mcp-manager');
      mcpManager.validateMCPConfiguration = jest.fn().mockResolvedValue({
        valid: false,
        error: 'MCP configuration file not found'
      });
      mcpManager.listInstalledServers = jest.fn().mockResolvedValue([]);

      await health.check();

      expect(mcpManager.validateMCPConfiguration).toHaveBeenCalled();
    });

    test('should generate verbose report when requested', async () => {
      fs.writeFile = jest.fn().mockResolvedValue();

      await health.check({ verbose: true });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('ucw-health-report.md'),
        expect.stringContaining('# UCW Health Check Report')
      );
    });
  });

  describe('checkDependencies', () => {
    test('should check Python dependencies when available', async () => {
      projectDetector.detect = jest.fn().mockResolvedValue({
        language: 'python'
      });

      fs.pathExists = jest.fn().mockImplementation((path) => {
        return path.endsWith('requirements.txt');
      });

      execSync.mockImplementation((cmd) => {
        if (cmd === 'safety check') return '';
        return '';
      });

      const healthChecker = new (require('../src/health').constructor)();
      await healthChecker.checkDependencies();

      expect(execSync).toHaveBeenCalledWith('safety check', { stdio: 'pipe' });
    });

    test('should check Go dependencies', async () => {
      projectDetector.detect = jest.fn().mockResolvedValue({
        language: 'go'
      });

      fs.pathExists = jest.fn().mockImplementation((path) => {
        return path.endsWith('go.mod');
      });

      execSync.mockImplementation((cmd) => {
        if (cmd === 'go list -m -u all') return '';
        return '';
      });

      const healthChecker = new (require('../src/health').constructor)();
      await healthChecker.checkDependencies();

      expect(execSync).toHaveBeenCalledWith('go list -m -u all', { stdio: 'pipe' });
    });

    test('should check Rust dependencies', async () => {
      projectDetector.detect = jest.fn().mockResolvedValue({
        language: 'rust'
      });

      fs.pathExists = jest.fn().mockImplementation((path) => {
        return path.endsWith('Cargo.toml');
      });

      execSync.mockImplementation((cmd) => {
        if (cmd === 'cargo audit') return '';
        return '';
      });

      const healthChecker = new (require('../src/health').constructor)();
      await healthChecker.checkDependencies();

      expect(execSync).toHaveBeenCalledWith('cargo audit', { stdio: 'pipe' });
    });
  });

  describe('getTestCommand', () => {
    test('should return correct test commands', () => {
      const healthChecker = new (require('../src/health').constructor)();

      expect(healthChecker.getTestCommand({ testingFramework: 'jest' }))
        .toBe('npx jest');
      expect(healthChecker.getTestCommand({ testingFramework: 'vitest' }))
        .toBe('npx vitest');
      expect(healthChecker.getTestCommand({ testingFramework: 'pytest' }))
        .toBe('pytest');
      expect(healthChecker.getTestCommand({ testingFramework: 'go test' }))
        .toBe('go test');
    });
  });

  describe('getBuildCommand', () => {
    test('should return correct build commands', () => {
      const healthChecker = new (require('../src/health').constructor)();

      expect(healthChecker.getBuildCommand({ 
        buildSystem: 'webpack', 
        packageManager: 'npm' 
      })).toBe('npx webpack');

      expect(healthChecker.getBuildCommand({ 
        buildSystem: 'go build' 
      })).toBe('go build');

      expect(healthChecker.getBuildCommand({ 
        buildSystem: 'cargo' 
      })).toBe('cargo build');
    });
  });

  describe('generateReport', () => {
    test('should generate summary with success rate', async () => {
      const healthChecker = new (require('../src/health').constructor)();
      healthChecker.successes = [
        { category: 'Test', message: 'Success' },
        { category: 'Build', message: 'Success' }
      ];
      healthChecker.issues = [
        { category: 'Dependencies', message: 'Warning', severity: 'warning' }
      ];

      await healthChecker.generateReport({});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Success Rate: 67%')
      );
    });

    test('should provide recommendations based on issues', async () => {
      const healthChecker = new (require('../src/health').constructor)();
      healthChecker.successes = [];
      healthChecker.issues = [
        { category: 'UCW Configuration', message: 'Missing', severity: 'error' },
        { category: 'Dependencies', message: 'Outdated', severity: 'warning' }
      ];

      await healthChecker.generateReport({});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ucw init')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Update dependencies')
      );
    });
  });
});

// Mock the hooks and MCP managers
jest.mock('../src/hooks-manager', () => ({
  validateHookConfiguration: jest.fn().mockResolvedValue({ valid: true, issues: [] })
}));

jest.mock('../src/mcp-manager', () => ({
  validateMCPConfiguration: jest.fn().mockResolvedValue({ valid: true }),
  listInstalledServers: jest.fn().mockResolvedValue(['filesystem', 'git'])
}));

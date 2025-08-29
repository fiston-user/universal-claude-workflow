// Jest is available globally
const fs = require('fs-extra');
const path = require('path');
const templateEngine = require('../src/template-engine');

jest.mock('fs-extra');

describe('TemplateEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateClaudeMd', () => {
    test('should generate CLAUDE.md for React project', async () => {
      const config = {
        projectType: 'node',
        language: 'typescript',
        framework: 'react',
        packageManager: 'npm',
        testingFramework: 'jest',
        buildSystem: 'webpack',
        focus: 'tdd',
        agents: ['code-reviewer', 'test-generator'],
        commands: ['tdd-cycle', 'project-health'],
        hooks: ['pre-commit', 'post-tool']
      };

      // Mock template file doesn't exist, will use base template
      fs.pathExists = jest.fn().mockResolvedValue(false);

      const result = await templateEngine.generateClaudeMd(config);

      expect(result).toContain('react');
      expect(result).toContain('typescript');
      expect(result).toContain('jest');
      expect(result).toContain('webpack');
      expect(result).toContain('npm');
      expect(result).toContain('/tdd-cycle');
      expect(result).toContain('Code Reviewer');
      expect(result).toContain('Test-Driven Development');
    });

    test('should use specific template if available', async () => {
      const config = {
        framework: 'react',
        language: 'typescript'
      };

      const mockTemplate = `# {{PROJECT_NAME}} - React TypeScript Project

Framework: {{FRAMEWORK}}
Language: {{LANGUAGE}}
Commands: {{COMMANDS_LIST}}
`;

      fs.pathExists = jest.fn().mockResolvedValue(true);
      fs.readFile = jest.fn().mockResolvedValue(mockTemplate);

      const result = await templateEngine.generateClaudeMd(config);

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('react-typescript-tdd.md'),
        'utf8'
      );
      expect(result).toContain('React TypeScript Project');
    });

    test('should populate template placeholders correctly', async () => {
      const config = {
        projectType: 'node',
        language: 'javascript',
        framework: 'vue',
        packageManager: 'yarn',
        focus: 'security',
        agents: ['security-auditor'],
        commands: ['security-audit'],
        hooks: ['security-scan']
      };

      fs.pathExists = jest.fn().mockResolvedValue(false);

      const result = await templateEngine.generateClaudeMd(config);

      expect(result).toContain('vue');
      expect(result).toContain('yarn');
      expect(result).toContain('security');
      expect(result).toContain('/security-audit');
      expect(result).toContain('Security Auditor');
    });
  });

  describe('selectTemplate', () => {
    test('should select React template for React framework', async () => {
      const config = { framework: 'react' };

      fs.pathExists = jest.fn().mockResolvedValue(true);
      fs.readFile = jest.fn().mockResolvedValue('React template content');

      const result = await templateEngine.selectTemplate(config);

      expect(fs.pathExists).toHaveBeenCalledWith(
        expect.stringContaining('react-typescript-tdd.md')
      );
      expect(result).toBe('React template content');
    });

    test('should fall back to base template if specific not found', async () => {
      const config = { framework: 'unknown-framework' };

      fs.pathExists = jest.fn().mockResolvedValue(false);

      const result = await templateEngine.selectTemplate(config);

      expect(result).toContain('{{PROJECT_NAME}}');
      expect(result).toContain('{{FRAMEWORK}}');
    });
  });

  describe('generateAgentsList', () => {
    test('should generate agents list', () => {
      const agents = ['code-reviewer', 'test-generator', 'documentation'];

      const result = templateEngine.generateAgentsList(agents);

      expect(result).toContain('Code Reviewer');
      expect(result).toContain('Test Generator');
      expect(result).toContain('Documentation');
      expect(result).toContain('Automated code review');
      expect(result).toContain('Generate comprehensive test suites');
    });

    test('should handle empty agents list', () => {
      const result = templateEngine.generateAgentsList([]);
      expect(result).toBe('No AI agents configured.');
    });

    test('should handle null agents list', () => {
      const result = templateEngine.generateAgentsList(null);
      expect(result).toBe('No AI agents configured.');
    });
  });

  describe('generateCommandsList', () => {
    test('should generate commands list', () => {
      const commands = ['tdd-cycle', 'bdd-scenario', 'project-health'];

      const result = templateEngine.generateCommandsList(commands);

      expect(result).toContain('/tdd-cycle');
      expect(result).toContain('/bdd-scenario');
      expect(result).toContain('/project-health');
      expect(result).toContain('red-green-refactor');
      expect(result).toContain('BDD scenarios');
      expect(result).toContain('project diagnostics');
    });

    test('should handle empty commands list', () => {
      const result = templateEngine.generateCommandsList([]);
      expect(result).toBe('No custom commands configured.');
    });
  });

  describe('generateHooksList', () => {
    test('should generate hooks list', () => {
      const hooks = ['pre-commit', 'post-tool', 'test-trigger'];

      const result = templateEngine.generateHooksList(hooks);

      expect(result).toContain('Pre-commit');
      expect(result).toContain('Post-tool');
      expect(result).toContain('Test Trigger');
      expect(result).toContain('before commits');
      expect(result).toContain('after file modifications');
    });

    test('should handle empty hooks list', () => {
      const result = templateEngine.generateHooksList([]);
      expect(result).toBe('No automation hooks configured.');
    });
  });

  describe('getTddSection', () => {
    test('should return TDD section content', () => {
      const result = templateEngine.getTddSection();

      expect(result).toContain('Test-Driven Development');
      expect(result).toContain('Red');
      expect(result).toContain('Green');
      expect(result).toContain('Refactor');
      expect(result).toContain('/tdd-cycle');
      expect(result).toContain('>90%');
    });
  });

  describe('getBddSection', () => {
    test('should return BDD section content', () => {
      const result = templateEngine.getBddSection();

      expect(result).toContain('Behavior-Driven Development');
      expect(result).toContain('Given-When-Then');
      expect(result).toContain('/bdd-scenario');
      expect(result).toContain('Gherkin');
      expect(result).toContain('Feature:');
      expect(result).toContain('Scenario:');
    });
  });

  describe('getSecuritySection', () => {
    test('should return security section content', () => {
      const result = templateEngine.getSecuritySection();

      expect(result).toContain('Security-First Development');
      expect(result).toContain('/security-audit');
      expect(result).toContain('Input validation');
      expect(result).toContain('authentication');
      expect(result).toContain('authorization');
    });
  });

  describe('getPerformanceSection', () => {
    test('should return performance section content', () => {
      const result = templateEngine.getPerformanceSection();

      expect(result).toContain('Performance Optimization');
      expect(result).toContain('/optimize-bundle');
      expect(result).toContain('Measure before optimizing');
      expect(result).toContain('performance budgets');
    });
  });

  describe('listAvailableTemplates', () => {
    test('should return list of available templates', async () => {
      const templates = await templateEngine.listAvailableTemplates();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      
      const reactTemplate = templates.find(t => t.name === 'react-typescript-tdd');
      expect(reactTemplate).toBeDefined();
      expect(reactTemplate.framework).toBe('react');
      expect(reactTemplate.focus).toBe('tdd');

      const universalTemplate = templates.find(t => t.name === 'universal-base');
      expect(universalTemplate).toBeDefined();
      expect(universalTemplate.framework).toBe('any');
    });
  });
});
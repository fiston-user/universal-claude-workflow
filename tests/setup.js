// Jest setup file

// Suppress console output during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Mock chalk to return strings as-is
jest.mock('chalk', () => {
  const chainable = (str) => str;
  chainable.bold = (str) => str;
  
  return {
    blue: Object.assign(chainable, { bold: chainable }),
    green: Object.assign(chainable, { bold: chainable }),
    yellow: Object.assign(chainable, { bold: chainable }),
    red: Object.assign(chainable, { bold: chainable }),
    cyan: Object.assign(chainable, { bold: chainable }),
    magenta: Object.assign(chainable, { bold: chainable }),
    gray: chainable,
    white: chainable,
    bgRed: Object.assign(chainable, { white: chainable }),
    bold: chainable
  };
});

// Mock ora spinner
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: ''
  }));
});

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockResolvedValue({})
}));

// Global test helpers
global.createMockConfig = (overrides = {}) => ({
  projectType: 'node',
  language: 'javascript',
  framework: 'react',
  packageManager: 'npm',
  testingFramework: 'jest',
  buildSystem: 'webpack',
  focus: 'general',
  agents: ['code-reviewer'],
  commands: ['tdd-cycle'],
  hooks: ['pre-commit'],
  mcpIntegrations: false,
  skipPermissions: false,
  ...overrides
});

global.createMockProjectInfo = (overrides = {}) => ({
  type: 'node',
  language: 'javascript',
  framework: 'react',
  packageManager: 'npm',
  testingFramework: 'jest',
  buildSystem: 'webpack',
  hasGit: true,
  hasDocker: false,
  structure: {},
  ...overrides
});

// Setup process.cwd mock
const originalCwd = process.cwd;
beforeEach(() => {
  process.cwd = jest.fn().mockReturnValue('/test/project');
});

afterEach(() => {
  process.cwd = originalCwd;
});
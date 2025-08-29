const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class HooksManager {
  constructor() {
    this.hooksDir = path.join(__dirname, '../hooks');
  }

  async install(hooks, config) {
    if (!hooks || hooks.length === 0) return;

    const claudeDir = path.join(process.cwd(), '.claude');
    await fs.ensureDir(claudeDir);

    const settingsPath = path.join(claudeDir, 'settings.json');
    let settings = {};

    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJSON(settingsPath);
    }

    if (!settings.hooks) {
      settings.hooks = {};
    }

    for (const hookName of hooks) {
      const hookConfig = await this.getHookConfiguration(hookName, config);
      if (hookConfig) {
        Object.assign(settings.hooks, hookConfig);
      }
    }

    await fs.writeJSON(settingsPath, settings, { spaces: 2 });
  }

  async getHookConfiguration(hookName, config) {
    switch (hookName) {
      case 'pre-commit':
        return this.getPreCommitHook(config);
      case 'post-tool':
        return this.getPostToolHook(config);
      case 'test-trigger':
        return this.getTestTriggerHook(config);
      case 'build-validation':
        return this.getBuildValidationHook(config);
      case 'security-scan':
        return this.getSecurityScanHook(config);
      case 'session-analytics':
        return this.getSessionAnalyticsHook(config);
      default:
        console.warn(chalk.yellow(`Unknown hook: ${hookName}`));
        return null;
    }
  }

  getPreCommitHook(config) {
    const hooks = [];

    // Linting hook
    if (config.language === 'javascript' || config.language === 'typescript') {
      hooks.push({
        type: 'command',
        command: `${config.packageManager || 'npm'} run lint`
      });
    } else if (config.language === 'python') {
      hooks.push({
        type: 'command',
        command: 'flake8 . || true'
      });
    } else if (config.language === 'rust') {
      hooks.push({
        type: 'command',
        command: 'cargo clippy -- -D warnings || true'
      });
    } else if (config.language === 'go') {
      hooks.push({
        type: 'command',
        command: 'go vet ./... || true'
      });
    }

    // Formatting hook
    if (config.language === 'javascript' || config.language === 'typescript') {
      hooks.push({
        type: 'command',
        command: `${config.packageManager || 'npm'} run format`
      });
    }

    return {
      'PreToolUse': [
        {
          matcher: 'git commit',
          hooks
        }
      ]
    };
  }

  getPostToolHook(config) {
    const hooks = [];

    // Auto-formatting after file edits
    if (config.language === 'javascript' || config.language === 'typescript') {
      hooks.push({
        type: 'command',
        command: 'npx prettier --write $FILE || true'
      });
    } else if (config.language === 'python') {
      hooks.push({
        type: 'command',
        command: 'black $FILE || true'
      });
    } else if (config.language === 'rust') {
      hooks.push({
        type: 'command',
        command: 'cargo fmt || true'
      });
    } else if (config.language === 'go') {
      hooks.push({
        type: 'command',
        command: 'go fmt $FILE || true'
      });
    }

    return {
      'PostToolUse': [
        {
          matcher: 'Edit',
          hooks
        },
        {
          matcher: 'Write',
          hooks
        }
      ]
    };
  }

  getTestTriggerHook(config) {
    const testCommand = this.getTestCommand(config);
    
    return {
      'PostToolUse': [
        {
          matcher: 'Edit',
          hooks: [
            {
              type: 'command',
              command: `${testCommand} || echo "Tests failed but continuing..."`
            }
          ]
        }
      ]
    };
  }

  getBuildValidationHook(config) {
    const buildCommand = this.getBuildCommand(config);
    
    return {
      'PostToolUse': [
        {
          matcher: 'Edit',
          hooks: [
            {
              type: 'command',
              command: `${buildCommand} || echo "Build failed but continuing..."`
            }
          ]
        }
      ]
    };
  }

  getSecurityScanHook(config) {
    const hooks = [];

    if (config.language === 'javascript' || config.language === 'typescript') {
      hooks.push({
        type: 'command',
        command: 'npm audit --audit-level=high || true'
      });
    } else if (config.language === 'python') {
      hooks.push({
        type: 'command',
        command: 'safety check || true'
      });
    } else if (config.language === 'rust') {
      hooks.push({
        type: 'command',
        command: 'cargo audit || true'
      });
    }

    return {
      'SessionStart': [
        {
          matcher: '*',
          hooks
        }
      ]
    };
  }

  getSessionAnalyticsHook(config) {
    return {
      'SessionStart': [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'echo "UCW Session Started: $(date)" >> .ucw-analytics.log'
            }
          ]
        }
      ],
      'SessionEnd': [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'echo "UCW Session Ended: $(date)" >> .ucw-analytics.log'
            }
          ]
        }
      ]
    };
  }

  getTestCommand(config) {
    switch (config.testingFramework) {
      case 'jest':
        return `${config.packageManager || 'npm'} test`;
      case 'vitest':
        return `${config.packageManager || 'npm'} run test`;
      case 'pytest':
        return 'pytest';
      case 'go test':
        return 'go test ./...';
      case 'cargo test':
        return 'cargo test';
      case 'phpunit':
        return 'vendor/bin/phpunit';
      default:
        return 'echo "No test command configured"';
    }
  }

  getBuildCommand(config) {
    if (config.language === 'javascript' || config.language === 'typescript') {
      return `${config.packageManager || 'npm'} run build`;
    } else if (config.language === 'python') {
      return 'python -m py_compile **/*.py';
    } else if (config.language === 'go') {
      return 'go build ./...';
    } else if (config.language === 'rust') {
      return 'cargo build';
    } else if (config.language === 'java') {
      return config.buildSystem === 'maven' ? 'mvn compile' : 'gradle build';
    } else if (config.language === 'php') {
      return 'composer install --no-dev';
    }
    return 'echo "No build command configured"';
  }

  async listAvailableHooks() {
    return [
      {
        name: 'pre-commit',
        description: 'Validation and formatting before commits',
        events: ['PreToolUse'],
        commands: ['lint', 'format', 'test']
      },
      {
        name: 'post-tool',
        description: 'Automatic formatting after file modifications',
        events: ['PostToolUse'],
        commands: ['format', 'lint']
      },
      {
        name: 'test-trigger',
        description: 'Automatic test execution on changes',
        events: ['PostToolUse'],
        commands: ['test']
      },
      {
        name: 'build-validation',
        description: 'Ensure builds succeed after changes',
        events: ['PostToolUse'],
        commands: ['build']
      },
      {
        name: 'security-scan',
        description: 'Automatic vulnerability scanning',
        events: ['SessionStart'],
        commands: ['audit', 'security-check']
      },
      {
        name: 'session-analytics',
        description: 'Track and analyze coding sessions',
        events: ['SessionStart', 'SessionEnd'],
        commands: ['log', 'analytics']
      }
    ];
  }

  async validateHookConfiguration(config) {
    const issues = [];
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');

    if (!await fs.pathExists(settingsPath)) {
      issues.push('No Claude Code settings file found');
      return { valid: false, issues };
    }

    const settings = await fs.readJSON(settingsPath);

    if (!settings.hooks) {
      issues.push('No hooks configuration found');
      return { valid: false, issues };
    }

    // Validate hook structure
    for (const [event, eventHooks] of Object.entries(settings.hooks)) {
      if (!Array.isArray(eventHooks)) {
        issues.push(`Invalid hooks configuration for event: ${event}`);
        continue;
      }

      for (const hookConfig of eventHooks) {
        if (!hookConfig.matcher || !hookConfig.hooks) {
          issues.push(`Invalid hook configuration structure in ${event}`);
          continue;
        }

        if (!Array.isArray(hookConfig.hooks)) {
          issues.push(`Hooks must be an array in ${event}`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

module.exports = new HooksManager();
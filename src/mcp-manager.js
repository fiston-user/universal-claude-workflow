const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

class MCPManager {
  async setup(config) {
    const mcpConfig = {
      mcpServers: {},
      version: '0.1.0'
    };

    // Add common MCP servers based on project type
    await this.addCommonServers(mcpConfig, config);

    // Interactive selection for additional servers
    if (config.mcpIntegrations) {
      await this.addInteractiveServers(mcpConfig, config);
    }

    // Write MCP configuration
    await this.writeMCPConfig(mcpConfig);
    
    // Generate MCP documentation
    await this.generateMCPDocumentation(mcpConfig);
  }

  async addCommonServers(mcpConfig, config) {
    // File system server (always useful)
    mcpConfig.mcpServers.filesystem = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-filesystem'],
      env: {
        ALLOWED_DIRECTORIES: process.cwd()
      }
    };

    // Git server for version control
    if (config.hasGit) {
      mcpConfig.mcpServers.git = {
        command: 'npx',
        args: ['@modelcontextprotocol/server-git'],
        env: {
          GIT_REPOSITORY: process.cwd()
        }
      };
    }

    // Language-specific servers
    await this.addLanguageSpecificServers(mcpConfig, config);

    // Framework-specific servers
    await this.addFrameworkSpecificServers(mcpConfig, config);
  }

  async addLanguageSpecificServers(mcpConfig, config) {
    switch (config.language) {
      case 'javascript':
      case 'typescript':
        await this.addNodeJSServers(mcpConfig, config);
        break;
      case 'python':
        await this.addPythonServers(mcpConfig, config);
        break;
      case 'go':
        await this.addGoServers(mcpConfig, config);
        break;
      case 'rust':
        await this.addRustServers(mcpConfig, config);
        break;
      case 'java':
        await this.addJavaServers(mcpConfig, config);
        break;
      case 'php':
        await this.addPHPServers(mcpConfig, config);
        break;
    }
  }

  async addNodeJSServers(mcpConfig, config) {
    // NPM server for package management
    mcpConfig.mcpServers.npm = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-npm'],
      env: {
        PROJECT_ROOT: process.cwd()
      }
    };

    // SQLite server if using databases
    if (await this.hasDatabase(config)) {
      mcpConfig.mcpServers.sqlite = {
        command: 'npx',
        args: ['@modelcontextprotocol/server-sqlite'],
        env: {
          DATABASE_PATH: './database.sqlite'
        }
      };
    }

    // Puppeteer server for browser automation/testing
    if (config.testingFramework === 'cypress' || config.testingFramework === 'playwright') {
      mcpConfig.mcpServers.puppeteer = {
        command: 'npx',
        args: ['@modelcontextprotocol/server-puppeteer'],
        env: {
          HEADLESS: 'true',
          TIMEOUT: '30000'
        }
      };
    }
  }

  async addPythonServers(mcpConfig, config) {
    // PostgreSQL server for Python projects (common choice)
    if (await this.hasDatabase(config)) {
      mcpConfig.mcpServers.postgresql = {
        command: 'python',
        args: ['-m', 'mcp_server_postgresql'],
        env: {
          DATABASE_URL: 'postgresql://localhost:5432/devdb'
        }
      };
    }

    // Brave search server for AI applications
    if (config.framework === 'fastapi' || config.focus === 'ai') {
      mcpConfig.mcpServers.brave_search = {
        command: 'python',
        args: ['-m', 'mcp_server_brave_search'],
        env: {
          BRAVE_API_KEY: '${BRAVE_API_KEY}'
        }
      };
    }
  }

  async addGoServers(mcpConfig, config) {
    // Go-specific servers would go here
    // Currently placeholder as Go MCP servers are less common
    
    if (await this.hasDatabase(config)) {
      mcpConfig.mcpServers.postgresql = {
        command: 'mcp-server-postgresql',
        args: [],
        env: {
          DATABASE_URL: 'postgresql://localhost:5432/devdb'
        }
      };
    }
  }

  async addRustServers(mcpConfig, config) {
    // Rust-specific servers would go here
    // Currently placeholder as Rust MCP servers are less common
    
    if (await this.hasDatabase(config)) {
      mcpConfig.mcpServers.postgresql = {
        command: 'mcp-server-postgresql',
        args: [],
        env: {
          DATABASE_URL: 'postgresql://localhost:5432/devdb'
        }
      };
    }
  }

  async addJavaServers(mcpConfig, config) {
    // Java-specific servers would go here
    if (await this.hasDatabase(config)) {
      mcpConfig.mcpServers.postgresql = {
        command: 'java',
        args: ['-jar', 'mcp-postgresql-server.jar'],
        env: {
          DATABASE_URL: 'postgresql://localhost:5432/devdb'
        }
      };
    }
  }

  async addPHPServers(mcpConfig, config) {
    // PHP-specific servers would go here
    if (await this.hasDatabase(config)) {
      mcpConfig.mcpServers.mysql = {
        command: 'php',
        args: ['mcp-mysql-server.php'],
        env: {
          DATABASE_URL: 'mysql://localhost:3306/devdb'
        }
      };
    }
  }

  async addFrameworkSpecificServers(mcpConfig, config) {
    switch (config.framework) {
      case 'react':
      case 'nextjs':
        await this.addReactServers(mcpConfig, config);
        break;
      case 'vue':
        await this.addVueServers(mcpConfig, config);
        break;
      case 'django':
        await this.addDjangoServers(mcpConfig, config);
        break;
      case 'fastapi':
        await this.addFastAPIServers(mcpConfig, config);
        break;
      case 'express':
        await this.addExpressServers(mcpConfig, config);
        break;
    }
  }

  async addReactServers(mcpConfig, config) {
    // Memory server for development state management
    mcpConfig.mcpServers.memory = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-memory'],
      env: {
        MEMORY_NAMESPACE: 'react-dev'
      }
    };

    // Sequential thinking server for complex problem solving
    mcpConfig.mcpServers.sequential_thinking = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-sequential-thinking']
    };
  }

  async addVueServers(mcpConfig, config) {
    // Similar to React but Vue-specific
    mcpConfig.mcpServers.memory = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-memory'],
      env: {
        MEMORY_NAMESPACE: 'vue-dev'
      }
    };
  }

  async addDjangoServers(mcpConfig, config) {
    // Django admin server integration
    mcpConfig.mcpServers.django_admin = {
      command: 'python',
      args: ['-m', 'mcp_server_django_admin'],
      env: {
        DJANGO_SETTINGS_MODULE: 'settings.development'
      }
    };
  }

  async addFastAPIServers(mcpConfig, config) {
    // FastAPI documentation server
    mcpConfig.mcpServers.openapi = {
      command: 'python',
      args: ['-m', 'mcp_server_openapi'],
      env: {
        OPENAPI_URL: 'http://localhost:8000/openapi.json'
      }
    };
  }

  async addExpressServers(mcpConfig, config) {
    // Express-specific monitoring
    mcpConfig.mcpServers.express_monitor = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-express-monitor'],
      env: {
        EXPRESS_PORT: '3000'
      }
    };
  }

  async addInteractiveServers(mcpConfig, config) {
    const availableServers = await this.getAvailableServers();
    
    const choices = availableServers.map(server => ({
      name: `${server.name} - ${server.description}`,
      value: server.key,
      checked: server.recommended
    }));

    const { selectedServers } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedServers',
        message: 'Select additional MCP servers to install:',
        choices: choices,
        pageSize: 10
      }
    ]);

    for (const serverKey of selectedServers) {
      const server = availableServers.find(s => s.key === serverKey);
      if (server) {
        mcpConfig.mcpServers[serverKey] = server.config;
      }
    }
  }

  async getAvailableServers() {
    return [
      {
        key: 'sentry',
        name: 'Sentry Error Monitoring',
        description: 'Integration with Sentry for error tracking and monitoring',
        recommended: true,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-sentry'],
          env: {
            SENTRY_DSN: '${SENTRY_DSN}'
          }
        }
      },
      {
        key: 'github',
        name: 'GitHub Integration',
        description: 'Access GitHub repositories, issues, and pull requests',
        recommended: true,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}'
          }
        }
      },
      {
        key: 'slack',
        name: 'Slack Integration',
        description: 'Send notifications and messages to Slack channels',
        recommended: false,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-slack'],
          env: {
            SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}'
          }
        }
      },
      {
        key: 'aws',
        name: 'AWS Services',
        description: 'Integration with AWS services (S3, Lambda, etc.)',
        recommended: false,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-aws'],
          env: {
            AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
            AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
            AWS_REGION: 'us-east-1'
          }
        }
      },
      {
        key: 'docker',
        name: 'Docker Integration',
        description: 'Manage Docker containers and images',
        recommended: false,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-docker'],
          env: {
            DOCKER_HOST: 'unix:///var/run/docker.sock'
          }
        }
      },
      {
        key: 'kubernetes',
        name: 'Kubernetes Integration',
        description: 'Manage Kubernetes clusters and resources',
        recommended: false,
        config: {
          command: 'kubectl',
          args: ['mcp-server'],
          env: {
            KUBECONFIG: '${HOME}/.kube/config'
          }
        }
      },
      {
        key: 'redis',
        name: 'Redis Integration',
        description: 'Interact with Redis for caching and data storage',
        recommended: false,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-redis'],
          env: {
            REDIS_URL: 'redis://localhost:6379'
          }
        }
      },
      {
        key: 'elasticsearch',
        name: 'Elasticsearch Integration',
        description: 'Search and analytics with Elasticsearch',
        recommended: false,
        config: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-elasticsearch'],
          env: {
            ELASTICSEARCH_URL: 'http://localhost:9200'
          }
        }
      }
    ];
  }

  async hasDatabase(config) {
    // Check for common database indicators
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      return !!(deps.mongoose || deps.pg || deps.mysql2 || deps.sqlite3 || deps.prisma || deps.sequelize);
    }

    // Check for Python database libraries
    const requirementsPath = path.join(process.cwd(), 'requirements.txt');
    if (await fs.pathExists(requirementsPath)) {
      const requirements = await fs.readFile(requirementsPath, 'utf8');
      return requirements.includes('psycopg2') || 
             requirements.includes('pymongo') || 
             requirements.includes('sqlalchemy') || 
             requirements.includes('django');
    }

    return false;
  }

  async writeMCPConfig(mcpConfig) {
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    await fs.writeJSON(mcpConfigPath, mcpConfig, { spaces: 2 });
  }

  async generateMCPDocumentation(mcpConfig) {
    const docContent = `# MCP (Model Context Protocol) Configuration

This project uses MCP servers to extend Claude Code's capabilities with external service integrations.

## Installed MCP Servers

${Object.entries(mcpConfig.mcpServers).map(([name, config]) => `
### ${name}
- **Command**: \`${config.command} ${config.args ? config.args.join(' ') : ''}\`
- **Environment Variables**: ${config.env ? Object.keys(config.env).join(', ') : 'None'}
`).join('')}

## Configuration

MCP servers are configured in \`.mcp.json\`. Each server defines:
- **command**: The executable command
- **args**: Command line arguments
- **env**: Environment variables needed

## Environment Variables

Make sure to set the following environment variables:

${this.extractEnvironmentVariables(mcpConfig)}

## Usage

MCP servers are automatically loaded when Claude Code starts. They provide additional tools and capabilities:

- **Filesystem**: File operations and project navigation
- **Git**: Version control operations
- **Database**: Database queries and operations (if configured)
- **External APIs**: Integration with third-party services

## Security Notes

⚠️ **Important**: Never commit sensitive credentials to version control.

- Use environment variables for API keys and tokens
- Consider using a \`.env\` file (add to \`.gitignore\`)
- Use secrets management for production deployments

## Troubleshooting

### Common Issues
1. **Server not found**: Ensure the MCP server package is installed
2. **Authentication errors**: Check environment variables
3. **Connection timeouts**: Verify network connectivity and service availability

### Debugging
Enable MCP debugging with:
\`\`\`bash
claude --mcp-debug
\`\`\`

### Logs
MCP server logs are available in Claude Code's debug output.

## Customization

To add or modify MCP servers:
1. Edit \`.mcp.json\`
2. Install required dependencies
3. Set environment variables
4. Restart Claude Code

For more information, see the [MCP documentation](https://docs.anthropic.com/en/docs/claude-code/mcp).
`;

    const docsDir = path.join(process.cwd(), 'docs');
    await fs.ensureDir(docsDir);
    await fs.writeFile(path.join(docsDir, 'mcp-configuration.md'), docContent);
  }

  extractEnvironmentVariables(mcpConfig) {
    const envVars = new Set();
    
    Object.values(mcpConfig.mcpServers).forEach(server => {
      if (server.env) {
        Object.entries(server.env).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
            envVars.add(value.slice(2, -1));
          }
        });
      }
    });

    if (envVars.size === 0) {
      return 'No environment variables required.';
    }

    return Array.from(envVars).map(envVar => `- \`${envVar}\`: Description needed`).join('\n');
  }

  async validateMCPConfiguration() {
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    
    if (!await fs.pathExists(mcpConfigPath)) {
      return { valid: false, error: 'MCP configuration file not found' };
    }

    try {
      const config = await fs.readJSON(mcpConfigPath);
      
      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        return { valid: false, error: 'Invalid mcpServers configuration' };
      }

      // Validate each server configuration
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        if (!serverConfig.command) {
          return { valid: false, error: `Server '${name}' missing command` };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON in MCP configuration' };
    }
  }

  async listInstalledServers() {
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    
    if (!await fs.pathExists(mcpConfigPath)) {
      return [];
    }

    const config = await fs.readJSON(mcpConfigPath);
    return Object.keys(config.mcpServers || {});
  }

  async removeServer(serverName) {
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    
    if (!await fs.pathExists(mcpConfigPath)) {
      throw new Error('MCP configuration file not found');
    }

    const config = await fs.readJSON(mcpConfigPath);
    
    if (config.mcpServers && config.mcpServers[serverName]) {
      delete config.mcpServers[serverName];
      await fs.writeJSON(mcpConfigPath, config, { spaces: 2 });
      return true;
    }

    return false;
  }

  async addServer(serverName, serverConfig) {
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    let config = { mcpServers: {}, version: '0.1.0' };

    if (await fs.pathExists(mcpConfigPath)) {
      config = await fs.readJSON(mcpConfigPath);
    }

    config.mcpServers[serverName] = serverConfig;
    await fs.writeJSON(mcpConfigPath, config, { spaces: 2 });
  }
}

module.exports = new MCPManager();
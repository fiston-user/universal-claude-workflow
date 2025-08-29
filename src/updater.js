const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

class Updater {
  async update(options = {}) {
    console.log(chalk.blue.bold('🔄 Universal Claude Workflow Updater\n'));

    if (options.checkOnly) {
      await this.checkForUpdates();
    } else if (options.all) {
      await this.updateAll();
    } else {
      await this.updateInteractive();
    }
  }

  async checkForUpdates() {
    console.log(chalk.cyan('🔍 Checking for updates...\n'));

    const updates = await this.getAllAvailableUpdates();
    
    if (updates.length === 0) {
      console.log(chalk.green('✅ Everything is up to date!'));
      return;
    }

    console.log(chalk.yellow.bold('📦 Available Updates:\n'));
    
    updates.forEach(update => {
      console.log(chalk.yellow(`• ${update.name}`));
      console.log(chalk.gray(`  Current: ${update.current}`));
      console.log(chalk.green(`  Latest: ${update.latest}`));
      console.log(chalk.cyan(`  Type: ${update.type}`));
      if (update.description) {
        console.log(chalk.gray(`  ${update.description}`));
      }
      console.log();
    });

    console.log(chalk.blue('💡 Run "ucw update" to install updates'));
  }

  async updateAll() {
    const updates = await this.getAllAvailableUpdates();
    
    if (updates.length === 0) {
      console.log(chalk.green('✅ Everything is up to date!'));
      return;
    }

    console.log(chalk.cyan(`🚀 Updating ${updates.length} components...\n`));

    for (const update of updates) {
      await this.applyUpdate(update);
    }

    console.log(chalk.green.bold('\n✅ All updates completed!'));
    await this.showPostUpdateInstructions();
  }

  async updateInteractive() {
    const inquirer = require('inquirer');
    const updates = await this.getAllAvailableUpdates();
    
    if (updates.length === 0) {
      console.log(chalk.green('✅ Everything is up to date!'));
      return;
    }

    const choices = updates.map(update => ({
      name: `${update.name} (${update.current} → ${update.latest})`,
      value: update,
      checked: true
    }));

    const { selectedUpdates } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedUpdates',
        message: 'Select updates to apply:',
        choices: choices
      }
    ]);

    if (selectedUpdates.length === 0) {
      console.log(chalk.yellow('No updates selected.'));
      return;
    }

    console.log(chalk.cyan(`\n🚀 Applying ${selectedUpdates.length} updates...\n`));

    for (const update of selectedUpdates) {
      await this.applyUpdate(update);
    }

    console.log(chalk.green.bold('\n✅ Selected updates completed!'));
    await this.showPostUpdateInstructions();
  }

  async getAllAvailableUpdates() {
    const updates = [];

    // Check UCW core updates
    const coreUpdate = await this.checkCoreUpdate();
    if (coreUpdate) updates.push(coreUpdate);

    // Check Claude Code updates
    const claudeUpdate = await this.checkClaudeCodeUpdate();
    if (claudeUpdate) updates.push(claudeUpdate);

    // Check project dependencies
    const depUpdates = await this.checkDependencyUpdates();
    updates.push(...depUpdates);

    // Check template updates
    const templateUpdates = await this.checkTemplateUpdates();
    updates.push(...templateUpdates);

    // Check MCP server updates
    const mcpUpdates = await this.checkMCPUpdates();
    updates.push(...mcpUpdates);

    return updates;
  }

  async checkCoreUpdate() {
    try {
      const packagePath = path.join(__dirname, '../package.json');
      const currentPackage = await fs.readJSON(packagePath);
      const currentVersion = currentPackage.version;

      // Check npm for latest version
      const latestVersion = execSync('npm view universal-claude-workflow version', { 
        encoding: 'utf8' 
      }).trim();

      if (semver.gt(latestVersion, currentVersion)) {
        return {
          name: 'Universal Claude Workflow (Core)',
          type: 'core',
          current: currentVersion,
          latest: latestVersion,
          description: 'Core UCW framework updates'
        };
      }
    } catch (error) {
      // Package might not be published yet
    }
    return null;
  }

  async checkClaudeCodeUpdate() {
    try {
      const currentVersion = execSync('claude --version', { encoding: 'utf8' }).trim();
      const latestVersion = execSync('npm view @anthropic-ai/claude-code version', { 
        encoding: 'utf8' 
      }).trim();

      if (semver.gt(latestVersion, currentVersion)) {
        return {
          name: 'Claude Code',
          type: 'claude-code',
          current: currentVersion,
          latest: latestVersion,
          description: 'Anthropic Claude Code CLI updates'
        };
      }
    } catch (error) {
      // Claude Code might not be installed
    }
    return null;
  }

  async checkDependencyUpdates() {
    const updates = [];
    const projectDetector = require('./project-detector');
    const projectInfo = await projectDetector.detect();

    switch (projectInfo.language) {
      case 'javascript':
      case 'typescript':
        const nodeUpdates = await this.checkNodeDependencyUpdates();
        updates.push(...nodeUpdates);
        break;
      case 'python':
        const pythonUpdates = await this.checkPythonDependencyUpdates();
        updates.push(...pythonUpdates);
        break;
      // Add other languages as needed
    }

    return updates;
  }

  async checkNodeDependencyUpdates() {
    const updates = [];
    const packagePath = path.join(process.cwd(), 'package.json');

    if (!await fs.pathExists(packagePath)) {
      return updates;
    }

    try {
      const outdated = execSync('npm outdated --json', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      if (outdated.trim()) {
        const outdatedPackages = JSON.parse(outdated);
        
        Object.entries(outdatedPackages).forEach(([name, info]) => {
          updates.push({
            name: `npm: ${name}`,
            type: 'dependency',
            current: info.current,
            latest: info.latest,
            description: `Node.js dependency update`
          });
        });
      }
    } catch (error) {
      // npm outdated returns exit code 1 when packages are outdated
      if (error.status === 1 && error.stdout) {
        try {
          const outdatedPackages = JSON.parse(error.stdout);
          Object.entries(outdatedPackages).forEach(([name, info]) => {
            updates.push({
              name: `npm: ${name}`,
              type: 'dependency',
              current: info.current,
              latest: info.latest,
              description: `Node.js dependency update`
            });
          });
        } catch (parseError) {
          // Ignore parsing errors
        }
      }
    }

    return updates;
  }

  async checkPythonDependencyUpdates() {
    const updates = [];
    // Python dependency checking would go here
    // This is a placeholder for pip-outdated or similar tools
    return updates;
  }

  async checkTemplateUpdates() {
    const updates = [];
    // Template update checking would go here
    // This would check if new versions of CLAUDE.md templates are available
    return updates;
  }

  async checkMCPUpdates() {
    const updates = [];
    const mcpManager = require('./mcp-manager');
    
    try {
      const installedServers = await mcpManager.listInstalledServers();
      
      for (const serverName of installedServers) {
        // Check for MCP server updates
        try {
          const packageName = `@modelcontextprotocol/server-${serverName}`;
          const latestVersion = execSync(`npm view ${packageName} version`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim();

          updates.push({
            name: `MCP: ${serverName}`,
            type: 'mcp',
            current: 'unknown',
            latest: latestVersion,
            description: `MCP server update available`
          });
        } catch (error) {
          // Server might not follow standard naming or might be custom
        }
      }
    } catch (error) {
      // MCP configuration might not exist
    }

    return updates;
  }

  async applyUpdate(update) {
    const spinner = ora(`Updating ${update.name}...`).start();

    try {
      switch (update.type) {
        case 'core':
          await this.updateCore(update);
          break;
        case 'claude-code':
          await this.updateClaudeCode(update);
          break;
        case 'dependency':
          await this.updateDependency(update);
          break;
        case 'mcp':
          await this.updateMCP(update);
          break;
        default:
          throw new Error(`Unknown update type: ${update.type}`);
      }

      spinner.succeed(`Updated ${update.name}`);
    } catch (error) {
      spinner.fail(`Failed to update ${update.name}: ${error.message}`);
      console.log(chalk.red(`  Error: ${error.message}`));
    }
  }

  async updateCore(update) {
    // Update UCW core - this would typically be done through npm
    execSync('npm install -g universal-claude-workflow@latest', { stdio: 'pipe' });
  }

  async updateClaudeCode(update) {
    execSync('npm install -g @anthropic-ai/claude-code@latest', { stdio: 'pipe' });
  }

  async updateDependency(update) {
    const packageName = update.name.replace('npm: ', '');
    const projectDetector = require('./project-detector');
    const projectInfo = await projectDetector.detect();
    
    const packageManager = projectInfo.packageManager || 'npm';
    
    switch (packageManager) {
      case 'npm':
        execSync(`npm install ${packageName}@latest`, { stdio: 'pipe' });
        break;
      case 'yarn':
        execSync(`yarn upgrade ${packageName}@latest`, { stdio: 'pipe' });
        break;
      case 'pnpm':
        execSync(`pnpm update ${packageName}@latest`, { stdio: 'pipe' });
        break;
    }
  }

  async updateMCP(update) {
    const serverName = update.name.replace('MCP: ', '');
    const packageName = `@modelcontextprotocol/server-${serverName}`;
    execSync(`npm install -g ${packageName}@latest`, { stdio: 'pipe' });
  }

  async showPostUpdateInstructions() {
    console.log(chalk.cyan.bold('\n📋 Post-Update Instructions:'));
    console.log(chalk.cyan('  1. Restart Claude Code to use updated components'));
    console.log(chalk.cyan('  2. Run "ucw health" to verify everything is working'));
    console.log(chalk.cyan('  3. Check for any breaking changes in the changelog'));
    console.log(chalk.cyan('  4. Update your team about the changes'));

    // Check if restart is needed
    const needsRestart = await this.checkIfRestartNeeded();
    if (needsRestart) {
      console.log(chalk.yellow.bold('\n⚠️  Restart Required:'));
      console.log(chalk.yellow('  Some updates require restarting Claude Code to take effect.'));
      console.log(chalk.yellow('  Please exit and restart Claude Code when convenient.'));
    }
  }

  async checkIfRestartNeeded() {
    // Check if any core components or MCP servers were updated
    // This is a simple check - in practice would be more sophisticated
    return true;
  }

  async showUpdateHistory() {
    console.log(chalk.blue.bold('📜 Update History\n'));

    const historyFile = path.join(process.cwd(), '.ucw-update-history.json');
    
    if (!await fs.pathExists(historyFile)) {
      console.log(chalk.yellow('No update history found.'));
      return;
    }

    try {
      const history = await fs.readJSON(historyFile);
      
      if (history.length === 0) {
        console.log(chalk.yellow('No updates recorded.'));
        return;
      }

      history.slice(-10).forEach((record, index) => {
        console.log(chalk.green(`${history.length - index}. ${record.component}`));
        console.log(chalk.gray(`   ${record.from} → ${record.to}`));
        console.log(chalk.gray(`   ${new Date(record.timestamp).toLocaleString()}`));
        if (record.description) {
          console.log(chalk.gray(`   ${record.description}`));
        }
        console.log();
      });

      if (history.length > 10) {
        console.log(chalk.gray(`... and ${history.length - 10} older updates`));
      }
    } catch (error) {
      console.log(chalk.red('Failed to read update history.'));
    }
  }

  async recordUpdate(component, fromVersion, toVersion, description = '') {
    const historyFile = path.join(process.cwd(), '.ucw-update-history.json');
    let history = [];

    if (await fs.pathExists(historyFile)) {
      try {
        history = await fs.readJSON(historyFile);
      } catch (error) {
        // Start fresh if file is corrupted
        history = [];
      }
    }

    history.push({
      component,
      from: fromVersion,
      to: toVersion,
      description,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 updates
    if (history.length > 100) {
      history = history.slice(-100);
    }

    await fs.writeJSON(historyFile, history, { spaces: 2 });
  }

  async rollback(component, version) {
    console.log(chalk.blue.bold(`⏪ Rolling back ${component} to ${version}\n`));

    const spinner = ora(`Rolling back ${component}...`).start();

    try {
      switch (component) {
        case 'claude-code':
          execSync(`npm install -g @anthropic-ai/claude-code@${version}`, { stdio: 'pipe' });
          break;
        case 'ucw':
          execSync(`npm install -g universal-claude-workflow@${version}`, { stdio: 'pipe' });
          break;
        default:
          throw new Error(`Rollback not supported for ${component}`);
      }

      spinner.succeed(`Rolled back ${component} to ${version}`);
      
      await this.recordUpdate(component, 'current', version, 'Rollback operation');
      
      console.log(chalk.green.bold('\n✅ Rollback completed!'));
      console.log(chalk.yellow('⚠️  Please restart Claude Code to use the rolled-back version.'));

    } catch (error) {
      spinner.fail(`Failed to rollback ${component}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new Updater();
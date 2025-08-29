const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class Analytics {
  constructor() {
    this.analyticsFile = path.join(process.cwd(), '.ucw-analytics.log');
    this.sessionFile = path.join(process.cwd(), '.ucw-session.json');
  }

  async show(options = {}) {
    console.log(chalk.blue.bold('📊 Universal Claude Workflow Analytics\n'));

    if (options.session) {
      await this.showSessionAnalytics();
    } else if (options.history) {
      await this.showHistoricalAnalytics();
    } else {
      await this.showOverallAnalytics();
    }

    if (options.export) {
      await this.exportAnalytics(options.export);
    }
  }

  async showSessionAnalytics() {
    const sessionData = await this.getCurrentSessionData();
    
    if (!sessionData) {
      console.log(chalk.yellow('No current session data available'));
      return;
    }

    console.log(chalk.green.bold('📈 Current Session Analytics'));
    console.log(chalk.cyan(`Session Start: ${new Date(sessionData.startTime).toLocaleString()}`));
    console.log(chalk.cyan(`Duration: ${this.formatDuration(sessionData.duration)}`));
    console.log(chalk.cyan(`Commands Used: ${sessionData.commandsUsed.length}`));
    console.log(chalk.cyan(`Files Modified: ${sessionData.filesModified.length}`));
    console.log(chalk.cyan(`Tests Run: ${sessionData.testsRun}`));
    console.log(chalk.cyan(`Build Operations: ${sessionData.buildOperations}`));

    if (sessionData.commandsUsed.length > 0) {
      console.log(chalk.green('\n🔧 Commands Used:'));
      const commandCounts = this.countItems(sessionData.commandsUsed);
      Object.entries(commandCounts).forEach(([cmd, count]) => {
        console.log(chalk.cyan(`  • ${cmd}: ${count}x`));
      });
    }

    if (sessionData.filesModified.length > 0) {
      console.log(chalk.green('\n📝 Files Modified:'));
      sessionData.filesModified.slice(0, 10).forEach(file => {
        console.log(chalk.cyan(`  • ${file}`));
      });
      if (sessionData.filesModified.length > 10) {
        console.log(chalk.gray(`  ... and ${sessionData.filesModified.length - 10} more`));
      }
    }
  }

  async showHistoricalAnalytics() {
    const historicalData = await this.getHistoricalData();
    
    if (!historicalData || historicalData.length === 0) {
      console.log(chalk.yellow('No historical data available'));
      return;
    }

    console.log(chalk.green.bold('📚 Historical Analytics (Last 30 days)'));
    
    // Session statistics
    const totalSessions = historicalData.length;
    const totalDuration = historicalData.reduce((sum, session) => sum + session.duration, 0);
    const avgDuration = totalDuration / totalSessions;
    
    console.log(chalk.cyan(`Total Sessions: ${totalSessions}`));
    console.log(chalk.cyan(`Total Time: ${this.formatDuration(totalDuration)}`));
    console.log(chalk.cyan(`Average Session: ${this.formatDuration(avgDuration)}`));

    // Command usage
    const allCommands = historicalData.flatMap(session => session.commandsUsed || []);
    const commandCounts = this.countItems(allCommands);
    const topCommands = Object.entries(commandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    if (topCommands.length > 0) {
      console.log(chalk.green('\n🏆 Top Commands:'));
      topCommands.forEach(([cmd, count], index) => {
        console.log(chalk.cyan(`  ${index + 1}. ${cmd}: ${count}x`));
      });
    }

    // File types
    const allFiles = historicalData.flatMap(session => session.filesModified || []);
    const fileExtensions = allFiles.map(file => path.extname(file)).filter(ext => ext);
    const extensionCounts = this.countItems(fileExtensions);
    const topExtensions = Object.entries(extensionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topExtensions.length > 0) {
      console.log(chalk.green('\n📁 File Types Modified:'));
      topExtensions.forEach(([ext, count]) => {
        console.log(chalk.cyan(`  ${ext}: ${count} files`));
      });
    }

    // Productivity metrics
    const totalTests = historicalData.reduce((sum, session) => sum + (session.testsRun || 0), 0);
    const totalBuilds = historicalData.reduce((sum, session) => sum + (session.buildOperations || 0), 0);
    
    console.log(chalk.green('\n🎯 Productivity Metrics:'));
    console.log(chalk.cyan(`  Tests Run: ${totalTests}`));
    console.log(chalk.cyan(`  Build Operations: ${totalBuilds}`));
    console.log(chalk.cyan(`  Files per Session: ${Math.round(allFiles.length / totalSessions)}`));
    console.log(chalk.cyan(`  Commands per Session: ${Math.round(allCommands.length / totalSessions)}`));
  }

  async showOverallAnalytics() {
    console.log(chalk.green.bold('🎯 Overall Project Analytics'));
    
    // Project structure analysis
    await this.analyzeProjectStructure();
    
    // Workflow efficiency
    await this.analyzeWorkflowEfficiency();
    
    // Usage patterns
    await this.analyzeUsagePatterns();
  }

  async analyzeProjectStructure() {
    const projectDetector = require('./project-detector');
    const projectInfo = await projectDetector.detect();
    
    console.log(chalk.green('\n🏗️  Project Structure:'));
    console.log(chalk.cyan(`  Language: ${projectInfo.language}`));
    console.log(chalk.cyan(`  Framework: ${projectInfo.framework || 'None'}`));
    console.log(chalk.cyan(`  Package Manager: ${projectInfo.packageManager || 'None'}`));
    console.log(chalk.cyan(`  Testing Framework: ${projectInfo.testingFramework || 'None'}`));
    console.log(chalk.cyan(`  Build System: ${projectInfo.buildSystem || 'None'}`));

    // Count files by type
    const files = await this.getProjectFiles();
    const fileCounts = this.analyzeFileTypes(files);
    
    console.log(chalk.green('\n📊 File Distribution:'));
    Object.entries(fileCounts).slice(0, 10).forEach(([type, count]) => {
      console.log(chalk.cyan(`  ${type}: ${count} files`));
    });
  }

  async analyzeWorkflowEfficiency() {
    console.log(chalk.green('\n⚡ Workflow Efficiency:'));
    
    // Check UCW configuration completeness
    const configScore = await this.calculateConfigurationScore();
    console.log(chalk.cyan(`  Configuration Score: ${configScore}%`));
    
    // Automation usage
    const automationScore = await this.calculateAutomationScore();
    console.log(chalk.cyan(`  Automation Score: ${automationScore}%`));
    
    // Tool integration
    const integrationScore = await this.calculateIntegrationScore();
    console.log(chalk.cyan(`  Integration Score: ${integrationScore}%`));

    // Overall efficiency
    const overallScore = Math.round((configScore + automationScore + integrationScore) / 3);
    const efficiency = this.getEfficiencyLabel(overallScore);
    console.log(chalk.cyan(`  Overall Efficiency: ${overallScore}% (${efficiency})`));
  }

  async analyzeUsagePatterns() {
    const historicalData = await this.getHistoricalData();
    
    if (!historicalData || historicalData.length === 0) {
      console.log(chalk.yellow('\n📈 Usage Patterns: No data available'));
      return;
    }

    console.log(chalk.green('\n📈 Usage Patterns:'));
    
    // Peak usage hours
    const hourlyUsage = this.analyzeHourlyUsage(historicalData);
    const peakHours = Object.entries(hourlyUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    console.log(chalk.cyan(`  Peak Hours:`));
    peakHours.forEach(([hour, count]) => {
      console.log(chalk.cyan(`    ${hour}:00 - ${count} sessions`));
    });

    // Session length trends
    const avgSessionLength = historicalData.reduce((sum, s) => sum + s.duration, 0) / historicalData.length;
    console.log(chalk.cyan(`  Average Session Length: ${this.formatDuration(avgSessionLength)}`));

    // Most productive days
    const dailyUsage = this.analyzeDailyUsage(historicalData);
    const topDays = Object.entries(dailyUsage)
      .sort(([,a], [,b]) => b.sessions - a.sessions)
      .slice(0, 3);

    console.log(chalk.cyan(`  Most Active Days:`));
    topDays.forEach(([day, data]) => {
      console.log(chalk.cyan(`    ${day}: ${data.sessions} sessions, ${this.formatDuration(data.totalTime)}`));
    });
  }

  async getCurrentSessionData() {
    try {
      if (!await fs.pathExists(this.sessionFile)) {
        return null;
      }
      return await fs.readJSON(this.sessionFile);
    } catch (error) {
      return null;
    }
  }

  async getHistoricalData() {
    try {
      if (!await fs.pathExists(this.analyticsFile)) {
        return [];
      }
      
      const logData = await fs.readFile(this.analyticsFile, 'utf8');
      const lines = logData.split('\n').filter(line => line.trim());
      
      // Parse session data from logs
      const sessions = [];
      let currentSession = null;
      
      lines.forEach(line => {
        if (line.includes('UCW Session Started')) {
          if (currentSession) {
            sessions.push(currentSession);
          }
          currentSession = {
            startTime: this.parseTimestamp(line),
            commandsUsed: [],
            filesModified: [],
            testsRun: 0,
            buildOperations: 0
          };
        } else if (line.includes('UCW Session Ended')) {
          if (currentSession) {
            currentSession.endTime = this.parseTimestamp(line);
            currentSession.duration = currentSession.endTime - currentSession.startTime;
            sessions.push(currentSession);
            currentSession = null;
          }
        }
        // Parse other events from logs...
      });
      
      return sessions.filter(s => s.endTime); // Only completed sessions
    } catch (error) {
      return [];
    }
  }

  async getProjectFiles() {
    const glob = require('glob');
    return new Promise((resolve) => {
      glob('**/*', { 
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        nodir: true 
      }, (err, files) => {
        resolve(err ? [] : files);
      });
    });
  }

  analyzeFileTypes(files) {
    const counts = {};
    files.forEach(file => {
      const ext = path.extname(file) || 'no extension';
      counts[ext] = (counts[ext] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  }

  async calculateConfigurationScore() {
    let score = 0;
    const checks = [
      { file: 'CLAUDE.md', points: 20 },
      { file: '.claude/settings.json', points: 20 },
      { file: '.claude/commands', points: 15 },
      { file: '.claude/agents', points: 15 },
      { file: '.mcp.json', points: 15 },
      { file: '.gitignore', points: 10 },
      { file: 'README.md', points: 5 }
    ];

    for (const check of checks) {
      if (await fs.pathExists(path.join(process.cwd(), check.file))) {
        score += check.points;
      }
    }

    return score;
  }

  async calculateAutomationScore() {
    let score = 0;
    
    // Check for hooks
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      const settings = await fs.readJSON(settingsPath);
      if (settings.hooks && Object.keys(settings.hooks).length > 0) {
        score += 40;
      }
    }

    // Check for CI/CD
    const ciFiles = ['.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile', '.circleci'];
    for (const file of ciFiles) {
      if (await fs.pathExists(path.join(process.cwd(), file))) {
        score += 30;
        break;
      }
    }

    // Check for testing automation
    const packagePath = path.join(process.cwd(), 'package.json');
    if (await fs.pathExists(packagePath)) {
      const pkg = await fs.readJSON(packagePath);
      if (pkg.scripts && (pkg.scripts.test || pkg.scripts['test:watch'])) {
        score += 30;
      }
    }

    return score;
  }

  async calculateIntegrationScore() {
    let score = 0;
    
    // Check MCP servers
    const mcpPath = path.join(process.cwd(), '.mcp.json');
    if (await fs.pathExists(mcpPath)) {
      const mcp = await fs.readJSON(mcpPath);
      const serverCount = Object.keys(mcp.mcpServers || {}).length;
      score += Math.min(serverCount * 20, 60);
    }

    // Check for external integrations
    const integrations = ['sentry', 'github', 'slack', 'aws'];
    // This would check for actual integration configurations
    score += 40; // Placeholder

    return score;
  }

  countItems(items) {
    return items.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {});
  }

  analyzeHourlyUsage(sessions) {
    const hourCounts = {};
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return hourCounts;
  }

  analyzeDailyUsage(sessions) {
    const dailyCounts = {};
    sessions.forEach(session => {
      const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dailyCounts[day]) {
        dailyCounts[day] = { sessions: 0, totalTime: 0 };
      }
      dailyCounts[day].sessions += 1;
      dailyCounts[day].totalTime += session.duration || 0;
    });
    return dailyCounts;
  }

  parseTimestamp(line) {
    // Extract timestamp from log line
    const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    return match ? new Date(match[1]).getTime() : Date.now();
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getEfficiencyLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  async exportAnalytics(format) {
    const data = {
      session: await this.getCurrentSessionData(),
      historical: await this.getHistoricalData(),
      configuration: {
        score: await this.calculateConfigurationScore(),
        automation: await this.calculateAutomationScore(),
        integration: await this.calculateIntegrationScore()
      }
    };

    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'json') {
      const filename = `ucw-analytics-${timestamp}.json`;
      await fs.writeJSON(filename, data, { spaces: 2 });
      console.log(chalk.green(`\n📄 Analytics exported to: ${filename}`));
    } else if (format === 'csv') {
      const filename = `ucw-analytics-${timestamp}.csv`;
      const csv = this.convertToCSV(data);
      await fs.writeFile(filename, csv);
      console.log(chalk.green(`\n📄 Analytics exported to: ${filename}`));
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion for session data
    let csv = 'Date,Duration,Commands,Files,Tests,Builds\n';
    
    if (data.historical) {
      data.historical.forEach(session => {
        csv += `${new Date(session.startTime).toISOString().split('T')[0]},`;
        csv += `${session.duration || 0},`;
        csv += `${session.commandsUsed?.length || 0},`;
        csv += `${session.filesModified?.length || 0},`;
        csv += `${session.testsRun || 0},`;
        csv += `${session.buildOperations || 0}\n`;
      });
    }
    
    return csv;
  }

  // Session tracking methods (called by hooks)
  async startSession() {
    const sessionData = {
      startTime: Date.now(),
      commandsUsed: [],
      filesModified: [],
      testsRun: 0,
      buildOperations: 0
    };
    
    await fs.writeJSON(this.sessionFile, sessionData);
  }

  async endSession() {
    try {
      const sessionData = await fs.readJSON(this.sessionFile);
      sessionData.endTime = Date.now();
      sessionData.duration = sessionData.endTime - sessionData.startTime;
      
      // Archive session data
      await this.archiveSession(sessionData);
      
      // Clean up session file
      await fs.remove(this.sessionFile);
    } catch (error) {
      // Session file might not exist
    }
  }

  async track(eventName, properties = {}) {
    // Simple event tracking - log to analytics file
    try {
      const event = {
        event: eventName,
        properties,
        timestamp: new Date().toISOString()
      };
      
      // Append to analytics log
      const logEntry = JSON.stringify(event) + '\n';
      await fs.appendFile(this.analyticsFile, logEntry);
    } catch (error) {
      // Silently fail - don't break the main flow for analytics
      console.debug('Analytics tracking failed:', error.message);
    }
  }

  async archiveSession(sessionData) {
    const archiveLine = `${new Date().toISOString()}: Session completed - Duration: ${this.formatDuration(sessionData.duration)}, Commands: ${sessionData.commandsUsed.length}, Files: ${sessionData.filesModified.length}\n`;
    await fs.appendFile(this.analyticsFile, archiveLine);
  }
}

module.exports = new Analytics();
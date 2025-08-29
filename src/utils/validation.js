const { execSync } = require('child_process');
const semver = require('semver');

class Validator {
  validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Check Node.js version
    const nodeVersion = process.version;
    if (!semver.gte(nodeVersion, '18.0.0')) {
      errors.push(
        `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`
      );
    }

    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      if (!semver.gte(npmVersion, '9.0.0')) {
        warnings.push(
          `npm version ${npmVersion} is old. Consider upgrading to npm 9 or higher for better performance.`
        );
      }
    } catch (error) {
      errors.push('npm is not installed or not accessible.');
    }

    // Check git availability
    try {
      execSync('git --version', { stdio: 'pipe' });
    } catch (error) {
      warnings.push('Git is not installed. Some features may not work properly.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  checkClaudeCode() {
    try {
      execSync('claude --version', { stdio: 'pipe' });
      return { installed: true };
    } catch (error) {
      return { installed: false };
    }
  }

  async validateProjectStructure(projectRoot) {
    const issues = [];

    // Check write permissions
    try {
      const fs = require('fs-extra');
      const path = require('path');
      const testFile = path.join(projectRoot, '.ucw-test');
      await fs.writeFile(testFile, 'test');
      await fs.remove(testFile);
    } catch (error) {
      issues.push('No write permissions in project directory');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  checkDiskSpace(projectRoot) {
    try {
      const fs = require('fs');
      fs.statSync(projectRoot); // Check if path exists and is accessible
      // Basic check - in production would use more sophisticated disk space checking
      return { sufficient: true, available: 'Unknown' };
    } catch (error) {
      return { sufficient: false, available: 'Unknown' };
    }
  }
}

const validator = new Validator();

module.exports = {
  validateEnvironment: validator.validateEnvironment.bind(validator),
  checkClaudeCode: validator.checkClaudeCode.bind(validator),
  validateProjectStructure: validator.validateProjectStructure.bind(validator),
  checkDiskSpace: validator.checkDiskSpace.bind(validator)
};

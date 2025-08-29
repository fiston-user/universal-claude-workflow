const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

class ProjectDetector {
  async detect(projectRoot = process.cwd()) {
    const detection = {
      type: 'unknown',
      framework: null,
      language: null,
      packageManager: null,
      testingFramework: null,
      buildSystem: null,
      hasGit: false,
      hasDocker: false,
      structure: {}
    };

    // Check for package.json (Node.js ecosystem)
    if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
      const packageJson = await fs.readJSON(path.join(projectRoot, 'package.json'));
      const nodeDetection = await this.detectNodeProject(packageJson, projectRoot);
      Object.assign(detection, nodeDetection);
    }

    // Check for Python projects
    const pythonDetection = await this.detectPythonProject(projectRoot);
    if (pythonDetection.type !== 'unknown') {
      Object.assign(detection, pythonDetection);
    }

    // Check for Go projects
    const goDetection = await this.detectGoProject(projectRoot);
    if (goDetection.type !== 'unknown') {
      Object.assign(detection, goDetection);
    }

    // Check for Rust projects
    const rustDetection = await this.detectRustProject(projectRoot);
    if (rustDetection.type !== 'unknown') {
      Object.assign(detection, rustDetection);
    }

    // Check for Java projects
    const javaDetection = await this.detectJavaProject(projectRoot);
    if (javaDetection.type !== 'unknown') {
      Object.assign(detection, javaDetection);
    }

    // Check for PHP projects
    const phpDetection = await this.detectPhpProject(projectRoot);
    if (phpDetection.type !== 'unknown') {
      Object.assign(detection, phpDetection);
    }

    // Common checks
    detection.hasGit = await fs.pathExists(path.join(projectRoot, '.git'));
    detection.hasDocker = await fs.pathExists(path.join(projectRoot, 'Dockerfile')) || 
                         await fs.pathExists(path.join(projectRoot, 'docker-compose.yml'));

    // Detect package managers
    detection.packageManager = await this.detectPackageManager(projectRoot);

    return detection;
  }

  async detectNodeProject(packageJson, projectRoot) {
    const detection = {
      type: 'node',
      language: 'javascript',
      framework: null,
      testingFramework: null,
      buildSystem: null
    };

    // Check for TypeScript
    if (await fs.pathExists(path.join(projectRoot, 'tsconfig.json')) || 
        packageJson.devDependencies?.typescript || 
        packageJson.dependencies?.typescript) {
      detection.language = 'typescript';
    }

    // Detect frameworks
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.react) {
      detection.framework = 'react';
      if (deps.next) detection.framework = 'nextjs';
      if (deps.gatsby) detection.framework = 'gatsby';
    } else if (deps.vue) {
      detection.framework = 'vue';
      if (deps.nuxt) detection.framework = 'nuxt';
    } else if (deps.angular || deps['@angular/core']) {
      detection.framework = 'angular';
    } else if (deps.express) {
      detection.framework = 'express';
    } else if (deps.koa) {
      detection.framework = 'koa';
    } else if (deps.fastify) {
      detection.framework = 'fastify';
    } else if (deps.nestjs || deps['@nestjs/core']) {
      detection.framework = 'nestjs';
    } else if (deps.svelte) {
      detection.framework = 'svelte';
      if (deps['@sveltejs/kit']) detection.framework = 'sveltekit';
    }

    // Detect testing frameworks
    if (deps.jest) {
      detection.testingFramework = 'jest';
    } else if (deps.vitest) {
      detection.testingFramework = 'vitest';
    } else if (deps.mocha) {
      detection.testingFramework = 'mocha';
    } else if (deps.cypress) {
      detection.testingFramework = 'cypress';
    } else if (deps.playwright) {
      detection.testingFramework = 'playwright';
    }

    // Detect build systems
    if (await fs.pathExists(path.join(projectRoot, 'vite.config.js')) || 
        await fs.pathExists(path.join(projectRoot, 'vite.config.ts'))) {
      detection.buildSystem = 'vite';
    } else if (await fs.pathExists(path.join(projectRoot, 'webpack.config.js'))) {
      detection.buildSystem = 'webpack';
    } else if (deps.rollup) {
      detection.buildSystem = 'rollup';
    } else if (deps.parcel) {
      detection.buildSystem = 'parcel';
    }

    return detection;
  }

  async detectPythonProject(projectRoot) {
    const detection = {
      type: 'unknown',
      language: 'python',
      framework: null,
      testingFramework: null,
      buildSystem: null
    };

    // Check for Python files
    const pythonFiles = glob.sync('**/*.py', { cwd: projectRoot, ignore: 'node_modules/**' });
    if (pythonFiles.length === 0) return { type: 'unknown' };

    detection.type = 'python';

    // Check for requirements files
    if (await fs.pathExists(path.join(projectRoot, 'requirements.txt'))) {
      const requirements = await fs.readFile(path.join(projectRoot, 'requirements.txt'), 'utf8');
      
      if (requirements.includes('django')) {
        detection.framework = 'django';
      } else if (requirements.includes('flask')) {
        detection.framework = 'flask';
      } else if (requirements.includes('fastapi')) {
        detection.framework = 'fastapi';
      }

      if (requirements.includes('pytest')) {
        detection.testingFramework = 'pytest';
      } else if (requirements.includes('unittest')) {
        detection.testingFramework = 'unittest';
      }
    }

    // Check for pyproject.toml
    if (await fs.pathExists(path.join(projectRoot, 'pyproject.toml'))) {
      detection.buildSystem = 'poetry';
    } else if (await fs.pathExists(path.join(projectRoot, 'setup.py'))) {
      detection.buildSystem = 'setuptools';
    }

    return detection;
  }

  async detectGoProject(projectRoot) {
    const detection = {
      type: 'unknown',
      language: 'go',
      framework: null,
      testingFramework: 'go test',
      buildSystem: 'go build'
    };

    if (await fs.pathExists(path.join(projectRoot, 'go.mod'))) {
      detection.type = 'go';

      // Check for common Go frameworks
      const goMod = await fs.readFile(path.join(projectRoot, 'go.mod'), 'utf8');
      
      if (goMod.includes('gin-gonic/gin')) {
        detection.framework = 'gin';
      } else if (goMod.includes('gorilla/mux')) {
        detection.framework = 'gorilla';
      } else if (goMod.includes('labstack/echo')) {
        detection.framework = 'echo';
      } else if (goMod.includes('fiber')) {
        detection.framework = 'fiber';
      }
    }

    return detection;
  }

  async detectRustProject(projectRoot) {
    const detection = {
      type: 'unknown',
      language: 'rust',
      framework: null,
      testingFramework: 'cargo test',
      buildSystem: 'cargo'
    };

    if (await fs.pathExists(path.join(projectRoot, 'Cargo.toml'))) {
      detection.type = 'rust';

      // Check for common Rust frameworks
      const cargoToml = await fs.readFile(path.join(projectRoot, 'Cargo.toml'), 'utf8');
      
      if (cargoToml.includes('actix-web')) {
        detection.framework = 'actix-web';
      } else if (cargoToml.includes('warp')) {
        detection.framework = 'warp';
      } else if (cargoToml.includes('rocket')) {
        detection.framework = 'rocket';
      } else if (cargoToml.includes('axum')) {
        detection.framework = 'axum';
      }
    }

    return detection;
  }

  async detectJavaProject(projectRoot) {
    const detection = {
      type: 'unknown',
      language: 'java',
      framework: null,
      testingFramework: null,
      buildSystem: null
    };

    // Check for Maven
    if (await fs.pathExists(path.join(projectRoot, 'pom.xml'))) {
      detection.type = 'java';
      detection.buildSystem = 'maven';

      const pomXml = await fs.readFile(path.join(projectRoot, 'pom.xml'), 'utf8');
      
      if (pomXml.includes('spring-boot')) {
        detection.framework = 'spring-boot';
      } else if (pomXml.includes('spring')) {
        detection.framework = 'spring';
      }

      if (pomXml.includes('junit')) {
        detection.testingFramework = 'junit';
      }
    }

    // Check for Gradle
    if (await fs.pathExists(path.join(projectRoot, 'build.gradle')) || 
        await fs.pathExists(path.join(projectRoot, 'build.gradle.kts'))) {
      detection.type = 'java';
      detection.buildSystem = 'gradle';
    }

    return detection;
  }

  async detectPhpProject(projectRoot) {
    const detection = {
      type: 'unknown',
      language: 'php',
      framework: null,
      testingFramework: null,
      buildSystem: null
    };

    if (await fs.pathExists(path.join(projectRoot, 'composer.json'))) {
      detection.type = 'php';

      const composerJson = await fs.readJSON(path.join(projectRoot, 'composer.json'));
      const deps = { ...composerJson.require, ...composerJson['require-dev'] };

      if (deps['laravel/framework']) {
        detection.framework = 'laravel';
      } else if (deps['symfony/framework-bundle']) {
        detection.framework = 'symfony';
      } else if (deps['cakephp/cakephp']) {
        detection.framework = 'cakephp';
      }

      if (deps['phpunit/phpunit']) {
        detection.testingFramework = 'phpunit';
      }

      detection.buildSystem = 'composer';
    }

    return detection;
  }

  async detectPackageManager(projectRoot) {
    if (await fs.pathExists(path.join(projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    } else if (await fs.pathExists(path.join(projectRoot, 'yarn.lock'))) {
      return 'yarn';
    } else if (await fs.pathExists(path.join(projectRoot, 'package-lock.json'))) {
      return 'npm';
    } else if (await fs.pathExists(path.join(projectRoot, 'poetry.lock'))) {
      return 'poetry';
    } else if (await fs.pathExists(path.join(projectRoot, 'Pipfile'))) {
      return 'pipenv';
    } else if (await fs.pathExists(path.join(projectRoot, 'Cargo.lock'))) {
      return 'cargo';
    } else if (await fs.pathExists(path.join(projectRoot, 'composer.lock'))) {
      return 'composer';
    }
    return null;
  }
}

module.exports = new ProjectDetector();
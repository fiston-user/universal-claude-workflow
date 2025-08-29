// Jest is available globally
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const projectDetector = require('../src/project-detector');

jest.mock('fs-extra');
jest.mock('glob');

describe('ProjectDetector', () => {
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detect', () => {
    test('should detect Node.js React project', async () => {
      // Mock package.json exists and contains React
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('package.json')) return Promise.resolve(true);
        if (filePath.endsWith('.git')) return Promise.resolve(true);
        if (filePath.endsWith('tsconfig.json')) return Promise.resolve(false);
        return Promise.resolve(false);
      });

      fs.readJSON = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('package.json')) {
          return Promise.resolve({
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0'
            },
            devDependencies: {
              jest: '^29.0.0',
              '@testing-library/react': '^13.0.0'
            },
            scripts: {
              test: 'jest',
              build: 'webpack --mode production'
            }
          });
        }
        return Promise.resolve({});
      });

      fs.readFile = jest.fn().mockResolvedValue('');

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result).toEqual(expect.objectContaining({
        type: 'node',
        language: 'javascript',
        framework: 'react',
        testingFramework: 'jest',
        hasGit: true,
        packageManager: null // No lock files in this test
      }));
    });

    test('should detect TypeScript Next.js project', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('package.json')) return Promise.resolve(true);
        if (filePath.endsWith('tsconfig.json')) return Promise.resolve(true);
        if (filePath.endsWith('package-lock.json')) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      fs.readJSON = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('package.json')) {
          return Promise.resolve({
            dependencies: {
              next: '^13.0.0',
              react: '^18.0.0',
              typescript: '^4.9.0'
            },
            devDependencies: {
              vitest: '^0.25.0'
            }
          });
        }
        return Promise.resolve({});
      });

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result).toEqual(expect.objectContaining({
        type: 'node',
        language: 'typescript',
        framework: 'nextjs',
        testingFramework: 'vitest',
        packageManager: 'npm'
      }));
    });

    test('should detect Python Django project', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('package.json')) return Promise.resolve(false);
        if (filePath.endsWith('requirements.txt')) return Promise.resolve(true);
        if (filePath.endsWith('pyproject.toml')) return Promise.resolve(false);
        return Promise.resolve(false);
      });

      fs.readFile = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('requirements.txt')) {
          return Promise.resolve('Django==4.1.0\npytest==7.2.0\npsycopg2==2.9.0');
        }
        return Promise.resolve('');
      });

      // Mock Python files exist
      glob.sync = jest.fn().mockReturnValue(['app.py', 'models.py', 'views.py']);

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result).toEqual(expect.objectContaining({
        type: 'python',
        language: 'python',
        framework: 'django',
        testingFramework: 'pytest'
      }));
    });

    test('should detect Go project', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('go.mod')) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      fs.readFile = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('go.mod')) {
          return Promise.resolve(`module example.com/myapp

go 1.19

require (
    github.com/gin-gonic/gin v1.9.0
)
`);
        }
        return Promise.resolve('');
      });

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result).toEqual(expect.objectContaining({
        type: 'go',
        language: 'go',
        framework: 'gin',
        testingFramework: 'go test',
        buildSystem: 'go build'
      }));
    });

    test('should detect Rust project', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('Cargo.toml')) return Promise.resolve(true);
        if (filePath.endsWith('Cargo.lock')) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      fs.readFile = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('Cargo.toml')) {
          return Promise.resolve(`[package]
name = "my-app"
version = "0.1.0"

[dependencies]
actix-web = "4"
tokio = { version = "1", features = ["full"] }
`);
        }
        return Promise.resolve('');
      });

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result).toEqual(expect.objectContaining({
        type: 'rust',
        language: 'rust',
        framework: 'actix-web',
        testingFramework: 'cargo test',
        buildSystem: 'cargo',
        packageManager: 'cargo'
      }));
    });

    test('should detect Java Maven project', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('pom.xml')) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      fs.readFile = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('pom.xml')) {
          return Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
<project>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
    </dependency>
  </dependencies>
</project>
`);
        }
        return Promise.resolve('');
      });

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result).toEqual(expect.objectContaining({
        type: 'java',
        language: 'java',
        framework: 'spring-boot',
        testingFramework: 'junit',
        buildSystem: 'maven'
      }));
    });

    test('should handle unknown project type', async () => {
      fs.pathExists = jest.fn().mockResolvedValue(false);
      glob.sync = jest.fn().mockReturnValue([]);

      const result = await projectDetector.detect(mockProjectRoot);

      expect(result.type).toBe('unknown');
    });
  });

  describe('detectPackageManager', () => {
    test('should detect pnpm', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('pnpm-lock.yaml')) return Promise.resolve(true);
        return Promise.resolve(false);
      });

      const result = await projectDetector.detectPackageManager(mockProjectRoot);
      expect(result).toBe('pnpm');
    });

    test('should detect yarn', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('yarn.lock')) return Promise.resolve(true);
        if (filePath.endsWith('pnpm-lock.yaml')) return Promise.resolve(false);
        return Promise.resolve(false);
      });

      const result = await projectDetector.detectPackageManager(mockProjectRoot);
      expect(result).toBe('yarn');
    });

    test('should detect npm', async () => {
      fs.pathExists = jest.fn().mockImplementation((filePath) => {
        if (filePath.endsWith('package-lock.json')) return Promise.resolve(true);
        if (filePath.endsWith('yarn.lock')) return Promise.resolve(false);
        if (filePath.endsWith('pnpm-lock.yaml')) return Promise.resolve(false);
        return Promise.resolve(false);
      });

      const result = await projectDetector.detectPackageManager(mockProjectRoot);
      expect(result).toBe('npm');
    });

    test('should return null if no package manager detected', async () => {
      fs.pathExists = jest.fn().mockResolvedValue(false);

      const result = await projectDetector.detectPackageManager(mockProjectRoot);
      expect(result).toBe(null);
    });
  });
});
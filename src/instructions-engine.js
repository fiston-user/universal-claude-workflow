const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const chalk = require('chalk');

/**
 * Smart Instructions Engine - Context-aware AI guidance system
 * Provides intelligent, adaptive instructions based on project context and user behavior
 */
class InstructionsEngine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.instructionsDir = path.join(projectRoot, '.ucw', 'instructions');
    this.userPreferences = {};
    this.contextCache = new Map();
    this.adaptationHistory = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await this.ensureDirectoryStructure();
    await this.loadUserPreferences();
    await this.loadInstructionTemplates();
    
    this.initialized = true;
  }

  /**
   * Get context-aware instructions for a specific task or workflow stage
   */
  async getInstructions(type, context = {}) {
    if (!this.initialized) await this.initialize();

    const cacheKey = this.generateCacheKey(type, context);
    
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey);
    }

    const instructions = await this.generateContextualInstructions(type, context);
    this.contextCache.set(cacheKey, instructions);
    
    return instructions;
  }

  /**
   * Generate intelligent, contextual instructions
   */
  async generateContextualInstructions(type, context) {
    const baseTemplate = await this.loadInstructionTemplate(type);
    if (!baseTemplate) {
      throw new Error(`No instruction template found for type: ${type}`);
    }

    const adaptedInstructions = await this.adaptInstructionsToContext(baseTemplate, context);
    const personalizedInstructions = await this.personalizeInstructions(adaptedInstructions, context);
    
    return personalizedInstructions;
  }

  /**
   * Adapt instructions based on project context, tech stack, and patterns
   */
  async adaptInstructionsToContext(template, context) {
    const adaptation = {
      ...template,
      contextualVariants: [],
      adaptations: []
    };

    // Tech stack specific adaptations
    if (context.techStack) {
      const techStackAdaptations = await this.getTechStackAdaptations(template, context.techStack);
      adaptation.steps = this.mergeSteps(adaptation.steps, techStackAdaptations.steps);
      adaptation.adaptations.push({ type: 'techStack', changes: techStackAdaptations.changes });
    }

    // Project complexity adaptations
    if (context.complexity) {
      const complexityAdaptations = await this.getComplexityAdaptations(template, context.complexity);
      adaptation.steps = this.applyComplexityFilters(adaptation.steps, complexityAdaptations);
      adaptation.adaptations.push({ type: 'complexity', level: context.complexity });
    }

    // Framework specific adaptations
    if (context.framework) {
      const frameworkAdaptations = await this.getFrameworkAdaptations(template, context.framework);
      adaptation.preSteps = [...(adaptation.preSteps || []), ...frameworkAdaptations.preSteps];
      adaptation.postSteps = [...(adaptation.postSteps || []), ...frameworkAdaptations.postSteps];
      adaptation.adaptations.push({ type: 'framework', framework: context.framework });
    }

    // Team size adaptations
    if (context.teamSize) {
      const teamAdaptations = await this.getTeamSizeAdaptations(template, context.teamSize);
      adaptation.collaborationSteps = teamAdaptations.collaborationSteps;
      adaptation.adaptations.push({ type: 'teamSize', size: context.teamSize });
    }

    return adaptation;
  }

  /**
   * Personalize instructions based on user preferences and history
   */
  async personalizeInstructions(instructions, context) {
    const personalized = { ...instructions };

    // Adjust verbosity based on user preference
    if (this.userPreferences.verbosity === 'minimal') {
      personalized.steps = this.simplifySteps(personalized.steps);
    } else if (this.userPreferences.verbosity === 'detailed') {
      personalized.steps = this.enhanceSteps(personalized.steps);
    }

    // Adjust based on user's skill level
    if (this.userPreferences.skillLevel === 'beginner') {
      personalized.explanations = await this.addDetailedExplanations(personalized.steps);
      personalized.safetyChecks = await this.addExtraSafetyChecks(personalized.steps);
    } else if (this.userPreferences.skillLevel === 'expert') {
      personalized.steps = this.removeRedundantSteps(personalized.steps);
      personalized.shortcuts = await this.addExpertShortcuts(personalized.steps);
    }

    // Add user's preferred tools and workflows
    if (this.userPreferences.preferredTools) {
      personalized.toolRecommendations = this.getToolRecommendations(
        instructions.type,
        this.userPreferences.preferredTools
      );
    }

    return personalized;
  }

  /**
   * Learn from instruction execution and adapt future recommendations
   */
  async recordInstructionFeedback(instructionId, feedback) {
    const record = {
      instructionId,
      feedback,
      timestamp: Date.now(),
      context: feedback.context
    };

    this.adaptationHistory.push(record);

    // Analyze patterns and update instruction templates
    await this.analyzeAndAdaptTemplates(record);

    // Save adaptation history
    await this.saveAdaptationHistory();
  }

  /**
   * Get intelligent recommendations for next steps
   */
  async getNextStepRecommendations(currentContext) {
    const recommendations = [];

    // Analyze current state
    const analysis = await this.analyzeCurrentState(currentContext);
    
    // Generate context-aware recommendations
    if (analysis.hasFailingTests) {
      recommendations.push({
        type: 'fix_tests',
        priority: 'high',
        description: 'Fix failing tests before proceeding',
        estimatedTime: '15-30 minutes'
      });
    }

    if (analysis.hasUncommittedChanges) {
      recommendations.push({
        type: 'commit_changes',
        priority: 'medium',
        description: 'Commit current changes to preserve progress',
        estimatedTime: '2-5 minutes'
      });
    }

    if (analysis.needsRefactoring) {
      recommendations.push({
        type: 'refactor',
        priority: 'low',
        description: 'Consider refactoring to improve code quality',
        estimatedTime: '30-60 minutes'
      });
    }

    // Add predictive recommendations based on patterns
    const predictiveRecs = await this.generatePredictiveRecommendations(currentContext);
    recommendations.push(...predictiveRecs);

    return this.prioritizeRecommendations(recommendations);
  }

  // Private helper methods

  async ensureDirectoryStructure() {
    const dirs = [
      this.instructionsDir,
      path.join(this.instructionsDir, 'templates'),
      path.join(this.instructionsDir, 'adaptations'),
      path.join(this.instructionsDir, 'user')
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }

    // Create default instruction templates
    await this.createDefaultTemplates();
  }

  async createDefaultTemplates() {
    const templates = {
      'create-feature': {
        name: 'Create Feature',
        description: 'Create a new feature following best practices',
        type: 'development',
        steps: [
          {
            name: 'Analysis',
            description: 'Analyze requirements and plan implementation',
            substeps: [
              'Review feature requirements',
              'Identify dependencies and interfaces',
              'Plan implementation approach',
              'Estimate effort and complexity'
            ]
          },
          {
            name: 'Design',
            description: 'Design the feature architecture',
            substeps: [
              'Design component structure',
              'Define data models and APIs',
              'Plan testing strategy',
              'Review design with team (if applicable)'
            ]
          },
          {
            name: 'Implementation',
            description: 'Implement the feature with TDD approach',
            substeps: [
              'Write failing tests first',
              'Implement minimum viable functionality',
              'Refactor for quality and maintainability',
              'Add comprehensive error handling'
            ]
          },
          {
            name: 'Testing',
            description: 'Thoroughly test the feature',
            substeps: [
              'Run and verify unit tests',
              'Perform integration testing',
              'Test edge cases and error scenarios',
              'Verify performance requirements'
            ]
          },
          {
            name: 'Documentation',
            description: 'Document the feature',
            substeps: [
              'Update API documentation',
              'Add code comments where needed',
              'Update user documentation',
              'Record architecture decisions'
            ]
          }
        ],
        adaptable: true,
        contextual: true
      },

      'debug-issue': {
        name: 'Debug Issue',
        description: 'Systematic approach to debugging issues',
        type: 'maintenance',
        steps: [
          {
            name: 'Reproduce',
            description: 'Reproduce the issue consistently',
            substeps: [
              'Gather issue details and context',
              'Create minimal reproduction case',
              'Document reproduction steps',
              'Verify issue exists in current codebase'
            ]
          },
          {
            name: 'Investigate',
            description: 'Investigate root cause',
            substeps: [
              'Review recent changes and logs',
              'Use debugging tools and breakpoints',
              'Trace execution flow',
              'Identify root cause hypothesis'
            ]
          },
          {
            name: 'Fix',
            description: 'Implement and test fix',
            substeps: [
              'Design minimal fix approach',
              'Implement fix with tests',
              'Verify fix resolves issue',
              'Test for regression issues'
            ]
          },
          {
            name: 'Validate',
            description: 'Validate complete resolution',
            substeps: [
              'Test original reproduction case',
              'Run full test suite',
              'Deploy to staging environment',
              'Monitor for any side effects'
            ]
          }
        ],
        adaptable: true,
        contextual: true
      }
    };

    for (const [name, template] of Object.entries(templates)) {
      const templateFile = path.join(this.instructionsDir, 'templates', `${name}.yaml`);
      if (!(await fs.pathExists(templateFile))) {
        await fs.writeFile(templateFile, yaml.stringify(template));
      }
    }
  }

  async loadInstructionTemplate(type) {
    const templateFile = path.join(this.instructionsDir, 'templates', `${type}.yaml`);
    
    if (await fs.pathExists(templateFile)) {
      const content = await fs.readFile(templateFile, 'utf8');
      return yaml.parse(content);
    }
    
    return null;
  }

  generateCacheKey(type, context) {
    const contextHash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(context))
      .digest('hex')
      .substring(0, 8);
    
    return `${type}_${contextHash}`;
  }

  async getTechStackAdaptations(template, techStack) {
    // Return tech stack specific modifications
    return {
      steps: [],
      changes: [`Adapted for ${techStack.primary} environment`]
    };
  }

  async getComplexityAdaptations(template, complexity) {
    const adaptations = {
      simple: { skipSteps: ['Documentation'], addChecks: false },
      medium: { skipSteps: [], addChecks: true },
      complex: { skipSteps: [], addChecks: true, addSteps: ['Architecture Review'] },
      enterprise: { skipSteps: [], addChecks: true, addSteps: ['Architecture Review', 'Security Review'] }
    };

    return adaptations[complexity] || adaptations.medium;
  }

  async loadUserPreferences() {
    const prefsFile = path.join(this.instructionsDir, 'user', 'preferences.yaml');
    
    if (await fs.pathExists(prefsFile)) {
      const content = await fs.readFile(prefsFile, 'utf8');
      this.userPreferences = yaml.parse(content);
    } else {
      // Default preferences
      this.userPreferences = {
        verbosity: 'standard',
        skillLevel: 'intermediate',
        preferredTools: [],
        adaptationLevel: 'medium'
      };
      
      await fs.writeFile(prefsFile, yaml.stringify(this.userPreferences));
    }
  }

  mergeSteps(originalSteps, additionalSteps) {
    // Intelligent step merging logic
    return [...originalSteps, ...additionalSteps];
  }

  applyComplexityFilters(steps, adaptations) {
    let filteredSteps = steps.filter(step => !adaptations.skipSteps.includes(step.name));
    
    if (adaptations.addSteps) {
      // Add additional steps for complex projects
      const additionalSteps = adaptations.addSteps.map(stepName => ({
        name: stepName,
        description: `Additional ${stepName.toLowerCase()} step`,
        substeps: [`Perform ${stepName.toLowerCase()}`]
      }));
      
      filteredSteps = [...filteredSteps, ...additionalSteps];
    }
    
    return filteredSteps;
  }

  async analyzeCurrentState(context) {
    // Analyze current project state to provide intelligent recommendations
    return {
      hasFailingTests: false, // placeholder
      hasUncommittedChanges: false, // placeholder
      needsRefactoring: false // placeholder
    };
  }

  async generatePredictiveRecommendations(context) {
    // Use ML/pattern recognition to suggest next steps
    return []; // placeholder
  }

  prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async saveAdaptationHistory() {
    const historyFile = path.join(this.instructionsDir, 'adaptation-history.json');
    await fs.writeJSON(historyFile, this.adaptationHistory, { spaces: 2 });
  }

  // Placeholder methods for future implementation
  async getFrameworkAdaptations() { return { preSteps: [], postSteps: [] }; }
  async getTeamSizeAdaptations() { return { collaborationSteps: [] }; }
  simplifySteps(steps) { return steps; }
  enhanceSteps(steps) { return steps; }
  async addDetailedExplanations(steps) { return {}; }
  async addExtraSafetyChecks(steps) { return {}; }
  removeRedundantSteps(steps) { return steps; }
  async addExpertShortcuts(steps) { return {}; }
  getToolRecommendations() { return []; }
  async analyzeAndAdaptTemplates() {}
  async loadInstructionTemplates() {}
}

module.exports = new InstructionsEngine();
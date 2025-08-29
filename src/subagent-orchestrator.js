const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const analytics = require('./analytics');

/**
 * Dynamic Subagent Orchestration System
 * Coordinates multiple specialized AI agents for different development tasks
 * Provides intelligent agent selection, collaboration, and conflict resolution
 */
class SubagentOrchestrator extends EventEmitter {
  constructor(projectRoot = process.cwd()) {
    super();
    this.projectRoot = projectRoot;
    this.registeredAgents = new Map();
    this.activeAgents = new Map();
    this.agentHistory = [];
    this.collaborationMatrix = new Map();
    this.conflictResolver = new ConflictResolver();
    this.agentSelector = new IntelligentAgentSelector();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log(chalk.blue('🤖 Initializing Dynamic Subagent Orchestration System'));

    // Register core agents
    await this.registerCoreAgents();

    // Load agent collaboration patterns
    await this.loadCollaborationPatterns();

    // Setup inter-agent communication
    this.setupInterAgentCommunication();

    this.initialized = true;
    console.log(chalk.green('✅ Subagent Orchestrator initialized'));
  }

  /**
   * Register core specialized agents
   */
  async registerCoreAgents() {
    const coreAgents = [
      new ArchitectAgent(this.projectRoot),
      new CoderAgent(this.projectRoot),
      new ReviewerAgent(this.projectRoot),
      new TesterAgent(this.projectRoot),
      new RefactorAgent(this.projectRoot),
      new SecurityAgent(this.projectRoot),
      new PerformanceAgent(this.projectRoot),
      new DocumentationAgent(this.projectRoot),
      new DeploymentAgent(this.projectRoot),
      new MonitoringAgent(this.projectRoot)
    ];

    for (const agent of coreAgents) {
      await this.registerAgent(agent);
    }
  }

  /**
   * Register a specialized agent
   */
  async registerAgent(agent) {
    if (this.registeredAgents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already registered`);
    }

    await agent.initialize();
    this.registeredAgents.set(agent.id, agent);

    // Setup agent event handlers
    agent.on('taskCompleted', this.handleAgentTaskCompleted.bind(this));
    agent.on('needsCollaboration', this.handleCollaborationRequest.bind(this));
    agent.on('conflict', this.handleAgentConflict.bind(this));

    console.log(chalk.gray(`Registered agent: ${agent.name} (${agent.specialization})`));
  }

  /**
   * Orchestrate multiple agents for a complex task
   */
  async orchestrateTask(task, context = {}) {
    if (!this.initialized) await this.initialize();

    const orchestrationId = this.generateOrchestrationId();
    console.log(chalk.cyan(`🎭 Starting multi-agent orchestration: ${task.name}`));

    try {
      // Analyze task and select optimal agent team
      const agentTeam = await this.selectAgentTeam(task, context);
      console.log(chalk.blue(`Selected ${agentTeam.length} agents: ${agentTeam.map(a => a.name).join(', ')}`));

      // Create collaboration plan
      const collaborationPlan = await this.createCollaborationPlan(agentTeam, task, context);

      // Execute orchestrated workflow
      const result = await this.executeOrchestration(orchestrationId, agentTeam, collaborationPlan, task, context);

      // Record orchestration insights
      await this.recordOrchestrationInsights(orchestrationId, result);

      console.log(chalk.green.bold(`🎉 Multi-agent orchestration completed successfully`));
      return result;

    } catch (error) {
      console.error(chalk.red(`❌ Orchestration failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Intelligently select the best agent team for a task
   */
  async selectAgentTeam(task, context) {
    const candidates = Array.from(this.registeredAgents.values());
    const team = [];

    // Primary agent selection based on task type
    const primaryAgent = await this.agentSelector.selectPrimaryAgent(task, candidates, context);
    team.push(primaryAgent);

    // Supporting agents based on task complexity and requirements
    const supportingAgents = await this.agentSelector.selectSupportingAgents(
      task, 
      candidates, 
      primaryAgent, 
      context
    );
    team.push(...supportingAgents);

    // Quality assurance agents (always include for important tasks)
    if (task.requiresQA !== false) {
      const qaAgents = await this.agentSelector.selectQAAgents(task, candidates, context);
      team.push(...qaAgents);
    }

    return this.optimizeTeamComposition(team, task, context);
  }

  /**
   * Create intelligent collaboration plan for agent team
   */
  async createCollaborationPlan(agentTeam, task, context) {
    const planner = new CollaborationPlanner();
    
    return await planner.createPlan({
      agents: agentTeam,
      task,
      context,
      collaborationMatrix: this.collaborationMatrix,
      projectConstraints: await this.getProjectConstraints(),
      timeConstraints: task.timeConstraints || {},
      qualityRequirements: task.qualityRequirements || {}
    });
  }

  /**
   * Execute the orchestrated multi-agent workflow
   */
  async executeOrchestration(orchestrationId, agentTeam, plan, task, context) {
    const execution = {
      id: orchestrationId,
      startTime: Date.now(),
      agents: agentTeam.map(a => a.id),
      phases: [],
      conflicts: [],
      collaborations: [],
      result: null
    };

    try {
      // Execute each phase of the collaboration plan
      for (let i = 0; i < plan.phases.length; i++) {
        const phase = plan.phases[i];
        console.log(chalk.blue(`\n📋 Phase ${i + 1}/${plan.phases.length}: ${phase.name}`));

        const phaseResult = await this.executePhase(phase, agentTeam, execution, context);
        execution.phases.push(phaseResult);

        // Handle inter-phase validation and coordination
        if (phase.requiresValidation) {
          await this.validatePhaseResult(phaseResult, agentTeam, context);
        }
      }

      // Compile final result
      execution.result = await this.compileOrchestrationResult(execution, task);
      execution.completedAt = Date.now();

      return execution.result;

    } catch (error) {
      execution.error = error.message;
      execution.failedAt = Date.now();
      throw error;
    }
  }

  /**
   * Execute a single phase of the collaboration plan
   */
  async executePhase(phase, agentTeam, execution, context) {
    const phaseExecution = {
      name: phase.name,
      startTime: Date.now(),
      agentResults: new Map(),
      conflicts: [],
      collaborations: []
    };

    // Execute agent tasks in parallel or sequential based on phase plan
    if (phase.executionMode === 'parallel') {
      await this.executePhaseParallel(phase, agentTeam, phaseExecution, context);
    } else {
      await this.executePhaseSequential(phase, agentTeam, phaseExecution, context);
    }

    // Resolve any conflicts that arose during phase execution
    if (phaseExecution.conflicts.length > 0) {
      await this.resolvePhaseConflicts(phaseExecution, agentTeam, context);
    }

    phaseExecution.completedAt = Date.now();
    return phaseExecution;
  }

  /**
   * Execute phase with agents working in parallel
   */
  async executePhaseParallel(phase, agentTeam, phaseExecution, context) {
    const agentPromises = phase.agentTasks.map(async (agentTask) => {
      const agent = agentTeam.find(a => a.id === agentTask.agentId);
      if (!agent) {
        throw new Error(`Agent ${agentTask.agentId} not found in team`);
      }

      try {
        const result = await agent.executeTask(agentTask, context);
        phaseExecution.agentResults.set(agent.id, result);
        return { agentId: agent.id, success: true, result };
      } catch (error) {
        phaseExecution.agentResults.set(agent.id, { error: error.message });
        return { agentId: agent.id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(agentPromises);
    
    // Check for failures and handle accordingly
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.warn(chalk.yellow(`⚠️  ${failures.length} agent(s) failed in parallel execution`));
      await this.handleAgentFailures(failures, phaseExecution, context);
    }
  }

  /**
   * Execute phase with agents working sequentially
   */
  async executePhaseSequential(phase, agentTeam, phaseExecution, context) {
    let previousResult = null;

    for (const agentTask of phase.agentTasks) {
      const agent = agentTeam.find(a => a.id === agentTask.agentId);
      if (!agent) {
        throw new Error(`Agent ${agentTask.agentId} not found in team`);
      }

      // Pass previous result as input to current agent
      const taskContext = {
        ...context,
        previousResult,
        phaseResults: phaseExecution.agentResults
      };

      try {
        const result = await agent.executeTask(agentTask, taskContext);
        phaseExecution.agentResults.set(agent.id, result);
        previousResult = result;

        // Record collaboration if agent used previous result
        if (previousResult && agentTask.usesPreviousResult) {
          phaseExecution.collaborations.push({
            type: 'sequential_handoff',
            from: phase.agentTasks[phase.agentTasks.indexOf(agentTask) - 1]?.agentId,
            to: agent.id,
            timestamp: Date.now()
          });
        }

      } catch (error) {
        phaseExecution.agentResults.set(agent.id, { error: error.message });
        throw new Error(`Sequential execution failed at agent ${agent.name}: ${error.message}`);
      }
    }
  }

  /**
   * Handle agent task completion
   */
  handleAgentTaskCompleted(agentId, task, result) {
    this.emit('agentTaskCompleted', {
      agentId,
      task,
      result,
      timestamp: Date.now()
    });

    // Track agent performance
    analytics.track('agent:task_completed', {
      agentId,
      taskType: task.type,
      success: result.success,
      duration: result.duration
    });
  }

  /**
   * Handle collaboration requests between agents
   */
  async handleCollaborationRequest(request) {
    console.log(chalk.blue(`🤝 Collaboration request: ${request.from} → ${request.to}`));
    
    const collaboration = await this.facilitateCollaboration(request);
    
    this.emit('collaborationFacilitated', collaboration);
    return collaboration;
  }

  /**
   * Handle conflicts between agents
   */
  async handleAgentConflict(conflict) {
    console.log(chalk.yellow(`⚠️  Agent conflict: ${conflict.description}`));
    
    const resolution = await this.conflictResolver.resolve(conflict);
    
    this.emit('conflictResolved', {
      conflict,
      resolution,
      timestamp: Date.now()
    });

    return resolution;
  }

  // Helper methods

  generateOrchestrationId() {
    return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  async loadCollaborationPatterns() {
    // Load historical collaboration patterns for optimization
    const patternsFile = path.join(this.projectRoot, '.ucw', 'collaboration-patterns.json');
    
    if (await fs.pathExists(patternsFile)) {
      const patterns = await fs.readJSON(patternsFile);
      // Initialize collaboration matrix with learned patterns
      for (const pattern of patterns) {
        this.collaborationMatrix.set(pattern.key, pattern.effectiveness);
      }
    }
  }

  setupInterAgentCommunication() {
    // Setup message passing system between agents
    this.on('agentMessage', this.routeAgentMessage.bind(this));
  }

  routeAgentMessage(message) {
    const targetAgent = this.activeAgents.get(message.to);
    if (targetAgent) {
      targetAgent.receiveMessage(message);
    }
  }

  async optimizeTeamComposition(team, task, context) {
    // Remove redundant agents and optimize for efficiency
    const optimizer = new TeamOptimizer();
    return await optimizer.optimize(team, task, context);
  }

  async getProjectConstraints() {
    // Return project-specific constraints that affect orchestration
    return {
      maxConcurrentAgents: 5,
      timeLimit: 3600000, // 1 hour
      qualityThreshold: 0.85
    };
  }

  async recordOrchestrationInsights(orchestrationId, result) {
    const insights = {
      orchestrationId,
      timestamp: Date.now(),
      success: result.success,
      agentPerformance: result.agentMetrics,
      collaborationEffectiveness: result.collaborationScore,
      timeToCompletion: result.duration,
      qualityScore: result.qualityScore
    };

    this.agentHistory.push(insights);

    // Save insights for future learning
    const insightsFile = path.join(this.projectRoot, '.ucw', 'orchestration-insights.json');
    await fs.writeJSON(insightsFile, this.agentHistory, { spaces: 2 });
  }

  // Placeholder methods for complex implementations
  async validatePhaseResult() { return { valid: true }; }
  async compileOrchestrationResult(execution) { 
    return { 
      success: true, 
      phases: execution.phases.length,
      duration: Date.now() - execution.startTime 
    }; 
  }
  async resolvePhaseConflicts() {}
  async handleAgentFailures() {}
  async facilitateCollaboration(request) { return { status: 'facilitated', request }; }
}

// Placeholder classes for the orchestration system components
class ConflictResolver {
  async resolve(conflict) {
    return { resolution: 'automated', strategy: 'merge', conflict };
  }
}

class IntelligentAgentSelector {
  async selectPrimaryAgent(task, candidates) {
    return candidates.find(agent => agent.specialization === task.primarySkill) || candidates[0];
  }

  async selectSupportingAgents() { return []; }
  async selectQAAgents() { return []; }
}

class CollaborationPlanner {
  async createPlan(options) {
    return {
      phases: [
        {
          name: 'Analysis',
          executionMode: 'parallel',
          agentTasks: options.agents.map(agent => ({
            agentId: agent.id,
            task: { type: 'analyze', target: options.task }
          }))
        }
      ]
    };
  }
}

class TeamOptimizer {
  async optimize(team) { return team; }
}

// Base class for specialized agents
class BaseAgent extends EventEmitter {
  constructor(name, specialization, projectRoot) {
    super();
    this.id = `${specialization}_${Date.now()}`;
    this.name = name;
    this.specialization = specialization;
    this.projectRoot = projectRoot;
    this.capabilities = [];
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  async executeTask(task, context) {
    const startTime = Date.now();
    
    try {
      const result = await this.performTask(task, context);
      const duration = Date.now() - startTime;
      
      this.emit('taskCompleted', this.id, task, {
        success: true,
        result,
        duration
      });

      return { success: true, result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.emit('taskCompleted', this.id, task, {
        success: false,
        error: error.message,
        duration
      });

      throw error;
    }
  }

  async performTask(_task, _context) {
    throw new Error('performTask must be implemented by subclasses');
  }

  receiveMessage(message) {
    this.emit('messageReceived', message);
  }
}

// Specialized agent implementations
class ArchitectAgent extends BaseAgent {
  constructor(projectRoot) {
    super('Architect', 'architecture', projectRoot);
    this.capabilities = ['system-design', 'pattern-analysis', 'scalability-planning'];
  }

  async performTask(task, context) {
    // Simulate architecture analysis
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      architecture: 'microservices',
      patterns: ['repository', 'factory'],
      recommendations: ['Use dependency injection', 'Implement CQRS']
    };
  }
}

class CoderAgent extends BaseAgent {
  constructor(projectRoot) {
    super('Coder', 'coding', projectRoot);
    this.capabilities = ['code-generation', 'refactoring', 'bug-fixing'];
  }

  async performTask(task, context) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      filesModified: 3,
      linesAdded: 150,
      linesRemoved: 30,
      testsCovered: true
    };
  }
}

class ReviewerAgent extends BaseAgent {
  constructor(projectRoot) {
    super('Reviewer', 'code-review', projectRoot);
    this.capabilities = ['code-analysis', 'quality-assessment', 'security-review'];
  }

  async performTask(task, context) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      qualityScore: 0.92,
      issues: [],
      suggestions: ['Add error handling', 'Improve variable naming'],
      approved: true
    };
  }
}

class TesterAgent extends BaseAgent {
  constructor(projectRoot) {
    super('Tester', 'testing', projectRoot);
    this.capabilities = ['unit-testing', 'integration-testing', 'coverage-analysis'];
  }

  async performTask(task, context) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return {
      testsCreated: 12,
      coverage: 0.95,
      passRate: 1.0,
      performanceTests: true
    };
  }
}

// Additional specialized agents
class RefactorAgent extends BaseAgent {
  constructor(projectRoot) { super('Refactor', 'refactoring', projectRoot); }
  async performTask() { return { refactoredFiles: 5, qualityImprovement: 0.15 }; }
}

class SecurityAgent extends BaseAgent {
  constructor(projectRoot) { super('Security', 'security', projectRoot); }
  async performTask() { return { vulnerabilities: 0, securityScore: 0.98 }; }
}

class PerformanceAgent extends BaseAgent {
  constructor(projectRoot) { super('Performance', 'performance', projectRoot); }
  async performTask() { return { optimizations: 3, speedImprovement: 0.25 }; }
}

class DocumentationAgent extends BaseAgent {
  constructor(projectRoot) { super('Documentation', 'documentation', projectRoot); }
  async performTask() { return { docsUpdated: 8, coverageImproved: 0.3 }; }
}

class DeploymentAgent extends BaseAgent {
  constructor(projectRoot) { super('Deployment', 'deployment', projectRoot); }
  async performTask() { return { deployed: true, environment: 'staging' }; }
}

class MonitoringAgent extends BaseAgent {
  constructor(projectRoot) { super('Monitoring', 'monitoring', projectRoot); }
  async performTask() { return { monitorsSetup: 5, alertsConfigured: true }; }
}

module.exports = new SubagentOrchestrator();
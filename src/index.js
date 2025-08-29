const installer = require('./installer');
const projectDetector = require('./project-detector');
const templateEngine = require('./template-engine');
const hooksManager = require('./hooks-manager');
const commandsManager = require('./commands-manager');
const agentsManager = require('./agents-manager');
const mcpManager = require('./mcp-manager');
const health = require('./health');
const analytics = require('./analytics');

module.exports = {
  installer,
  projectDetector,
  templateEngine,
  hooksManager,
  commandsManager,
  agentsManager,
  mcpManager,
  health,
  analytics
};
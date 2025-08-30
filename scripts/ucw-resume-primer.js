#!/usr/bin/env node
/*
  UCW Resume Primer
  - Finds in-progress (or most recent) feature work under .ucw/features
  - Updates or appends a concise "UCW Resume" section in CLAUDE.md
  - Prints a short summary to stdout for immediate visibility
*/

const fs = require('fs-extra');
const path = require('path');

async function readJSONSafe(p) {
  try {
    return await fs.readJSON(p);
  } catch (_) {
    return null;
  }
}

async function fileExists(p) {
  try {
    return await fs.pathExists(p);
  } catch (_) {
    return false;
  }
}

async function getFeatureCandidates(featuresDir) {
  const items = await fs.readdir(featuresDir).catch(() => []);
  const candidates = [];
  for (const item of items) {
    const dir = path.join(featuresDir, item);
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat || !stat.isDirectory()) continue;

    const plan = path.join(dir, 'plan.md');
    const tasks = path.join(dir, 'tasks.md');
    const context = path.join(dir, 'context.md');
    const research = path.join(dir, 'research.md');
    const hasPlan = await fileExists(plan);
    const hasTasks = await fileExists(tasks);
    if (!hasPlan && !hasTasks) continue;
    const anchor = hasTasks ? tasks : plan;
    const mstat = await fs.stat(anchor).catch(() => null);
    candidates.push({ slug: item, plan, tasks, context, research, mtimeMs: mstat ? mstat.mtimeMs : 0 });
  }
  return candidates.sort((a,b) => b.mtimeMs - a.mtimeMs);
}

function parseFirstUncheckedTask(planContent) {
  const lines = planContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
      return trimmed.replace(/^[-*] \[ \]\s*/, '');
    }
  }
  return null;
}

function parseNextParentTask(tasksContent) {
  // Find first unchecked top-level parent task in the format "- [ ] N. Title"
  const lines = tasksContent.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*[-*] \[ \] \d+\.\s+(.*)$/);
    if (m) return m[1].trim();
  }
  return null;
}

function upsertResumeSection(claudeContent, section) {
  const startMarker = '## UCW Resume';
  const lines = claudeContent.split(/\r?\n/);
  const startIdx = lines.findIndex(l => l.trim() === startMarker);
  if (startIdx === -1) {
    // Append
    return claudeContent.trimEnd() + '\n\n' + section + '\n';
  }
  // Find next header or end
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { endIdx = i; break; }
  }
  const before = lines.slice(0, startIdx).join('\n');
  const after = lines.slice(endIdx).join('\n');
  return [before, section, after].filter(Boolean).join('\n\n') + '\n';
}

(async () => {
  const cwd = process.cwd();
  const featuresIndex = path.join(cwd, '.ucw', 'features', 'index.json');
  const featuresDir = path.join(cwd, '.ucw', 'features');
  const claudePath = path.join(cwd, 'CLAUDE.md');

  let chosen = null;
  let metaName = null;
  let metaStatus = null;
  let featuresMeta = await readJSONSafe(featuresIndex);
  if (featuresMeta && Array.isArray(featuresMeta.features)) {
    // Prefer in-progress, else most recent
    const inProgress = featuresMeta.features
      .filter(f => f.status === 'in-progress')
      .sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    const pool = inProgress.length ? inProgress : featuresMeta.features.sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    if (pool.length) {
      const pick = pool[0];
      metaName = pick.name || pick.slug;
      metaStatus = pick.status;
      chosen = {
        slug: pick.slug,
        plan: path.join(featuresDir, pick.slug, 'plan.md'),
        context: path.join(featuresDir, pick.slug, 'context.md'),
        research: path.join(featuresDir, pick.slug, 'research.md')
      };
    }
  }

  if (!chosen && await fileExists(featuresDir)) {
    const candidates = await getFeatureCandidates(featuresDir);
    if (candidates.length) chosen = candidates[0];
    // If no existing index, synthesize one from candidates
    if ((!featuresMeta || !Array.isArray(featuresMeta.features)) && candidates.length) {
      featuresMeta = { features: [] };
      for (const c of candidates) {
        const entry = { slug: c.slug, name: c.slug, status: 'in-progress', lastUpdated: Date.now() };
        featuresMeta.features.push(entry);
      }
      await fs.ensureDir(path.dirname(featuresIndex));
      await fs.writeJSON(featuresIndex, featuresMeta, { spaces: 2 });
    }
  }

  if (!chosen) {
    // Nothing to do; keep silent to avoid noise
    process.exit(0);
  }

  let planSnippet = '';
  let tasksSnippet = '';
  try {
    const planContent = await fs.readFile(chosen.plan, 'utf8');
    const nextTask = parseFirstUncheckedTask(planContent);
    planSnippet = nextTask ? `Next plan item: ${nextTask}` : 'All plan items appear completed (no unchecked items found).';
  } catch (_) {}

  try {
    if (chosen.tasks && await fileExists(chosen.tasks)) {
      const tasksContent = await fs.readFile(chosen.tasks, 'utf8');
      const nextParent = parseNextParentTask(tasksContent);
      if (nextParent) tasksSnippet = `Next parent task: ${nextParent}`;
    }
  } catch (_) {}

  const section = [
    '## UCW Resume',
    '',
    metaName ? `Feature: ${metaName} (${chosen.slug})${metaStatus ? ` — ${metaStatus}` : ''}` : `Feature: ${chosen.slug}`,
    `Plan: ${path.relative(cwd, chosen.plan)}`,
    chosen.tasks ? `Tasks: ${path.relative(cwd, chosen.tasks)}` : undefined,
    `Context: ${path.relative(cwd, chosen.context)}`,
    `Research: ${path.relative(cwd, chosen.research)}`,
    tasksSnippet ? `\n${tasksSnippet}` : '',
    !tasksSnippet && planSnippet ? `\n${planSnippet}` : '',
    '',
    'Tip: Use /resume-feature to continue from the next unchecked item.'
  ].filter(Boolean).join('\n');

  let claudeContent = '';
  if (await fileExists(claudePath)) {
    claudeContent = await fs.readFile(claudePath, 'utf8');
  } else {
    claudeContent = '# Project Context\n\n';
  }
  const updated = upsertResumeSection(claudeContent, section);
  await fs.writeFile(claudePath, updated);

  // Also print a concise summary to stdout
  console.log(`[UCW] Resume: ${metaName || chosen.slug}`);
  if (tasksSnippet) console.log(`[UCW] ${tasksSnippet}`);
  else if (planSnippet) console.log(`[UCW] ${planSnippet}`);
})();

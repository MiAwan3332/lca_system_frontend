const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');
const root = path.resolve(__dirname, '../src');
let count = 0;
function walk(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
  const file = path.join(dir, item.name);
  if (item.isDirectory()) { walk(file); continue; }
  if (!file.endsWith('.js') || file.endsWith('.test.js') || file === path.join(root, 'utlls/accessRequests.js')) continue;
  const source = fs.readFileSync(file, 'utf8');
  const tree = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  if (tree.program.body.some((node) => node.type === 'ImportDeclaration' && node.specifiers.some((item) => item.local.name === 'fetch'))) continue;
  let found = false;
  function visit(node) { if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && node.callee?.name === 'fetch') found = true;
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  } visit(tree.program);
  if (!found) continue;
  let module = path.relative(path.dirname(file), path.join(root, 'utlls/accessRequests')).replaceAll('\\', '/');
  if (!module.startsWith('.')) module = './' + module;
  fs.writeFileSync(file, `import { accessFetch as fetch } from '${module}';\n` + source); count++;
} }
walk(root); console.log(JSON.stringify({ mechanicallyUpdatedFetchModules: count }));

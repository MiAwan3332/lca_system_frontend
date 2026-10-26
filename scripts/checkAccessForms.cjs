const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');
const root = path.resolve(__dirname, '../src');
const failures = [];
let modules = 0;
function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  callback(node);
  for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach((item) => visit(item, callback)); else if (value && typeof value === 'object') visit(value, callback);
}
function walk(directory) { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
  const file = path.join(directory, entry.name);
  if (entry.isDirectory()) { walk(file); continue; }
  if (!file.endsWith('.js') || file.endsWith('.test.js')) continue;
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const exempt = /^Pages\/(Roles|Permissions|VerifySlip)\//.test(relative) || ['Pages/Login.js', 'Components/AccessFormControl.js', 'Components/AccessForm.js', 'Components/AccessInputs.js', 'utlls/accessForms.js', 'utlls/accessRequests.js'].includes(relative);
  if (exempt) continue;
  const tree = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }); modules++;
  const hasFetchAdapter = tree.program.body.some((node) => node.type === 'ImportDeclaration' && node.source.value.endsWith('accessRequests') && node.specifiers.some((item) => item.local.name === 'fetch'));
  visit(tree.program, (node) => {
    if (node.type === 'ImportDeclaration' && node.source.value === 'formik' && node.specifiers.some((item) => ['useFormik', 'Formik'].includes(item.imported?.name))) failures.push(`${relative}: use the permission-aware form adapter`);
    if (node.type === 'ImportDeclaration' && node.source.value === '@chakra-ui/react' && node.specifiers.some((item) => ['FormControl', 'Input', 'Select', 'Textarea', 'Checkbox', 'Switch'].includes(item.imported?.name))) failures.push(`${relative}: use the shared access-aware controls`);
    if (node.type === 'CallExpression' && node.callee?.name === 'fetch' && !hasFetchAdapter) failures.push(`${relative}: use the scoped fetch adapter`);
  });
} }
walk(root);
if (failures.length) { console.error([...new Set(failures)].join('\n')); process.exitCode = 1; }
else console.log(JSON.stringify({ accessFormModulesChecked: modules, failures: 0 }));

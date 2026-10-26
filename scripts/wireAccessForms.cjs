// Mechanical import migration only; application behavior lives in the shared adapters.
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');
const root = path.resolve(__dirname, '../src');
const files = [];
function walk(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
  const full = path.join(dir, item.name); if (item.isDirectory()) walk(full); else if (item.name.endsWith('.js') && !item.name.endsWith('.test.js')) files.push(full);
} }
walk(path.join(root, 'Pages')); walk(path.join(root, 'Components'));
let changed = 0;
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (/^Pages\/(Roles|Permissions|VerifySlip)\//.test(relative) || ['Pages/Login.js', 'Components/AccessFormControl.js', 'Components/AccessForm.js', 'Components/AccessInputs.js'].includes(relative)) continue;
  let source = fs.readFileSync(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const edits = [], imports = [];
  function relocate(declaration, name, replacement, target) {
    const specifier = declaration.specifiers.find((item) => item.imported?.name === name);
    if (!specifier) return;
    const next = declaration.specifiers[declaration.specifiers.indexOf(specifier) + 1];
    const previous = declaration.specifiers[declaration.specifiers.indexOf(specifier) - 1];
    const start = next ? specifier.start : previous ? previous.end : declaration.start;
    const end = next ? next.start : previous ? specifier.end : declaration.end;
    edits.push({ start, end, text: '' });
    let module = path.relative(path.dirname(file), path.join(root, target)).replaceAll('\\', '/').replace(/\.js$/, '');
    if (!module.startsWith('.')) module = './' + module;
    imports.push(`import ${replacement} from '${module}';`);
  }
  for (const node of ast.program.body) if (node.type === 'ImportDeclaration') {
    if (node.source.value === '@chakra-ui/react') {
      const names = new Set(['Input', 'Textarea', 'Select', 'Checkbox', 'Switch', 'Radio', 'RadioGroup', 'NumberInput', 'NumberInputField']);
      const selected = node.specifiers.filter((item) => names.has(item.imported?.name));
      if (selected.length) {
        const remaining = node.specifiers.filter((item) => !selected.includes(item));
        const kept = remaining.map((item) => source.slice(item.start, item.end)).join(', ');
        edits.push({ start: node.start, end: node.end, text: kept ? `import { ${kept} } from '@chakra-ui/react';` : '' });
        let module = path.relative(path.dirname(file), path.join(root, 'Components/AccessInputs')).replaceAll('\\', '/');
        if (!module.startsWith('.')) module = './' + module;
        imports.push(`import { ${selected.map((item) => source.slice(item.start, item.end)).join(', ')} } from '${module}';`);
      } else relocate(node, 'FormControl', 'FormControl', 'Components/AccessFormControl.js');
    }
    if (node.source.value === 'formik') relocate(node, 'useFormik', `{ ${/Update|Edit/.test(path.basename(file)) ? 'useAccessUpdateFormik' : 'useAccessCreateFormik'} as useFormik }`, 'utlls/accessForms.js');
  }
  let hasForm = false;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier') {
      const attributes = node.attributes;
      const attr = (name) => attributes.find((item) => item.type === 'JSXAttribute' && item.name.name === name);
      const controls = ['Input', 'Textarea', 'Select', 'Checkbox', 'Switch', 'Radio', 'RadioGroup', 'NumberInput', 'NumberInputField', 'AccessNativeInput'];
      if (controls.includes(node.name.name) && !attr('name') && !attr('permissionField')) {
        const expression = (attr('value') || attr('isChecked'))?.value?.expression;
        let field;
        if (expression?.type === 'MemberExpression' && !expression.computed &&
          (['form', 'values'].includes(expression.object?.name) || expression.object?.property?.name === 'values')) field = expression.property?.name;
        const binding = { paymentMethod: 'payment_method', selectedTeacher: 'assignments', selectedCourse: 'assignments',
          templateName: 'name', templateBody: 'body', templateDescription: 'description', isActive: 'is_active',
          phone: 'phone', email: 'email', name: 'name', description: 'description', body: 'body', process: 'process' };
        if (expression?.type === 'Identifier') field = binding[expression.name];
        if (!field) {
          const handler = attr('onChange')?.value?.expression;
          const calls = [];
          const findCalls = (value) => { if (!value || typeof value !== 'object') return;
            if (value.type === 'CallExpression' && value.callee?.property?.name === 'setFieldValue') calls.push(value.arguments[0]);
            for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(findCalls); else if (child && typeof child === 'object') findCalls(child);
          }; findCalls(handler);
          if (calls.length === 1) field = calls[0]?.value || calls[0]?.quasis?.[0]?.value?.cooked?.split(/[.[\]]/)[0];
        }
        if (field) edits.push({ start: node.name.end, end: node.name.end, text: ` permissionField="${field}"` });
      }
      if (node.name.name === 'AccessForm' && /Export|View|History|Detail/.test(path.basename(file)) && !attr('permissionMode')) {
        edits.push({ start: node.name.end, end: node.name.end, text: ' permissionMode="read"' });
      }
    }
    if (node.type === 'JSXElement' && node.openingElement.name.type === 'JSXIdentifier' && ['form', 'ModalContent', 'input'].includes(node.openingElement.name.name)) {
      const opening = node.openingElement.name, closing = node.closingElement?.name;
      const name = opening.name === 'input' ? 'AccessNativeInput' : 'AccessForm';
      edits.push({ start: opening.start, end: opening.end, text: opening.name === 'ModalContent' ? 'AccessForm component={ModalContent}' : name });
      if (closing) edits.push({ start: closing.start, end: closing.end, text: name });
      if (opening.name === 'input') {
        let module = path.relative(path.dirname(file), path.join(root, 'Components/AccessInputs')).replaceAll('\\', '/');
        if (!module.startsWith('.')) module = './' + module;
        const statement = `import { NativeInput as AccessNativeInput } from '${module}';`;
        if (!imports.includes(statement)) imports.push(statement);
      } else hasForm = true;
    }
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit); else if (child && typeof child === 'object') visit(child);
    }
  }
  visit(ast.program);
  if (hasForm) {
    let module = path.relative(path.dirname(file), path.join(root, 'Components/AccessForm')).replaceAll('\\', '/');
    if (!module.startsWith('.')) module = './' + module;
    imports.push(`import AccessForm from '${module}';`);
  }
  if (!edits.length) continue;
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  source = imports.join('\n') + '\n' + source;
  parse(source, { sourceType: 'module', plugins: ['jsx'] });
  fs.writeFileSync(file, source); changed++;
}
console.log(JSON.stringify({ mechanicallyUpdatedModules: changed }));

const sourcePaths = [
  'DoodleFunTests/NativeBridgeTests.swift', 'DoodleFunTests/NativeGameplayTests.swift',
  'DoodleFunUITests/DoodleFunUITests.swift', 'DoodleFunUITests/ActivityCatalogUITests.swift',
  'DoodleFunUITests/DrawingRecoveryUITests.swift', 'DoodleFunUITests/TracingGestureUITests.swift',
];

export function nativeTestSourcePaths({withoutGameplay = false} = {}) {
  return sourcePaths.filter(file => !withoutGameplay || !file.endsWith('/NativeGameplayTests.swift'));
}

// These Swift test files use top-level classes, an unindented closing brace,
// and directly declared methods indented four spaces (or one tab). This is a
// source index for that convention, not a general Swift parser. Helpers and
// base classes without test methods are deliberately not selectable suites.
export function indexNativeTests(sources) {
  const declarations = new Map();
  for (const {file, source} of sources) {
    const target = file.split('/')[0];
    const classes = declarations.get(target) ?? new Map();
    declarations.set(target, classes);
    const pattern = /^(?:(?:final|public|internal)\s+)*class\s+([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)[^\n{]*\{[^\S\n]*\r?\n([\s\S]*?)^}/gm;
    for (const match of source.matchAll(pattern)) {
      const [, name, base, body] = match;
      if (classes.has(name)) throw new Error(`Duplicate native test class: ${target}/${name}`);
      const methods = new Set([...body.matchAll(/^(?: {4}|\t)func\s+(test[A-Za-z0-9_]*)\s*\(\s*\)/gm)].map(method => method[1]));
      classes.set(name, {base, methods});
    }
  }
  const index = new Map();
  for (const [target, classes] of declarations) {
    const inheritsXCTest = (name, visited = new Set()) => {
      if (name === 'XCTestCase' || name === 'XCTest.XCTestCase') return true;
      if (visited.has(name) || !classes.has(name)) return false;
      visited.add(name);
      return inheritsXCTest(classes.get(name).base, visited);
    };
    const suites = new Map([...classes].filter(([name, value]) => value.methods.size && inheritsXCTest(name))
      .map(([name, value]) => [name, value.methods]));
    if (suites.size) index.set(target, suites);
  }
  return index;
}

export function validateNativeTestSelection(selection, index) {
  if (typeof selection !== 'string' || !selection) throw new Error('A native test target/class/method is required.');
  const parts = selection.split('/');
  if (parts.length < 1 || parts.length > 3 || parts.some((part, position) =>
    !(position === 2 ? /^[A-Za-z_]\w*(?:\(\))?$/ : /^[A-Za-z_]\w*$/).test(part))) {
    throw new Error(`Invalid native test selection: ${selection}`);
  }
  const [target, suite, rawMethod] = parts;
  const classes = index.get(target);
  if (!classes) throw new Error(`Unknown native test target: ${target}`);
  if (suite && !classes.has(suite)) throw new Error(`Unknown or excluded native test class: ${target}/${suite}`);
  const method = rawMethod?.replace(/\(\)$/, '');
  if (method && !classes.get(suite).has(method)) throw new Error(`Unknown native test method: ${selection}`);
  return selection;
}

export function nativeTestSelections(args, index) {
  const selections = [];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag !== '--only' && flag !== '--skip') continue;
    const selection = args[++i];
    if (!selection || selection.startsWith('--')) throw new Error(`A native test target/class/method is required after ${flag}.`);
    validateNativeTestSelection(selection, index);
    selections.push({flag, selection});
  }
  return selections;
}

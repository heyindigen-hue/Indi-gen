#!/usr/bin/env node
/**
 * Preflight harness for Indi-gen mobile (Expo SDK 50).
 *
 * Runs locally AND inside EAS as `eas-build-pre-install`.
 * Catches the kind of failures that have been costing us full EAS builds.
 *
 * Exits 1 on any error, 0 if clean.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); console.error('FAIL ' + msg); }
function warn(msg) { warnings.push(msg); console.warn('WARN ' + msg); }
function ok(msg) { console.log('OK   ' + msg); }
function step(n, total, label) { console.log(`\n[${n}/${total}] ${label}`); }

const TOTAL = 14;

// ---------------------------------------------------------------------------
// 1. expo-doctor
// ---------------------------------------------------------------------------
step(1, TOTAL, 'expo-doctor');
try {
  execSync('npx --yes expo-doctor', { stdio: 'pipe', cwd: ROOT });
  ok('expo-doctor passed');
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  err(`expo-doctor failed:\n${out.slice(-2000)}`);
}

// ---------------------------------------------------------------------------
// 2. tsc --noEmit
// ---------------------------------------------------------------------------
step(2, TOTAL, 'tsc --noEmit');
try {
  execSync('npx --yes tsc --noEmit', { stdio: 'pipe', cwd: ROOT });
  ok('TypeScript clean');
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  err(`TypeScript errors:\n${out.slice(-2000)}`);
}

// ---------------------------------------------------------------------------
// 3. require()/import asset paths
// ---------------------------------------------------------------------------
step(3, TOTAL, 'require()/import asset paths');
const ASSET_RE = /(?:require|from)\s*\(?['"](\.{1,2}\/[^'"]*?\.(png|jpg|jpeg|svg|webp|json|gif|mp3|mp4|otf|ttf))['"]\)?/g;
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'store', 'constants'];

let assetCheckCount = 0;
for (const d of SOURCE_DIRS) {
  const full = path.join(ROOT, d);
  if (!fs.existsSync(full)) continue;
  walk(full, file => {
    const src = fs.readFileSync(file, 'utf8');
    ASSET_RE.lastIndex = 0;
    let m;
    while ((m = ASSET_RE.exec(src))) {
      const rel = m[1];
      const abs = path.resolve(path.dirname(file), rel);
      assetCheckCount++;
      if (!fs.existsSync(abs)) {
        err(`MISSING ASSET in ${path.relative(ROOT, file)}: ${rel} (expected at ${path.relative(ROOT, abs)})`);
      }
    }
  });
}
ok(`scanned ${assetCheckCount} asset references`);

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) callback(full);
  }
}

// ---------------------------------------------------------------------------
// 4. node_modules sanity — every declared dep is installed
// ---------------------------------------------------------------------------
step(4, TOTAL, 'node_modules sanity');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
let missingDeps = 0;
for (const name of Object.keys(allDeps)) {
  if (!fs.existsSync(path.join(ROOT, 'node_modules', name, 'package.json'))) {
    err(`missing node_modules entry: ${name}`);
    missingDeps++;
  }
}
if (missingDeps === 0) ok(`all ${Object.keys(allDeps).length} dependencies installed`);

// ---------------------------------------------------------------------------
// 5. app.json plugins are installed packages
// ---------------------------------------------------------------------------
step(5, TOTAL, 'app.json plugins');
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const plugins = appJson.expo?.plugins || [];
for (const p of plugins) {
  const name = Array.isArray(p) ? p[0] : p;
  if (typeof name !== 'string') continue;
  // Strip subpath: "expo-router/something" -> "expo-router"; "@scope/pkg/sub" -> "@scope/pkg"
  let pkgName;
  if (name.startsWith('@')) {
    const parts = name.split('/');
    pkgName = parts.slice(0, 2).join('/');
  } else {
    pkgName = name.split('/')[0];
  }
  if (!fs.existsSync(path.join(ROOT, 'node_modules', pkgName))) {
    err(`plugin "${name}" -> package "${pkgName}" not installed`);
  } else {
    ok(`plugin ${name} resolved`);
  }
}

// ---------------------------------------------------------------------------
// 6. babel.config.js — no deprecated SDK 50 plugins, reanimated last
// ---------------------------------------------------------------------------
step(6, TOTAL, 'babel.config.js');
const babelPath = path.join(ROOT, 'babel.config.js');
if (fs.existsSync(babelPath)) {
  const babelSrc = fs.readFileSync(babelPath, 'utf8');

  // SDK 50 deprecations — these CRASH metro at build time
  const deprecated = ['expo-router/babel'];
  for (const dep of deprecated) {
    if (babelSrc.includes(dep)) {
      err(`babel.config.js contains "${dep}" which is deprecated in SDK 50 (use babel-preset-expo instead)`);
    }
  }

  // Verify reanimated plugin is last in the plugins array (if present)
  if (babelSrc.includes('react-native-reanimated/plugin')) {
    // Use require with a clean module cache to load the actual config
    try {
      delete require.cache[babelPath];
      const cfg = require(babelPath)({ cache() {} });
      const pluginsArr = cfg.plugins || [];
      const flatNames = pluginsArr.map(p => Array.isArray(p) ? p[0] : p).filter(p => typeof p === 'string');
      const reanimatedIdx = flatNames.indexOf('react-native-reanimated/plugin');
      if (reanimatedIdx !== -1 && reanimatedIdx !== flatNames.length - 1) {
        err('react-native-reanimated/plugin must be LAST in babel plugins');
      } else {
        ok('reanimated plugin position OK');
      }
    } catch (e) {
      warn(`could not evaluate babel.config.js: ${e.message}`);
    }
  } else {
    ok('no reanimated plugin (skip ordering check)');
  }
} else {
  warn('no babel.config.js found');
}

// ---------------------------------------------------------------------------
// 7. eas.json profiles
// ---------------------------------------------------------------------------
step(7, TOTAL, 'eas.json');
const eas = JSON.parse(fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8'));
if (!eas.build?.preview) err('eas.json missing build.preview profile');
else ok('eas.json preview profile present');

// ---------------------------------------------------------------------------
// 8. app.json schema — invalid SDK 50 keys
// ---------------------------------------------------------------------------
step(8, TOTAL, 'app.json schema');
const expoBlock = appJson.expo || {};
if ('newArchEnabled' in expoBlock) err('newArchEnabled is not a valid top-level key in SDK 50 app.json');
if (!expoBlock.android?.package) err('android.package not set in app.json');
if (!expoBlock.ios?.bundleIdentifier) err('ios.bundleIdentifier not set in app.json');
if (Object.keys(errors).length === 0) ok('app.json schema OK');
else ok('app.json schema check complete');

// ---------------------------------------------------------------------------
// 9. assets referenced from app.json exist on disk
// ---------------------------------------------------------------------------
step(9, TOTAL, 'app.json asset paths');
const appJsonAssetKeys = [
  ['icon'],
  ['splash', 'image'],
  ['android', 'adaptiveIcon', 'foregroundImage'],
  ['android', 'adaptiveIcon', 'backgroundImage'],
  ['notification', 'icon'],
  ['ios', 'icon'],
];
function getNested(obj, keys) {
  return keys.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}
for (const keyPath of appJsonAssetKeys) {
  const v = getNested(expoBlock, keyPath);
  if (typeof v === 'string') {
    const abs = path.resolve(ROOT, v);
    if (!fs.existsSync(abs)) err(`app.json ${keyPath.join('.')} -> "${v}" does not exist`);
    else ok(`app.json ${keyPath.join('.')} -> ${v} exists`);
  }
}
// Also walk through plugin asset references
for (const p of plugins) {
  if (!Array.isArray(p) || typeof p[1] !== 'object') continue;
  const cfg = p[1];
  for (const [k, v] of Object.entries(cfg)) {
    if (typeof v === 'string' && /\.(png|jpg|jpeg|svg|webp|gif)$/.test(v)) {
      const abs = path.resolve(ROOT, v);
      if (!fs.existsSync(abs)) err(`plugin ${p[0]}.${k} -> "${v}" does not exist`);
      else ok(`plugin ${p[0]}.${k} -> ${v} exists`);
    }
  }
}

// ---------------------------------------------------------------------------
// 10. metro bundle simulation — only on Linux/Mac (Windows is unreliable)
// ---------------------------------------------------------------------------
step(10, TOTAL, 'metro bundle simulation');
if (process.platform === 'win32') {
  warn('metro bundle on win32 is unreliable; skipped (EAS Linux runs it)');
} else {
  try {
    execSync('npx --yes expo export --platform android --output-dir .preflight-export --dump-sourcemap=false', { stdio: 'pipe', cwd: ROOT });
    fs.rmSync(path.join(ROOT, '.preflight-export'), { recursive: true, force: true });
    ok('metro bundle succeeded');
  } catch (e) {
    const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    err(`metro bundle failed:\n${out.slice(-2000)}`);
  }
}

// ---------------------------------------------------------------------------
// 11. expo install --check — native module versions
// ---------------------------------------------------------------------------
step(11, TOTAL, 'expo install --check');
try {
  const out = execSync('npx --yes expo install --check', { stdio: 'pipe', cwd: ROOT, encoding: 'utf8' });
  if (/No issues/i.test(out) || out.trim().length === 0) ok('all native modules at correct versions');
  else {
    if (/expected version/i.test(out) || /the following/i.test(out)) {
      err(`expo install --check reported version mismatches:\n${out.slice(-1500)}`);
    } else {
      ok('expo install --check passed');
    }
  }
} catch (e) {
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  // Only treat as error if clear mismatch language is present
  if (/expected version/i.test(out)) {
    err(`expo install --check version mismatches:\n${out.slice(-1500)}`);
  } else {
    warn(`expo install --check non-fatal output:\n${out.slice(-500)}`);
  }
}

// ---------------------------------------------------------------------------
// 12. main entry resolves
// ---------------------------------------------------------------------------
step(12, TOTAL, 'main entry');
const mainEntry = pkg.main;
if (mainEntry) {
  // For "expo-router/entry" -> resolve via node_modules
  const entryDir = mainEntry.includes('/') && !mainEntry.startsWith('.')
    ? path.join(ROOT, 'node_modules', mainEntry)
    : path.resolve(ROOT, mainEntry);
  let exists = false;
  for (const ext of ['', '.js', '.ts', '.tsx']) {
    if (fs.existsSync(entryDir + ext)) { exists = true; break; }
  }
  if (!exists && !fs.existsSync(path.join(entryDir, 'package.json'))) {
    err(`package.json "main" -> "${mainEntry}" does not resolve`);
  } else {
    ok(`main entry "${mainEntry}" resolves`);
  }
} else {
  warn('package.json has no "main" entry');
}

// ---------------------------------------------------------------------------
// 13. .npmrc legacy-peer-deps for EAS
// ---------------------------------------------------------------------------
step(13, TOTAL, '.npmrc');
const npmrcPath = path.join(ROOT, '.npmrc');
if (fs.existsSync(npmrcPath)) {
  const npmrc = fs.readFileSync(npmrcPath, 'utf8');
  if (/legacy-peer-deps\s*=\s*true/.test(npmrc)) ok('.npmrc has legacy-peer-deps=true');
  else warn('.npmrc exists but does not set legacy-peer-deps=true (peer deps may fail on EAS)');
} else {
  warn('no .npmrc — peer deps may fail on EAS');
}

// ---------------------------------------------------------------------------
// 14. babel transform smoke test — catches deprecated babel plugins (e.g.
//     "expo-router/babel" in SDK 50) WITHOUT needing metro on Windows.
// ---------------------------------------------------------------------------
step(14, TOTAL, 'babel transform smoke test');
try {
  const babel = require(path.join(ROOT, 'node_modules', '@babel', 'core'));
  // Resolve the same entry expo-router uses on EAS:
  const entryPath = require.resolve('expo-router/entry', { paths: [ROOT] });
  const fixtureFiles = [entryPath];
  // Add the project's _layout if it exists:
  const layoutPath = path.join(ROOT, 'app', '_layout.tsx');
  if (fs.existsSync(layoutPath)) fixtureFiles.push(layoutPath);

  // Use the project's actual babel.config.js so any deprecated plugins blow up:
  for (const f of fixtureFiles) {
    const src = fs.readFileSync(f, 'utf8');
    babel.transformSync(src, {
      filename: f,
      cwd: ROOT,
      babelrc: true,
      configFile: path.join(ROOT, 'babel.config.js'),
    });
  }
  ok(`babel.config.js transforms ${fixtureFiles.length} fixture file(s) cleanly`);
} catch (e) {
  err(`babel transform failed: ${e.message}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n=== PREFLIGHT SUMMARY ===');
console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
if (warnings.length) {
  console.log('\nWARNINGS:');
  warnings.forEach(w => console.log('  WARN ' + w));
}
if (errors.length) {
  console.error('\nERRORS:');
  errors.forEach(e => console.error('  FAIL ' + e));
  console.error('\nDO NOT submit EAS build until errors are fixed.');
  process.exit(1);
}
console.log('\nGreen — safe to submit EAS build.');
process.exit(0);

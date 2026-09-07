#!/usr/bin/env node
'use strict';
/*
 * Patch monaco-editor clipboard module so that paste works in Electron.
 *
 * Monaco's paste action falls back to the `clipboardService.readText()`
 * (which maps to `navigator.clipboard.readText()` and works in Electron)
 * ONLY when `platform.isWeb` is true. In Electron `platform.isNative` is set
 * instead, so the fallback never runs and the editor relies solely on the
 * deprecated `document.execCommand('paste')`, which is blocked in modern
 * Chromium (Electron 20+). As a result Cmd+V / context "Paste" did nothing.
 *
 * This patch removes the `platform.isWeb` guard so the readText fallback is
 * used whenever `execCommand('paste')` fails. It is idempotent and safe to run
 * on every install (injected via the `postinstall` script).
 */

const fs = require('fs');
const path = require('path');

const file = path.join(
    __dirname,
    '..',
    'node_modules',
    'monaco-editor',
    'esm',
    'vs',
    'editor',
    'contrib',
    'clipboard',
    'clipboard.js'
);

const OLD = 'if (!result && platform.isWeb) {';
const NEW = 'if (!result) { // patched for Electron paste';

if (!fs.existsSync(file)) {
    console.warn('[patch-monaco] clipbooard.js not found, skipping:', file);
    process.exit(0);
}

let source = fs.readFileSync(file, 'utf8');

if (source.includes(NEW)) {
    console.log('[patch-monaco] already patched, nothing to do.');
    process.exit(0);
}

if (!source.includes(OLD)) {
    console.warn('[patch-monaco] expected marker not found in', file);
    process.exit(1);
}

source = source.replace(OLD, NEW);
fs.writeFileSync(file, source, 'utf8');
console.log('[patch-monaco] patched monaco-editor clipboard paste fallback.');
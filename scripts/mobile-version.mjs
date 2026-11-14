// Samakan versi aplikasi dengan GAME_VERSION (C10): Android versionName = GAME_VERSION, versionCode = mayor x 10000
// + minor x 100 + patch; iOS MARKETING_VERSION = GAME_VERSION, CURRENT_PROJECT_VERSION = versionCode; mobile/package.json ikut.
// Pemakaian: node scripts/mobile-version.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const v = /const GAME_VERSION = '([0-9]+)\.([0-9]+)\.([0-9]+)'/.exec(readFileSync('index.html', 'utf8'));
const name = v[1] + '.' + v[2] + '.' + v[3], code = Number(v[1]) * 10000 + Number(v[2]) * 100 + Number(v[3]);
const edit = (f, fn) => { if (!existsSync(f)) return; writeFileSync(f, fn(readFileSync(f, 'utf8'))); };
edit('mobile/android/app/build.gradle', (s) => s.replace(/versionCode \d+/, 'versionCode ' + code).replace(/versionName "[^"]*"/, 'versionName "' + name + '"'));
edit('mobile/ios/App/App.xcodeproj/project.pbxproj', (s) => s.replace(/MARKETING_VERSION = [^;]+;/g, 'MARKETING_VERSION = ' + name + ';').replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, 'CURRENT_PROJECT_VERSION = ' + code + ';'));
edit('mobile/package.json', (s) => s.replace(/"version": "[^"]*"/, '"version": "' + name + '"'));
console.log('versi mobile: ' + name + ' (versionCode ' + code + ')');

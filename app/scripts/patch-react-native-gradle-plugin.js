const fs = require('fs');
const path = require('path');

const settingsPath = path.resolve(
  __dirname,
  '../node_modules/@react-native/gradle-plugin/settings.gradle.kts',
);

if (!fs.existsSync(settingsPath)) {
  console.warn('[patch-gradle-plugin] React Native Gradle plugin settings file not found.');
  process.exit(0);
}

const source = fs.readFileSync(settingsPath, 'utf8');
const patched = source.replace(
  'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")',
  'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")',
);

if (patched === source) {
  console.log('[patch-gradle-plugin] Foojay resolver version already patched or pattern changed.');
  process.exit(0);
}

fs.writeFileSync(settingsPath, patched);
console.log('[patch-gradle-plugin] Updated Foojay resolver convention plugin to 1.0.0.');

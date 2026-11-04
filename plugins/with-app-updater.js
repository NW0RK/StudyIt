const { withAndroidManifest, withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function withAppUpdater(config) {
  config = withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;
    manifest['uses-permission'] ||= [];
    if (!manifest['uses-permission'].some(p => p.$['android:name'] === 'android.permission.REQUEST_INSTALL_PACKAGES')) {
      manifest['uses-permission'].push({ $: { 'android:name': 'android.permission.REQUEST_INSTALL_PACKAGES' } });
    }
    const application = manifest.application[0];
    application.provider ||= [];
    const authority = '${applicationId}.updates';
    if (!application.provider.some(p => p.$['android:authorities'] === authority)) {
      application.provider.push({ $: { 'android:name': 'androidx.core.content.FileProvider', 'android:authorities': authority, 'android:exported': 'false', 'android:grantUriPermissions': 'true' }, 'meta-data': [{ $: { 'android:name': 'android.support.FILE_PROVIDER_PATHS', 'android:resource': '@xml/update_paths' } }] });
    }
    return config;
  });
  config = withMainApplication(config, config => {
    if (!config.modResults.contents.includes('add(app.studyit.reader.updater.StudyItUpdaterPackage())')) {
      const anchor = 'PackageList(this).packages.apply {';
      if (!config.modResults.contents.includes(anchor)) throw new Error('Cannot register StudyIt Android updater in MainApplication.');
      config.modResults.contents = config.modResults.contents.replace(anchor, anchor + '\n              add(app.studyit.reader.updater.StudyItUpdaterPackage())');
    }
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const root = config.modRequest.platformProjectRoot;
    const java = path.join(root, 'app/src/main/java/app/studyit/reader/updater');
    const xml = path.join(root, 'app/src/main/res/xml');
    await fs.mkdir(java, { recursive: true }); await fs.mkdir(xml, { recursive: true });
    await fs.copyFile(path.join(__dirname, 'android/StudyItUpdater.kt'), path.join(java, 'StudyItUpdater.kt'));
    await fs.writeFile(path.join(xml, 'update_paths.xml'), '<paths xmlns:android="http://schemas.android.com/apk/res/android"><cache-path name="updates" path="updates/" /></paths>');
    return config;
  }]);
};

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'StudyIt', slug: 'studyit', version: '1.0.0', scheme: 'studyit',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  android: { package: 'app.studyit.reader', versionCode: 1 },
  web: { bundler: 'metro', output: 'single', name: 'StudyIt', description: 'Learn something. Follow the conversation.' },
  experiments: { baseUrl: process.env.STUDYIT_BASE_PATH || '' },
};
export default config;

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'StudyIt', slug: 'studyit', version: '1.0.1', scheme: 'studyit',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  android: { package: 'app.studyit.reader', versionCode: 2 },
  web: { bundler: 'metro', output: 'single', name: 'StudyIt', description: 'Learn something. Follow the conversation.' },
  experiments: { baseUrl: process.env.STUDYIT_BASE_PATH || '' },
};
export default config;

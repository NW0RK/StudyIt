import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'StudyIt', slug: 'studyit', version: '1.0.2', scheme: 'studyit',
  icon: './assets/studyit-icon-v1.png',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  android: { package: 'app.studyit.reader', versionCode: 3, adaptiveIcon: { foregroundImage: './assets/studyit-icon-v1.png', backgroundColor: '#0e1113' } },
  web: { bundler: 'metro', output: 'single', name: 'StudyIt', favicon: './assets/studyit-icon-v1.png', description: 'Learn something. Follow the conversation.' },
  experiments: { baseUrl: process.env.STUDYIT_BASE_PATH || '' },
};
export default config;

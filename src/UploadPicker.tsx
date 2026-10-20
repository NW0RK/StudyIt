import React from 'react';
import { Text } from 'react-native';
export default function UploadPicker(_: { onFile: (raw: string) => void; onError: (message: string) => void }) {
  return <Text>Use the StudyIt website to upload files, or paste the agent’s JSON below to preview it.</Text>;
}

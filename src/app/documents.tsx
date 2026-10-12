import { Stack } from 'expo-router';
import React from 'react';

import { DocumentsScreen } from '@/features/documents/DocumentsScreen';

export default function DocumentsRoute() {
  return (<><Stack.Screen options={{ headerShown: true, title: 'Documents' }} /><DocumentsScreen /></>);
}

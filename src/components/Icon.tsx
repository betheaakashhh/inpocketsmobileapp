import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

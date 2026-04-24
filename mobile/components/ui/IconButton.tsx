import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as Icons from '../icons';
import { useTheme } from '../../lib/themeContext';
import { haptic } from '../../lib/haptics';

type Props = {
  icon: string;
  onPress?: () => void;
  size?: number;
  color?: string;
};

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

export function IconButton({ icon, onPress, size = 22, color }: Props) {
  const { palette } = useTheme();
  const pascalName = toPascalCase(icon);
  const withSuffix = pascalName.endsWith('Icon') ? pascalName : `${pascalName}Icon`;
  const IconCmp = (Icons as unknown as Record<string, React.FC<{ size: number; color: string; strokeWidth: number }>>)[withSuffix];

  const handlePress = () => {
    haptic.light();
    onPress?.();
  };

  if (!IconCmp) return null;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={{ padding: 8 }}>
      <IconCmp size={size} color={color ?? palette.text} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

import { View, Text } from 'react-native';
import { NoteCategory } from '@/types/note';

interface CategoryBadgeProps {
  category: NoteCategory;
}

const CATEGORY_CONFIG = {
  finance: {
    label: 'FINANCE',
    bgColor: 'bg-teal-light',
    textColor: 'text-teal-dark',
  },
  sport: {
    label: 'SPORT',
    bgColor: 'bg-orange-bg-heavy',
    textColor: 'text-orange-primary',
  },
  personal: {
    label: 'PERSONAL',
    bgColor: 'bg-blue-50',
    textColor: 'text-badge-blue',
  },
  work: {
    label: 'WORK',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <View className={`px-3 py-1 rounded ${config.bgColor}`}>
      <Text className={`text-xs font-semibold ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
}
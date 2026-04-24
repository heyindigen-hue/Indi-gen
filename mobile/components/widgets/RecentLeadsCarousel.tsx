import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type LeadItem = { id: string; name: string; company?: string };

type Props = {
  title?: string;
  leads?: LeadItem[];
  onAction?: (action: string) => void;
};

function LeadCard({ lead }: { lead: LeadItem }) {
  const { palette, radius } = useTheme();
  return (
    <View style={{
      backgroundColor: palette.card,
      borderRadius: radius,
      borderWidth: 0.5,
      borderColor: palette.border,
      padding: 12,
      width: 140,
      marginRight: 10,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: palette.primary + '33',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
      }}>
        <Text style={{ color: palette.primary, fontSize: 16, fontWeight: '700' }}>
          {lead.name[0]?.toUpperCase()}
        </Text>
      </View>
      <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
        {lead.name}
      </Text>
      {lead.company && (
        <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular' }} numberOfLines={1}>
          {lead.company}
        </Text>
      )}
    </View>
  );
}

const MOCK_LEADS: LeadItem[] = [
  { id: '1', name: 'Priya Sharma', company: 'TechCorp' },
  { id: '2', name: 'Rahul Verma', company: 'StartupXYZ' },
  { id: '3', name: 'Anita Singh', company: 'GlobalTech' },
];

export default function RecentLeadsCarousel({ title = 'Recent Leads', leads = MOCK_LEADS }: Props) {
  const { palette } = useTheme();
  return (
    <View>
      <Text style={{ color: palette.text, fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginBottom: 10 }}>
        {title}
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LeadCard lead={item} />}
      />
    </View>
  );
}

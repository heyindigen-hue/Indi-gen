import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useManifest } from '../../lib/useManifest';
import { useTheme } from '../../lib/themeContext';
import { renderWidget } from '../../components/widgets';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function Home() {
  const { palette } = useTheme();
  const { data: manifest } = useManifest();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const widgets: any[] = manifest?.home_widgets || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['ui-manifest'] });
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={palette.primary}
        />
      }
    >
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          fontFamily: 'Inter_700Bold',
          color: palette.text,
          marginBottom: 16,
        }}>
          {manifest?.brand?.name || 'Indi-gen'}
        </Text>
        {widgets.map((w: any, i: number) => (
          <View key={i} style={{ marginBottom: 12 }}>
            {renderWidget(w, String(i))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

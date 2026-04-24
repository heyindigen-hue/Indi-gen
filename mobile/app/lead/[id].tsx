import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Lead #{id}</Text>
      <Text style={{ color: '#888', marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}

import { View, Text } from 'react-native';

export default function PaywallScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Subscribe</Text>
      <Text style={{ color: '#888', marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}

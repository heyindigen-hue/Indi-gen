import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type SearchResult = { id: string; name?: string; headline?: string; linkedin_url?: string };

type Props = {
  placeholder?: string;
  onAction?: (action: string) => void;
};

export default function SearchBar({ placeholder = 'Search leads...', onAction }: Props) {
  const { palette, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const runSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<SearchResult[]>(`/leads?q=${encodeURIComponent(q)}&limit=8`);
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleOpen = () => {
    onAction?.('search_open');
    setOpen(true);
  };

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/lead/${item.id}` as any);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: palette.card,
          borderRadius: radius,
          borderWidth: 0.5,
          borderColor: palette.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontSize: 16, opacity: 0.5 }}>🔍</Text>
        <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 }}>
          {placeholder}
        </Text>
        <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', opacity: 0.5 }}>⌘K</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)} transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View
            style={{
              backgroundColor: palette.bg,
              margin: 16,
              marginTop: 60,
              borderRadius: radius * 1.5,
              overflow: 'hidden',
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: 0.5,
                borderBottomColor: palette.border,
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ fontSize: 18, opacity: 0.5, marginRight: 10 }}>🔍</Text>
              <TextInput
                autoFocus
                value={query}
                onChangeText={(t) => { setQuery(t); runSearch(t); }}
                placeholder={placeholder}
                placeholderTextColor={palette.muted}
                style={{ flex: 1, color: palette.text, fontSize: 16, fontFamily: 'Inter_400Regular', paddingVertical: 14 }}
              />
              {searching && <ActivityIndicator size="small" color={palette.primary} style={{ marginLeft: 8 }} />}
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 8, marginLeft: 4 }}>
                <Text style={{ color: palette.muted, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: palette.border,
                  }}
                >
                  <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_500Medium' }}>
                    {item.name ?? 'Unknown'}
                  </Text>
                  {item.headline ? (
                    <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 }} numberOfLines={1}>
                      {item.headline}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                query && !searching ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular' }}>No results</Text>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

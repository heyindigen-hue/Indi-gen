import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../lib/themeContext';

type Props = {
  video_url?: string;
  title?: string;
  thumbnail?: string;
  onAction?: (action: string) => void;
};

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
}

export default function VideoCard({ video_url = '', title = 'Tutorial', thumbnail, onAction }: Props) {
  const { palette, radius } = useTheme();
  const [playing, setPlaying] = useState(false);

  const embedUrl = video_url ? getEmbedUrl(video_url) : null;

  if (playing && embedUrl) {
    return (
      <View style={{ borderRadius: radius, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 16 / 9 }}>
        <WebView
          source={{ uri: embedUrl }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        onAction?.('play_video');
        if (embedUrl) setPlaying(true);
      }}
      style={{
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        aspectRatio: 16 / 9,
      }}
    >
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : null}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: thumbnail ? 'rgba(0,0,0,0.35)' : 'transparent',
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.4)',
          }}
        >
          <View
            style={{
              width: 0,
              height: 0,
              borderTopWidth: 9,
              borderBottomWidth: 9,
              borderLeftWidth: 16,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: '#FFFFFF',
              marginLeft: 4,
            }}
          />
        </View>
      </View>
      {title ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

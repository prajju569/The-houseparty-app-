import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * App-wide error boundary. A render error anywhere below this catches here and
 * shows a recoverable fallback instead of a blank white screen. Uses static
 * brand colors (not the theme) because the theme provider may be part of the
 * crash, and a crash screen must never itself depend on app state.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surfaced in dev logs; wire to a crash reporter (Sentry, etc.) in prod.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={s.root}>
        <Text style={s.brand}>houseparty ✦</Text>
        <Text style={s.title}>Something broke</Text>
        <Text style={s.body}>
          The app hit an unexpected error. Your data is safe — try again.
        </Text>

        {__DEV__ && (
          <ScrollView style={s.devBox} contentContainerStyle={{ padding: 12 }}>
            <Text style={s.devText}>{this.state.error.message}</Text>
          </ScrollView>
        )}

        <TouchableOpacity style={s.btn} onPress={this.reset} activeOpacity={0.85}>
          <Text style={s.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090909',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  brand: { color: '#E8E3D8', fontSize: 18, fontWeight: '700', letterSpacing: 0.4, marginBottom: 8 },
  title: { color: '#F4F2EC', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  body: { color: 'rgba(244,242,236,0.55)', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  devBox: {
    maxHeight: 160,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,90,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,90,0.35)',
    borderRadius: 12,
    marginTop: 8,
  },
  devText: { color: '#FF8A8A', fontSize: 12, fontFamily: 'Courier' },
  btn: {
    marginTop: 16,
    backgroundColor: '#E8E3D8',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  btnText: { color: '#090909', fontWeight: '700', fontSize: 15 },
});

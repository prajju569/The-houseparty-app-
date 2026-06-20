import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Switch, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../features/auth/authStore';
import { supabase } from '../../services/supabaseClient';

type PrivacySettings = {
  is_private: boolean;
  show_party_pics: boolean;
};

export default function SettingsScreen({ navigation }: any) {
  const { T, isDark, toggleTheme } = useTheme();
  const { session, profile, setProfile } = useAuthStore();
  const myId = session?.user?.id ?? null;

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    is_private:      profile?.is_private      ?? false,
    show_party_pics: profile?.show_party_pics ?? true,
  });
  const [saving, setSaving] = useState(false);

  // Persist privacy toggle changes to Supabase with debounce
  async function updatePrivacy(key: keyof PrivacySettings, val: boolean) {
    const next = { ...privacy, [key]: val };
    setPrivacy(next);
    if (!myId) return;
    setSaving(true);
    await supabase.from('profiles').update({ [key]: val }).eq('id', myId);
    if (profile) setProfile({ ...profile, [key]: val });
    setSaving(false);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            Alert.alert('Contact support', 'Email support@houseparty.in to delete your account. We\'ll process it within 48 hours.', [{ text: 'OK' }]);
          },
        },
      ]
    );
  }

  const s = StyleSheet.create({
    root:   { flex: 1, backgroundColor: T.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: T.border,
    },
    title:  { fontSize: 26, fontWeight: '700', color: T.text, letterSpacing: -0.6, flex: 1 },
    savingDot: { opacity: saving ? 1 : 0 },

    scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 80 },

    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: T.textMute, marginBottom: 10, marginTop: 24 },

    card: {
      backgroundColor: T.surface, borderRadius: 20, borderWidth: 1, borderColor: T.border, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
    sep: { height: 1, backgroundColor: T.separator, marginLeft: 52 },
    iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: T.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: T.text },
    rowValue: { fontSize: 13, color: T.textMute },
    chevron:  { color: T.textMute, fontSize: 18 },

    dangerCard: {
      backgroundColor: 'rgba(255,90,90,0.06)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,90,90,0.14)',
    },
    dangerLabel: { fontSize: 15, fontWeight: '500', color: T.red },

    versionTx: { textAlign: 'center', fontSize: 12, color: T.textMute, marginTop: 32 },
  });

  type RowDef = {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    toggle?: { value: boolean; onToggle: (v: boolean) => void };
  };

  const APPEARANCE: RowDef[] = [
    {
      icon: isDark ? 'moon' : 'sun',
      label: 'Dark Mode',
      toggle: { value: isDark, onToggle: () => toggleTheme() },
    },
  ];

  const PRIVACY: RowDef[] = [
    {
      icon: 'lock',
      label: 'Private profile',
      toggle: {
        value: privacy.is_private,
        onToggle: v => updatePrivacy('is_private', v),
      },
    },
    {
      icon: 'image',
      label: 'Show my party pics',
      toggle: {
        value: privacy.show_party_pics,
        onToggle: v => updatePrivacy('show_party_pics', v),
      },
    },
  ];

  const ACCOUNT: RowDef[] = [
    { icon: 'user', label: 'Edit profile', onPress: () => navigation.navigate('EditProfile') },
    {
      icon: 'mail',
      label: 'Email',
      value: session?.user?.email ?? '—',
      onPress: () => Alert.alert('Change email', 'Update your email in account settings. Coming soon.'),
    },
    {
      icon: 'shield',
      label: 'Change password',
      onPress: async () => {
        if (!session?.user?.email) return;
        await supabase.auth.resetPasswordForEmail(session.user.email);
        Alert.alert('Reset link sent', `Check ${session.user.email} for a password reset link.`);
      },
    },
  ];

  const SUPPORT: RowDef[] = [
    { icon: 'help-circle', label: 'Help & FAQ', onPress: () => Alert.alert('Help', 'Coming soon!') },
    { icon: 'file-text',   label: 'Terms of service', onPress: () => Alert.alert('Terms', 'Coming soon!') },
    { icon: 'shield',      label: 'Privacy policy', onPress: () => Alert.alert('Privacy', 'Coming soon!') },
    { icon: 'mail',        label: 'Contact us', onPress: () => Linking.openURL('mailto:support@houseparty.in') },
  ];

  function renderSection(rows: RowDef[], danger = false) {
    return (
      <View style={danger ? s.dangerCard : s.card}>
        {rows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={s.sep} />}
            <TouchableOpacity
              style={s.row}
              onPress={row.onPress}
              activeOpacity={row.onPress ? 0.7 : 1}
              disabled={!row.onPress && !row.toggle}
            >
              <View style={s.iconWrap}>
                <Feather name={row.icon} size={16} color={danger ? T.red : T.text} />
              </View>
              <Text style={[s.rowLabel, danger && s.dangerLabel]}>{row.label}</Text>
              {row.value && <Text style={s.rowValue}>{row.value}</Text>}
              {row.toggle && (
                <Switch
                  value={row.toggle.value}
                  onValueChange={row.toggle.onToggle}
                  trackColor={{ false: T.border, true: 'rgba(232,227,216,0.5)' }}
                  thumbColor={row.toggle.value ? T.accent : T.textMute}
                />
              )}
              {row.onPress && !row.toggle && <Text style={s.chevron}>›</Text>}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={T.textMute} />
          </TouchableOpacity>
          <Text style={s.title}>Settings</Text>
          {saving && <ActivityIndicator size="small" color={T.accent} />}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.sectionLabel}>APPEARANCE</Text>
        {renderSection(APPEARANCE)}

        <Text style={s.sectionLabel}>PRIVACY</Text>
        {renderSection(PRIVACY)}

        <Text style={s.sectionLabel}>ACCOUNT</Text>
        {renderSection(ACCOUNT)}

        <Text style={s.sectionLabel}>SUPPORT</Text>
        {renderSection(SUPPORT)}

        <Text style={s.sectionLabel}>DANGER ZONE</Text>
        {renderSection([{
          icon: 'trash-2',
          label: 'Delete account',
          onPress: handleDeleteAccount,
        }], true)}

        <Text style={s.versionTx}>Houseparty v1.0.0 · Made with ♥ in Mumbai</Text>
      </ScrollView>
    </View>
  );
}

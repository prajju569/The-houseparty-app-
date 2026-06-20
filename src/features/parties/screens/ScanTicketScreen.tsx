import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { verifyAndCheckIn, type CheckInResult } from '../../../services/bookingService';

type Props = { route: any; navigation: any };

export default function ScanTicketScreen({ route, navigation }: Props) {
  const { eventId } = route.params ?? {};
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  async function onBarcodeScanned({ data }: { data: string }) {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    const res = await verifyAndCheckIn(data.trim());
    setResult(res);
    setLoading(false);
  }

  function reset() {
    setResult(null);
    setScanning(true);
  }

  if (!permission) return <View style={s.root} />;

  if (!permission.granted) {
    return (
      <View style={s.root}>
        <SafeAreaView style={s.center}>
          <Feather name="camera-off" size={40} color="rgba(244,242,236,0.4)" />
          <Text style={s.permTitle}>Camera required</Text>
          <Text style={s.permSub}>Allow camera access to scan tickets at the door.</Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={s.permBtnText}>Enable camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: 'rgba(244,242,236,0.45)', fontSize: 14 }}>← Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Viewfinder overlay */}
      {!result && (
        <View style={s.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#F4F2EC" />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={s.scanFrame}>
            <View style={s.corner} />
            <View style={[s.corner, { right: 0, left: undefined }]} />
            <View style={[s.corner, { bottom: 0, top: undefined }]} />
            <View style={[s.corner, { bottom: 0, top: undefined, right: 0, left: undefined }]} />
          </View>
          <Text style={s.scanHint}>Point camera at guest QR code</Text>
          {loading && (
            <View style={s.loadingPill}>
              <Text style={s.loadingText}>Verifying…</Text>
            </View>
          )}
        </View>
      )}

      {/* Result overlay */}
      {result && (
        <View style={[s.overlay, s.resultOverlay]}>
          <View style={[s.resultCard, result.valid && !result.already_checked_in ? s.resultGreen : result.valid ? s.resultAmber : s.resultRed]}>
            <Text style={s.resultIcon}>
              {result.valid && !result.already_checked_in ? '✓' : result.valid ? '⚠' : '✕'}
            </Text>

            {result.valid ? (
              <>
                <Text style={s.resultName}>{result.guest_name}</Text>
                <Text style={s.resultSub}>
                  {result.guest_count === 1
                    ? '1 guest'
                    : `${result.guest_count} guests (group booking)`}
                </Text>
                {result.already_checked_in ? (
                  <Text style={s.resultNote}>
                    Already checked in at {result.checked_in_at
                      ? new Date(result.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : ''}
                  </Text>
                ) : (
                  <Text style={s.resultNote}>Confirmed · Welcome! 🎉</Text>
                )}
              </>
            ) : (
              <>
                <Text style={s.resultName}>Invalid Ticket</Text>
                <Text style={s.resultSub}>{result.error ?? 'This QR code is not valid.'}</Text>
              </>
            )}

            <TouchableOpacity style={s.scanAgainBtn} onPress={reset} activeOpacity={0.85}>
              <Text style={s.scanAgainText}>Scan next ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const FRAME = 220;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#090909', gap: 12 },
  overlay:{ ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },

  back: {
    margin: 16, alignSelf: 'flex-start',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(9,9,9,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  scanFrame: {
    width: FRAME, height: FRAME, position: 'relative',
    borderRadius: 4,
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: '#E8E3D8', borderTopWidth: 3, borderLeftWidth: 3,
    top: 0, left: 0, borderRadius: 2,
  },
  scanHint: {
    color: 'rgba(244,242,236,0.7)', fontSize: 14, fontWeight: '500',
    marginTop: 24, textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  loadingPill: {
    marginTop: 16, backgroundColor: 'rgba(232,227,216,0.15)',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
  },
  loadingText: { color: '#E8E3D8', fontSize: 13 },

  resultOverlay: { backgroundColor: 'rgba(0,0,0,0.75)' },
  resultCard: {
    width: '80%', borderRadius: 28, padding: 32,
    alignItems: 'center', gap: 8,
    borderWidth: 1.5,
  },
  resultGreen: { backgroundColor: 'rgba(95,200,140,0.15)', borderColor: '#5FC88C' },
  resultAmber: { backgroundColor: 'rgba(255,180,0,0.12)', borderColor: '#FFB400' },
  resultRed:   { backgroundColor: 'rgba(255,90,90,0.12)', borderColor: '#FF5A5A' },

  resultIcon: { fontSize: 48, marginBottom: 8 },
  resultName: { color: '#F4F2EC', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  resultSub:  { color: 'rgba(244,242,236,0.6)', fontSize: 14, textAlign: 'center' },
  resultNote: { color: 'rgba(244,242,236,0.45)', fontSize: 13, marginTop: 4, textAlign: 'center' },

  scanAgainBtn: {
    marginTop: 24, backgroundColor: '#E8E3D8',
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28,
    ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20 }, android: { elevation: 8 } }),
  },
  scanAgainText: { color: '#090909', fontWeight: '700', fontSize: 15 },

  permTitle:   { color: '#F4F2EC', fontSize: 20, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  permSub:     { color: 'rgba(244,242,236,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  permBtn:     { backgroundColor: '#E8E3D8', borderRadius: 28, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  permBtnText: { color: '#090909', fontWeight: '700', fontSize: 15 },
});

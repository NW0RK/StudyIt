import React, { useEffect, useRef, useState } from 'react';
import { AppState, DeviceEventEmitter, Modal, NativeModules, Platform, Pressable, Text, View } from 'react-native';
import { storage } from './library';
import { checkAppUpdate, checkDue, type AppUpdate } from './app-update';

type Updater = {
  version(): Promise<number>; canInstall(): Promise<boolean>; installSettings(): Promise<void>;
  download(url: string, sha256: string): Promise<void>; install(sha256: string): Promise<void>;
};
const updater = NativeModules.StudyItUpdater as Updater | undefined;
const CHECK_KEY = 'studyit.app-update-check.v1';
async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (response.status === 404 && url.includes('api.github.com')) return { draft: false, prerelease: false, tag_name: '', assets: [] };
    if (!response.ok) throw new Error(`Update check failed (${response.status}). Try again.`);
    return await response.json();
  } finally { clearTimeout(timeout); }
}

export default function AppUpdates({ p }: { p: { ink: string; muted: string; green: string; border: string; panel: string } }) {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState('');
  const checking = useRef(false);
  const installing = useRef(false);
  const waitingPermission = useRef<AppUpdate | null>(null);
  const downloaded = useRef<string | null>(null);
  const dismissed = useRef<number | null>(null);
  async function check(manual = false) {
    if (Platform.OS !== 'android' || checking.current) return;
    checking.current = true;
    try {
      if (!updater) { if (manual) setMessage('App updates require the installed Android build.'); return; }
      const now = Date.now();
      const last = Number(await storage.get(CHECK_KEY)) || 0;
      if (!manual && !checkDue(last, now, 24 * 60 * 60 * 1000)) return;
      if (manual) { setWorking(true); setMessage('Checking for app updates…'); }
      // Record attempts as well as successes to avoid repeated requests while offline.
      await storage.set(CHECK_KEY, String(now));
      const next = await checkAppUpdate(await updater.version(), getJson);
      if (manual || next?.versionCode !== dismissed.current) setUpdate(next);
      if (manual) setMessage(next ? `StudyIt ${next.version} is available.` : 'Your app is up to date.');
    } catch (e) { if (manual) setMessage(e instanceof Error ? e.message : 'Could not check for app updates. Try again.'); }
    finally { checking.current = false; if (manual) setWorking(false); }
  }
  async function install(next: AppUpdate) {
    if (!updater) return;
    if (!(await updater.canInstall())) {
      waitingPermission.current = next;
      setMessage('Allow StudyIt to install apps in Android settings, then return here.');
      await updater.installSettings();
      return;
    }
    waitingPermission.current = null;
    await updater.install(next.sha256);
    setMessage('Confirm the update in Android’s installer. If you cancel, tap Update app to retry.');
  }
  async function downloadAndInstall() {
    if (!update || !updater || installing.current) return;
    installing.current = true; setWorking(true); setMessage('');
    try {
      if (downloaded.current !== update.sha256) {
        setProgress('Downloading update…');
        await updater.download(update.url, update.sha256);
        downloaded.current = update.sha256;
      }
      setProgress(''); await install(update);
    } catch (e) {
      waitingPermission.current = null;
      downloaded.current = null;
      setMessage(e instanceof Error ? e.message : 'Could not update. Tap Update app to try again.');
    } finally { installing.current = false; setWorking(false); setProgress(''); }
  }
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void check();
    const progressSubscription = DeviceEventEmitter.addListener('StudyItUpdateProgress', ({ received, total }: { received: number; total: number }) => {
      setProgress(total > 0 ? `Downloading update… ${Math.min(100, Math.round(received / total * 100))}%` : `Downloading update… ${Math.round(received / 1024 / 1024)} MB`);
    });
    const appSubscription = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      const pending = waitingPermission.current;
      if (pending && updater) {
        waitingPermission.current = null;
        void updater.canInstall().then(allowed => {
          if (allowed) return install(pending);
          setMessage('Installation permission was not granted. Tap Update app to try again.');
        }).catch(e => setMessage(e instanceof Error ? e.message : 'Could not open the installer. Try again.'));
      }
      void check();
    });
    return () => { appSubscription.remove(); progressSubscription.remove(); };
  }, []);
  if (Platform.OS !== 'android') return null;
  const dismiss = () => { if (!working && update) { dismissed.current = update.versionCode; setUpdate(null); setMessage(''); } };
  return <View style={{ borderTopWidth: 1, borderColor: p.border, paddingTop: 14, marginTop: 14, gap: 10 }}>
    <Modal visible={!!update} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 24 }}>
        <View accessibilityViewIsModal style={{ backgroundColor: p.panel, padding: 24, borderRadius: 16, gap: 14 }}>
          <Text accessibilityRole="header" style={{ color: p.ink, fontSize: 20 }}>StudyIt {update?.version} is available</Text>
          <Text style={{ color: p.muted }}>Download the update, then confirm installation in Android.</Text>
          {!!(progress || message) && <Text accessibilityLiveRegion="polite" style={{ color: p.muted }}>{progress || message}</Text>}
          <Pressable accessibilityRole="button" disabled={working} onPress={() => void downloadAndInstall()} style={{ paddingVertical: 12 }}><Text style={{ color: p.green }}>{working ? 'Please wait…' : 'Update app'}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={working} onPress={dismiss} style={{ paddingVertical: 12 }}><Text style={{ color: p.muted }}>Later</Text></Pressable>
        </View>
      </View>
    </Modal>
    {!update && !!message && <Text accessibilityLiveRegion="polite" style={{ color: p.muted }}>{message}</Text>}
    <Pressable accessibilityRole="button" disabled={working} onPress={() => void check(true)} style={{ paddingVertical: 10 }}><Text style={{ color: p.green }}>Check for app updates</Text></Pressable>
  </View>;
}

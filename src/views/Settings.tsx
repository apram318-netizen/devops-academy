import { useRef, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { supportsFolderSync } from '../storage/folder';
import { isValidFirebaseConfig } from '../cloud/types';
import { BUILT_IN_FIREBASE_CONFIG } from '../cloud/projectConfig';
import { Button, Dialog } from '../components/ui';
import type { FirebaseWebConfig } from '../state/types';

const SETUP = `Firebase project is already wired for this site (devops-course-7e346).

Cloud sync stores every progress change in Firestore (completions, notes, lab steps, quizzes, assignment text/grades, UI). File bytes stay on this device; file names still sync with the submission.

Before first connect, finish console setup once:
1. Authentication → enable Anonymous sign-in
2. Firestore → paste firestore.rules from the repo (Storage is not required)
3. Lock the Browser API key referrers to:
   https://apram318-netizen.github.io/*
   http://localhost:*

Then enter your sync passphrase below and connect. The passphrase stays in this browser only (never in GitHub). Use the same passphrase on every device.`;

export function Settings() {
  const {
    state,
    setPrefs,
    connectFolder,
    connectCloudSync,
    disconnectCloudSync,
    syncNow,
    cloudReady,
    exportBackup,
    importBackup,
    resetProgress,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [configText, setConfigText] = useState(() =>
    JSON.stringify(state.storage.cloud.config ?? BUILT_IN_FIREBASE_CONFIG, null, 2),
  );
  const [syncKey, setSyncKey] = useState(state.storage.cloud.syncKey || '');
  const [busy, setBusy] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const parseConfig = (): FirebaseWebConfig => {
    if (!showAdvanced) return BUILT_IN_FIREBASE_CONFIG;
    let raw = configText.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) raw = match[0];
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidFirebaseConfig(parsed)) throw new Error('Config looks incomplete. Paste the full firebaseConfig object.');
    return parsed;
  };

  const onConnect = async () => {
    setCloudError(null);
    setBusy(true);
    try {
      const config = parseConfig();
      await connectCloudSync(config, syncKey);
      setToast('Cloud sync connected');
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : 'Could not connect');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="page reading">
      <h1 class="page-title">Settings</h1>
      <p class="page-sub">Local cache plus optional free Firebase cloud sync so you can continue on any device.</p>

      <section class="section">
        <h2 class="section-title">Profile</h2>
        <div class="field">
          <label for="name">Display name</label>
          <input
            id="name"
            value={state.prefs.name}
            onInput={(e) => setPrefs({ name: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="field">
          <label for="start">Program start date</label>
          <input
            id="start"
            type="date"
            value={state.prefs.start}
            onInput={(e) => setPrefs({ start: (e.target as HTMLInputElement).value })}
          />
          <div class="field-help">All due dates are calculated from this Monday.</div>
        </div>
        <div class="field">
          <label for="theme">Theme</label>
          <select
            id="theme"
            value={state.prefs.theme}
            onChange={(e) => setPrefs({ theme: (e.target as HTMLSelectElement).value as 'system' | 'light' | 'dark' })}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Cloud sync (Firebase, free)</h2>
        <div class="card">
          <p style={{ marginTop: 0 }}>
            Status:{' '}
            {cloudReady && state.storage.cloud.enabled
              ? `Connected${state.storage.cloud.lastCloudSync ? ` · last sync ${new Date(state.storage.cloud.lastCloudSync).toLocaleString('en-AU')}` : ''}`
              : 'Not connected'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{SETUP}</p>

          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Project: <code>{BUILT_IN_FIREBASE_CONFIG.projectId}</code> (built into the live site)
          </p>
          <div class="field">
            <label for="sync-key">Sync passphrase</label>
            <input
              id="sync-key"
              type="password"
              autoComplete="off"
              value={syncKey}
              onInput={(e) => setSyncKey((e.target as HTMLInputElement).value)}
              placeholder="12+ characters — same on every device"
            />
            <div class="field-help">
              This encrypts your vault. It is stored only in this browser after you connect — never commit it to
              GitHub. Anyone who knows it can load your progress.
            </div>
          </div>
          <details
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
            style={{ marginBottom: 12 }}
          >
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
              Advanced: override Firebase web config
            </summary>
            <div class="field" style={{ marginTop: 8 }}>
              <label for="fb-config">Firebase web config (JSON)</label>
              <textarea
                id="fb-config"
                style={{ minHeight: 140, fontFamily: 'var(--mono)', fontSize: 13 }}
                value={configText}
                onInput={(e) => setConfigText((e.target as HTMLTextAreaElement).value)}
              />
            </div>
          </details>
          {cloudError && <div class="field-error">{cloudError}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" disabled={busy} onClick={() => void onConnect()}>
              {busy ? 'Connecting…' : cloudReady ? 'Reconnect cloud sync' : 'Connect cloud sync'}
            </Button>
            {cloudReady && (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    void syncNow()
                      .then(() => setToast('Synced to cloud'))
                      .catch((e) => setCloudError(e instanceof Error ? e.message : 'Sync failed'))
                  }
                >
                  Sync now
                </Button>
                <Button variant="danger" onClick={() => disconnectCloudSync()}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">This browser</h2>
        <div class="card">
          <p style={{ marginTop: 0 }}>
            Persistent storage:{' '}
            {state.storage.persisted === null ? 'Unknown' : state.storage.persisted ? 'Granted' : 'Not granted'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            A local IndexedDB cache keeps the app fast offline
            {state.storage.folderName ? `, and folder sync uses “${state.storage.folderName}”` : ''}.
          </p>
          {supportsFolderSync() && (
            <Button variant="secondary" onClick={() => void connectFolder()}>
              {state.storage.folderName ? 'Change folder' : 'Also save to a folder'}
            </Button>
          )}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Backup</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => void exportBackup().then(() => setToast('Backup downloaded'))}
          >
            Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            class="sr-only"
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              if (!confirm('Import this backup? It will replace your current progress.')) return;
              void importBackup(file).then(() => setToast('Backup restored'));
              (e.target as HTMLInputElement).value = '';
            }}
          />
        </div>
        <p class="field-help">
          Last backup:{' '}
          {state.prefs.lastBackup ? new Date(state.prefs.lastBackup).toLocaleString('en-AU') : 'Never'}
        </p>
      </section>

      <section class="section">
        <h2 class="section-title">Danger zone</h2>
        <Button variant="danger" onClick={() => setConfirmReset(1)}>
          Reset progress
        </Button>
      </section>

      {confirmReset === 1 && (
        <Dialog
          title="Reset all progress?"
          onClose={() => setConfirmReset(0)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmReset(0)}>
                Cancel
              </Button>
              <Button variant="danger-solid" onClick={() => setConfirmReset(2)}>
                Continue
              </Button>
            </>
          }
        >
          <p>This deletes completions, submissions, quiz attempts and uploaded files. Cloud sync settings are kept if connected.</p>
        </Dialog>
      )}
      {confirmReset === 2 && (
        <Dialog
          title="Are you sure?"
          onClose={() => setConfirmReset(0)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmReset(0)}>
                Cancel
              </Button>
              <Button
                variant="danger-solid"
                onClick={() => {
                  void resetProgress().then(() => {
                    setConfirmReset(0);
                    setToast('Progress reset');
                  });
                }}
              >
                Reset everything
              </Button>
            </>
          }
        >
          <p>This cannot be undone unless you have a backup or cloud copy.</p>
        </Dialog>
      )}

      {toast && (
        <div class="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

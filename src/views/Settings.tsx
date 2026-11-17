import { useRef, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { supportsFolderSync } from '../storage/folder';
import { Button, Dialog } from '../components/ui';

export function Settings() {
  const {
    state,
    setPrefs,
    connectFolder,
    exportBackup,
    importBackup,
    resetProgress,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div class="page reading">
      <h1 class="page-title">Settings</h1>
      <p class="page-sub">Preferences, storage and backups stay on this device.</p>

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
        <h2 class="section-title">Storage</h2>
        <div class="card">
          <p style={{ marginTop: 0 }}>
            Persistent storage:{' '}
            {state.storage.persisted === null ? 'Unknown' : state.storage.persisted ? 'Granted' : 'Not granted'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Progress is stored in IndexedDB in this browser
            {state.storage.folderName ? `, and synced to folder “${state.storage.folderName}”` : ''}.
          </p>
          {supportsFolderSync() && (
            <Button variant="secondary" onClick={() => void connectFolder()}>
              {state.storage.folderName ? 'Change folder' : 'Save my progress to a folder'}
            </Button>
          )}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Backup</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() =>
              void exportBackup().then(() => setToast('Backup downloaded'))
            }
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
          {state.prefs.lastBackup
            ? new Date(state.prefs.lastBackup).toLocaleString('en-AU')
            : 'Never'}
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
          <p>This deletes completions, submissions, quiz attempts and uploaded files on this device.</p>
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
          <p>This cannot be undone unless you have a backup.</p>
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

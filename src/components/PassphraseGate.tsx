import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { BUILT_IN_FIREBASE_CONFIG } from '../cloud/projectConfig';
import { Button } from './ui';

const OFFLINE_KEY = 'devops-academy-offline-session';

export function PassphraseGate() {
  const { ready, cloudReady, state, connectCloudSync } = useStore();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(() => sessionStorage.getItem(OFFLINE_KEY) === '1');
  const inputRef = useRef<HTMLInputElement>(null);

  const needsGate = ready && !cloudReady && !offline;

  useEffect(() => {
    if (needsGate) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [needsGate]);

  if (!needsGate) return null;

  const isFirstSetup = !state.storage.cloud.enabled && !state.storage.cloud.lastCloudSync;

  const onUnlock = async () => {
    setError(null);
    const key = pass.trim();
    if (key.length < 12) {
      setError('Use at least 12 characters.');
      return;
    }
    if (isFirstSetup && key !== confirm.trim()) {
      setError('Passphrases do not match.');
      return;
    }
    setBusy(true);
    try {
      await connectCloudSync(BUILT_IN_FIREBASE_CONFIG, key, { remember });
      sessionStorage.removeItem(OFFLINE_KEY);
      setPass('');
      setConfirm('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not unlock cloud sync');
    } finally {
      setBusy(false);
    }
  };

  const onOffline = () => {
    sessionStorage.setItem(OFFLINE_KEY, '1');
    setOffline(true);
  };

  return (
    <div class="backdrop passphrase-gate" role="presentation">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passphrase-gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="passphrase-gate-title">{isFirstSetup ? 'Create sync passphrase' : 'Unlock cloud sync'}</h2>
        <p style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.45 }}>
          {isFirstSetup
            ? 'Choose a strong passphrase to encrypt your progress in Firestore. You will need the same passphrase on your phone and laptop.'
            : 'Enter your sync passphrase to load and save progress across devices.'}
        </p>

        <div class="field">
          <label for="gate-pass">Sync passphrase</label>
          <input
            ref={inputRef}
            id="gate-pass"
            type="password"
            autoComplete="new-password"
            spellcheck={false}
            value={pass}
            onInput={(e) => setPass((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isFirstSetup) void onUnlock();
            }}
            placeholder="At least 12 characters"
          />
        </div>

        {isFirstSetup && (
          <div class="field">
            <label for="gate-pass-confirm">Confirm passphrase</label>
            <input
              id="gate-pass-confirm"
              type="password"
              autoComplete="new-password"
              spellcheck={false}
              value={confirm}
              onInput={(e) => setConfirm((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onUnlock();
              }}
              placeholder="Type it again"
            />
          </div>
        )}

        <label class="check-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14 }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
            style={{ marginTop: 3 }}
          />
          <span>
            Remember on this device
            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13 }}>
              Stores the passphrase in this browser only. Uncheck to require it every visit (more secure).
            </span>
          </span>
        </label>

        {error && <div class="field-error">{error}</div>}

        <div class="dialog-actions" style={{ flexWrap: 'wrap' }}>
          <Button variant="ghost" disabled={busy} onClick={onOffline}>
            Continue offline
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => void onUnlock()}>
            {busy ? 'Unlocking…' : isFirstSetup ? 'Create & connect' : 'Unlock'}
          </Button>
        </div>
      </div>
    </div>
  );
}

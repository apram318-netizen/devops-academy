/**
 * Generates src/data/forgeWeeks.ts — per-week SquadForge tasks with exact steps.
 * Run: node scripts/generate-forge-weeks.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'src/data/curriculum.json'), 'utf8'));

/** @typedef {{ id: string, title: string, steps: string[] }} Task */
/** @typedef {{ summary: string, outcome: string, tasks: Task[] }} WeekPlan */

/** @type {Record<string, WeekPlan[]>} */
const plans = {};

function t(id, title, steps) {
  return { id, title, steps };
}

function week(summary, outcome, tasks) {
  return { summary, outcome, tasks };
}

// ─── DEV101 ───────────────────────────────────────────────────────────────
plans.dev101 = [
  week(
    'Bootstrap the SquadForge monorepo and the host directories the agent will own.',
    'Repo exists locally with ADR-001; /var/lib/squadforge and /etc/squadforge exist with correct ownership and modes.',
    [
      t('clone-layout', 'Create the monorepo folder layout', [
        'Open a terminal and run: `mkdir -p ~/src && cd ~/src`',
        'Run: `git init squadforge && cd squadforge`',
        'Create folders exactly: `mkdir -p cmd/api cmd/orchestrator cmd/forgectl cmd/host-agent internal deploy/compose deploy/systemd games docs/adr scripts host`',
        'Create empty keepers so Git tracks empty dirs: `find . -type d -empty -exec touch {}/.gitkeep \\;`',
        'Commit: `git add -A && git commit -m "chore: scaffold SquadForge monorepo"`',
      ]),
      t('adr-001', 'Write ADR-001 (why game-server SaaS)', [
        'Create file `docs/adr/001-why-squadforge.md`',
        'Fill sections with headings: Context, Decision, Consequences, Alternatives considered',
        'In Decision, state in one paragraph: clans click start → Forge launches an isolated dedicated-server container, returns join info, health-checks, idle-stops, meters hours',
        'In Alternatives, list always-on VPS and home hosting and why they fail for your product',
        'Commit: `git add docs/adr/001-why-squadforge.md && git commit -m "docs: ADR-001 why SquadForge"`',
      ]),
      t('host-paths', 'Create and lock down host agent paths', [
        'On your lab VM (or local Linux), run as root/sudo: `sudo mkdir -p /var/lib/squadforge/worlds /var/lib/squadforge/logs /etc/squadforge`',
        'Create a group: `sudo groupadd -f squadforge`',
        'Create a system user for the agent: `sudo useradd -r -g squadforge -d /var/lib/squadforge -s /usr/sbin/nologin forge-agent || true`',
        'Set ownership: `sudo chown -R forge-agent:squadforge /var/lib/squadforge /etc/squadforge`',
        'Set modes: `sudo chmod 750 /var/lib/squadforge /etc/squadforge && sudo chmod 2770 /var/lib/squadforge/worlds`',
        'Prove it: `namei -l /var/lib/squadforge/worlds` and paste output into `host/permissions-check.txt` in the repo, then commit',
      ]),
      t('readme-root', 'Add root README that explains the product in 10 lines', [
        'Create `README.md` with: product one-liner, repo map (cmd/, deploy/, games/), how to run later (`docker compose` placeholder), link to ADR-001',
        'Commit the README',
      ]),
    ],
  ),
  week(
    'Model clan/host users and how the host agent will track game-server processes.',
    'Lab users exist; a PID-file pattern is documented and a tiny watcher script lists/signals a dummy process.',
    [
      t('users', 'Create clan-operator and agent users on the lab host', [
        'Create group `clans` and users `clan-alpha` and `clan-beta` with home dirs under `/home`',
        'Add `forge-agent` to group `squadforge` only (no login shell)',
        'Document in `docs/host-users.md`: who owns worlds, who may signal game PIDs, who may edit `/etc/squadforge`',
        'Show evidence: `id clan-alpha`, `id forge-agent`, `getent group squadforge`',
      ]),
      t('pid-sketch', 'Sketch PID tracking for one game process', [
        'Create `host/agent/README.md` describing: start → write PID to `/var/lib/squadforge/run/<session>.pid` → poll `/proc/<pid>` → on death restart or mark stopped',
        'Draw a 5-box sequence (ASCII is fine) for crash → restart',
      ]),
      t('watcher', 'Write a tiny Bash watcher for a sleep process', [
        'Create `scripts/pid-watch-demo.sh` that: starts `sleep 300 &`, writes PID to a file under `/tmp/squadforge-demo.pid`, loops checking `kill -0 $PID`, prints ALIVE/DEAD',
        'Make executable and run it once; paste terminal output into `host/agent/demo-output.txt`',
        'Commit scripts + evidence',
      ]),
    ],
  ),
  week(
    'Install runtime deps the way a game host will, and draft the host-agent systemd unit.',
    'Packages installed; a systemd unit file for forge-host-agent exists (even if the binary is a stub script).',
    [
      t('packages', 'Install host packages you will need before Docker/K8s', [
        'On Ubuntu lab: `sudo apt update && sudo apt install -y curl jq ca-certificates gnupg sqlite3`',
        'Record versions in `host/packages.txt` (`dpkg -l curl jq sqlite3`)',
        'Commit `host/packages.txt`',
      ]),
      t('stub-agent', 'Create a stub host-agent script', [
        'Create `cmd/host-agent/agent.sh` that loops: echo timestamp + hostname to `/var/lib/squadforge/logs/agent.log` every 10s',
        '`chmod +x cmd/host-agent/agent.sh`',
        'Copy or symlink into place for the unit: document `sudo install -m 755 cmd/host-agent/agent.sh /usr/local/bin/forge-host-agent`',
      ]),
      t('systemd-unit', 'Draft systemd unit for the host agent', [
        'Create `deploy/systemd/forge-host-agent.service` with: `[Unit] Description=SquadForge host agent`, `[Service] User=forge-agent Group=squadforge ExecStart=/usr/local/bin/forge-host-agent Restart=on-failure`, `[Install] WantedBy=multi-user.target`',
        'Install: `sudo cp deploy/systemd/forge-host-agent.service /etc/systemd/system/ && sudo systemctl daemon-reload`',
        'Enable and start: `sudo systemctl enable --now forge-host-agent`',
        'Prove: `systemctl status forge-host-agent` and `journalctl -u forge-host-agent -n 20 --no-pager` → save to `host/agent-journal.txt`',
      ]),
    ],
  ),
  week(
    'Write Bash helpers: start-check, disk guard, and unhealthy exit codes.',
    'Three scripts under scripts/ pass shellcheck and behave as specified.',
    [
      t('start-check', 'Write scripts/start-check.sh', [
        'Script takes `--session ID` and checks: config file `/etc/squadforge/<ID>.env` exists, worlds dir writable, free disk > 1GB',
        'Exit 0 if all ok; exit 1 with a clear message on stderr otherwise',
        'Add a `--help` that prints usage',
      ]),
      t('disk-guard', 'Write scripts/disk-guard.sh', [
        'Script checks `df -P /var/lib/squadforge` and exits 2 if use% >= threshold (default 85, override with `--max-pct`)',
        'Print JSON when `--json` is passed: `{"path":"...","use_pct":N,"ok":true|false}`',
      ]),
      t('health-exit', 'Write scripts/host-health.sh (A1 precursor)', [
        'Report CPU load (1m), MemAvailable, disk use% for `/var/lib/squadforge`, and whether `forge-host-agent` is active',
        'Exit non-zero if any check fails; support `--json`',
        'Run `shellcheck scripts/*.sh` with zero warnings; commit scripts + sample output',
      ]),
    ],
  ),
  week(
    'Parse logs the way crash-loop detection will: grep, awk, jq.',
    'A log sample exists; a parser script prints crash counts and last error lines as JSON.',
    [
      t('sample-log', 'Create a sample game/server log', [
        'Create `games/samples/server.log` with at least 30 lines mixing INFO, WARN, ERROR, and a repeated crash stack snippet',
        'Commit the sample',
      ]),
      t('parse-script', 'Write scripts/parse-game-log.sh', [
        'Accept a log path arg; print: count of ERROR lines, count of lines matching `crash|panic|oom` (case-insensitive), last 5 ERROR lines',
        'With `--json`, emit a single JSON object with those fields',
        'Run against the sample and save stdout to `games/samples/parse-output.json`',
      ]),
      t('awk-one-liners', 'Document three one-liners in docs/log-recipes.md', [
        'Top 5 repeating ERROR messages',
        'Requests/lines per minute histogram (bucket by HH:MM)',
        'Extract session IDs if present (regex of your choice)',
        'Commit the doc with the exact commands you used',
      ]),
    ],
  ),
  week(
    'Plan disk layout for world saves and prove LVM growth notes.',
    'docs/storage.md describes mounts/quotas; a dry-run growth checklist exists.',
    [
      t('layout-doc', 'Write docs/storage.md', [
        'Specify: `/var/lib/squadforge/worlds/<session>/` for live worlds, `/var/lib/squadforge/logs/` for logs, future S3 for cold backups',
        'State target free space before Friday surge (e.g. 20% free)',
        'Note how quotas would map per clan later',
      ]),
      t('lvm-notes', 'Document LVM growth steps you would run', [
        'In the same doc, write numbered steps: `lsblk` → extend VG/LV → `resize2fs`/`xfs_growfs`',
        'If you have a lab disk, perform a +1GB grow and paste before/after `df -h` into `host/lvm-evidence.txt`',
        'If you cannot grow, write a dry-run with expected commands only and mark it DRY-RUN',
      ]),
    ],
  ),
  week(
    'Add logrotate and a systemd timer that scrapes host metrics for the future API.',
    'logrotate rule installed; timer writes a metrics JSON file every 5 minutes.',
    [
      t('logrotate', 'Add logrotate for agent + game logs', [
        'Create `deploy/logrotate/squadforge` with daily rotate, keep 7, compress, for `/var/lib/squadforge/logs/*.log`',
        'Install: `sudo cp deploy/logrotate/squadforge /etc/logrotate.d/squadforge`',
        'Test: `sudo logrotate -d /etc/logrotate.d/squadforge` and save output',
      ]),
      t('metrics-script', 'Write scripts/scrape-host-metrics.sh', [
        'Emit JSON to `/var/lib/squadforge/logs/metrics-latest.json` with: load1, mem_available_kb, disk_use_pct, agent_active (bool), ts (unix)',
        'Ensure forge-agent can write the file (permissions)',
      ]),
      t('timer', 'Install systemd timer every 5 minutes', [
        'Create `deploy/systemd/forge-metrics.service` (oneshot ExecStart=script) and `forge-metrics.timer` (OnUnitActiveSec=5min)',
        'Enable timer; prove with `systemctl list-timers | grep forge` and a sample metrics JSON committed as `host/metrics-sample.json`',
      ]),
    ],
  ),
  week(
    'Harden SSH into a bastion/jump pattern for Forge operators.',
    'sshd_config hardened; ProxyJump (or equivalent) documented; password/root login off.',
    [
      t('sshd', 'Harden sshd', [
        'Set `PasswordAuthentication no`, `PermitRootLogin no`, `AllowUsers` to your operator account',
        '`sudo sshd -t && sudo systemctl reload ssh` (or sshd)',
        'Save `sshd -T | egrep "passwordauthentication|permitrootlogin|allowusers"` to `host/sshd-T.txt`',
      ]),
      t('keys', 'Operator key only', [
        'Generate an ed25519 key for Forge ops if needed: `ssh-keygen -t ed25519 -f ~/.ssh/forge_ops -N ""`',
        'Install public key in `authorized_keys` for the operator user',
        'Document in `docs/bastion.md` how you will ProxyJump through bastion → game host later',
      ]),
      t('fail2ban-optional', 'Optional: fail2ban or equivalent note', [
        'Either enable fail2ban for sshd or write why you deferred it to DEV204 security week',
        'Commit the note under `docs/bastion.md`',
      ]),
    ],
  ),
  week(
    'Baseline noisy-game-server resource behaviour (load, memory, OOM notes).',
    'A baseline report exists with numbers and an OOM/cgroup note for later K8s limits.',
    [
      t('baseline', 'Capture a 10-minute baseline', [
        'Run a noisy workload (e.g. `stress-ng` if available, or a game container, or a CPU loop)',
        'While it runs, capture: `uptime`, `free -h`, `df -h /var/lib/squadforge`, `ps aux --sort=-%mem | head`',
        'Save into `host/baseline-noisy.txt` with timestamps',
      ]),
      t('oom-notes', 'Write docs/oom-and-cgroups.md', [
        'Explain what the OOM killer does in plain English',
        'List which Forge processes you would protect first (API vs game vs agent)',
        'Write the future cgroup/K8s limit you expect for one game slot (CPU/memory guess with units)',
      ]),
    ],
  ),
  week(
    'Use strace/lsof on a stuck process so tenant-server debugging is muscle memory.',
    'You have captured strace and lsof evidence on a deliberate stuck demo.',
    [
      t('stuck-demo', 'Create a stuck-process demo', [
        'Start a process that blocks (e.g. `sleep 9999` or a script waiting on a missing FIFO)',
        'Record its PID',
      ]),
      t('lsof-strace', 'Inspect with lsof and strace', [
        'Run `sudo lsof -p PID` and save to `host/lsof-stuck.txt`',
        'Run `sudo strace -p PID -f -o host/strace-stuck.txt` for ~5 seconds then interrupt',
        'Write 5 bullet findings in `docs/debug-stuck-process.md` (what files/sockets, what syscall it waits on)',
      ]),
    ],
  ),
  week(
    'Write two mini-incident reports as if SquadForge production paged you.',
    'Two postmortem-style write-ups live under docs/incidents/ with real commands from your labs.',
    [
      t('incident-1', 'Incident: disk full on worlds volume', [
        'Create `docs/incidents/2026-disk-full-worlds.md` with: symptom, timeline, commands, root cause, fix, prevention',
        'Use real command output from your storage/logrotate work',
      ]),
      t('incident-2', 'Incident: host agent crash loop', [
        'Create `docs/incidents/2026-agent-crashloop.md` with the same sections',
        'Include `journalctl` evidence and the systemd Restart= behaviour you observed',
        'Add `docs/incidents/README.md` index linking both',
      ]),
    ],
  ),
];

// ─── DEV102 ───────────────────────────────────────────────────────────────
plans.dev102 = [
  week('Draw Forge network zones and prove L2/L3 basics on lab VMs.', 'Zone diagram + ARP/IP evidence committed.', [
    t('zones', 'Draw control-plane vs game-traffic zones', [
      'Create `docs/network/zones.md` with ASCII or Mermaid: Player → join DNS/port → game host; Operator → TLS → API; API → orchestrator → game host',
      'Label which flows are UDP/TCP and which are HTTPS only',
    ]),
    t('lab-arp', 'Capture ARP/IP on lab VMs', [
      'On two VMs: `ip -br a`, `ip route`, `ip neigh`',
      'Save to `docs/network/lab-l2l3.txt`',
    ]),
  ]),
  week('Allocate CIDRs for Forge envs — this becomes the Terraform VPC later.', 'CIDR table committed with no overlaps and growth headroom.', [
    t('cidr-table', 'Build the CIDR spreadsheet/table', [
      'Create `docs/network/cidr-table.md` for 10.0.0.0/16 across dev/staging/prod × 3 AZs × public/private/game/db',
      'Ensure no overlaps; leave ≥50% free; reserve a VPN/lab range',
    ]),
    t('quiz-evidence', 'Prove subnetting speed', [
      'Complete a timed subnetting drill (your choice of bank) and screenshot score ≥90% into `docs/network/subnet-quiz.png` or note the score in the md file',
    ]),
  ]),
  week('Separate control-API ports from game ports; practise ss on a running process.', 'Port matrix + ss evidence for a listener.', [
    t('port-matrix', 'Write the port matrix', [
      'Create `docs/network/ports.md`: API 443/tcp (edge), API app 8080/tcp, game example 25565/tcp (Minecraft) or your chosen game, metrics 9090/tcp internal-only',
    ]),
    t('ss-practice', 'Inspect listeners', [
      'Start any listener (python -m http.server or a container) and run `ss -tulpn`',
      'Save output to `docs/network/ss-listeners.txt` and mark which line is the Forge-like service',
    ]),
  ]),
  week('Design join DNS: session-id.play.squadforge.local and practise dig.', 'DNS design doc + dig evidence for lab names.', [
    t('dns-design', 'Document join DNS', [
      'Write `docs/network/join-dns.md`: pattern `<session>.play.squadforge.local` → A/AAAA or SRV; later Route 53',
      'Include TTL recommendation for short-lived servers',
    ]),
    t('dig-lab', 'Practise dig', [
      'Add lab entries in `/etc/hosts` or dnsmasq for two fake sessions',
      'Run `dig +short session1.play.squadforge.local` (or `getent hosts`) and save to `docs/network/dig-join.txt`',
    ]),
  ]),
  week('Put the control API behind HTTP with clear start/stop/join status codes.', 'nginx or Caddy stubs return documented status codes for Forge routes.', [
    t('route-map', 'Define HTTP routes', [
      'Create `docs/api/http-routes.md`: POST /v1/servers, GET /v1/servers/{id}, POST /v1/servers/{id}/stop, GET /healthz',
      'Assign status codes: 201 create, 200 ok, 404 missing, 409 conflict, 503 overloaded',
    ]),
    t('stub-proxy', 'Stub the edge with nginx/Caddy', [
      'Add `deploy/compose/edge/nginx.conf` (or Caddyfile) that reverse-proxies `/` to `127.0.0.1:8080` and serves a static `/healthz` 200 if upstream down (document behaviour)',
      'Run it and curl the routes; save `docs/api/curl-http.txt`',
    ]),
  ]),
  week('Terminate TLS for the control API with your own CA.', 'Client trusts your CA; HTTPS curl works; game ports explicitly not TLS-terminated here.', [
    t('ca', 'Create a lab CA and server cert', [
      'Under `deploy/certs/`: generate CA key/cert and `api.squadforge.local` cert (openssl commands in a script `scripts/gen-lab-certs.sh`)',
      'Document trust install for your OS',
    ]),
    t('tls-edge', 'Enable HTTPS on the reverse proxy', [
      'Point nginx/Caddy at the certs; force HTTP→HTTPS',
      'curl -v https://api.squadforge.local/healthz and save to `docs/api/curl-tls.txt`',
      'Add a threat note in `docs/network/tls-scope.md`: game traffic stays on dedicated ports',
    ]),
  ]),
  week('Route lab VMs so game hosts are not public by accident.', 'Routing table evidence + written NAT intent.', [
    t('routes', 'Capture and explain routes', [
      'On game-host VM: `ip route` before/after any NAT change; save `docs/network/routes.txt`',
      'Write intent: players hit published game port only; management via bastion',
    ]),
  ]),
  week('Firewall default deny; open only API and required game ports.', 'nftables/iptables/ufw rules committed and verified.', [
    t('fw-rules', 'Write and apply default-deny rules', [
      'Create `deploy/firewall/forge-lab.rules` (ufw or nft) allowing SSH from bastion CIDR, 443 to API, one game port',
      'Apply on lab VM; `sudo ufw status verbose` or `nft list ruleset` → `docs/network/firewall.txt`',
    ]),
  ]),
  week('Run nginx/Caddy as ALB-like reverse proxy with health checks.', 'Upstream health-check behaviour demonstrated.', [
    t('health-proxy', 'Configure upstream health', [
      'Point proxy at two backends (second can be a deliberate dead port)',
      'Show that bad upstream is skipped; save curl loop output to `docs/api/lb-health.txt`',
    ]),
  ]),
  week('tcpdump a join attempt; describe unreachable on the wire.', 'pcap or tcpdump text + written analysis.', [
    t('pcap', 'Capture a join/connect attempt', [
      'While curling or connecting to a game/API port, run `sudo tcpdump -ni any port 443 or port 25565 -c 50`',
      'Save to `docs/network/join-tcpdump.txt`',
      'Write `docs/network/unreachable.md`: what SYN without SYN-ACK looks like vs TLS alert vs DNS failure',
    ]),
  ]),
  week('Document VPN/bastion access for operators.', 'bastion.md complete with ProxyJump or WireGuard steps that work on your lab.', [
    t('bastion-final', 'Operator access runbook', [
      'Update `docs/bastion.md` with exact ssh config Host blocks (ProxyJump) or WireGuard peer config',
      'Prove you can reach a private VM only via bastion; paste success commands',
    ]),
  ]),
];

// ─── DEV103 ───────────────────────────────────────────────────────────────
plans.dev103 = [
  week('Init Git layout and collaboration files for the Forge monorepo.', 'Branch protection notes + PR template + conventional commits documented.', [
    t('layout-check', 'Verify monorepo layout matches Forge', [
      'Ensure folders exist: cmd/api, cmd/orchestrator, cmd/forgectl, deploy, games, docs',
      'Add `.gitignore` for binaries, .env, IDE files',
    ]),
    t('pr-template', 'Add PR + commit conventions', [
      'Create `.github/pull_request_template.md` with checklist: tests, docs, SquadForge impact',
      'Create `CONTRIBUTING.md` requiring conventional commits (`feat:`, `fix:`, `docs:`)',
    ]),
  ]),
  week('Trunk-based flow: protect main and tag when Compose MVP works.', 'Documented branch rules; first tag plan written.', [
    t('trunk', 'Write branching rules', [
      'In CONTRIBUTING.md: short-lived branches, PR required, no direct push to main',
      'Create empty `CHANGELOG.md` with Unreleased section',
    ]),
  ]),
  week('Python helpers only as glue; start Go module path for Forge.', 'go.mod exists; Python kept out of hot path with a note.', [
    t('gomod', 'Initialize Go module', [
      'From repo root: `go mod init github.com/<you>/squadforge` (use your path)',
      'Create `cmd/forgectl/main.go` that prints `forgectl 0.0.1` and exits 0',
      '`go run ./cmd/forgectl` works',
    ]),
    t('python-boundary', 'Document Python boundary', [
      'Write `docs/language-boundary.md`: Go = API/orchestrator/CLI; Python = optional ops glue only',
    ]),
  ]),
  week('Keep boto3/Python out of the hot path; optional glue only.', 'Any Python script lives under scripts/ and is marked optional.', [
    t('optional-glue', 'Optional script or skip note', [
      'Either add `scripts/optional/list_s3_stub.py` with argparse --help, or write SKIPPED with reason in `scripts/optional/README.md`',
    ]),
  ]),
  week('Optional: push a placeholder world tarball to S3 — or skip with reason.', 'Either S3 evidence or explicit skip linked to Go focus.', [
    t('world-tarball', 'Create placeholder world', [
      'mkdir -p games/worlds && echo hello > games/worlds/README.txt && tar czf games/worlds/demo-world.tgz -C games/worlds README.txt',
      'If AWS configured: upload to a private bucket and record URI; else document local-only path',
    ]),
  ]),
  week('Add tests for any Python glue; prepare Go test layout.', 'go test ./... passes for forgectl; pytest if Python exists.', [
    t('go-test', 'First Go test', [
      'Add a tiny function in internal/version and test it',
      '`go test ./...` passes; commit',
    ]),
  ]),
  week('Build forgectl in Go (cobra-style): login stub, servers list, start, stop.', 'CLI has subcommands and --help for each.', [
    t('cobra', 'Implement forgectl commands', [
      'Add dependencies as needed (`go get` cobra or hand-roll flag subcommands)',
      'Implement: `forgectl version`, `forgectl login` (stub stores token in ~/.config/squadforge/credentials)`, `forgectl servers list`, `forgectl servers start --game minecraft`, `forgectl servers stop --id ID`',
      'Start/stop can talk to a fake in-memory map for now',
      'Commit with README usage section',
    ]),
  ]),
  week('Go API: health/ready/metrics + /v1/servers CRUD stub with structured logs.', 'API runs locally; curl evidence committed.', [
    t('api-main', 'Create cmd/api/main.go', [
      'Listen on :8080',
      'GET /healthz → 200 ok',
      'GET /readyz → 200 when ready flag true',
      'GET /metrics → Prometheus text with a simple counter',
      'CRUD under /v1/servers using an in-memory store (map) with JSON bodies',
      'Log each request as JSON with request_id',
    ]),
    t('api-curl', 'Prove with curl', [
      'Script `scripts/smoke-api.sh` that creates, lists, stops a server',
      'Save output to `docs/api/smoke.txt`',
    ]),
  ]),
  week('Dockerize API + orchestrator stub; run a public game image; Compose network.', 'docker compose up brings API + db + redis + gamesvc.', [
    t('dockerfiles', 'Multi-stage Dockerfile for API', [
      'Create `deploy/docker/Dockerfile.api` multi-stage, non-root user, exposes 8080',
      'Create stub `cmd/orchestrator/main.go` that logs "reconcile loop" every 5s and Dockerfile for it',
    ]),
    t('compose', 'Write compose file', [
      'Create `deploy/compose/docker-compose.yml` with services: api, orchestrator, postgres, redis, gamesvc (use a small public image e.g. `itzg/minecraft-server` with EULA or a tiny `nginx` as placeholder if Minecraft is too heavy — document choice)',
      'Networks: frontend + backend; only api published to localhost',
      '`docker compose -f deploy/compose/docker-compose.yml up -d` and save `docker compose ps` to `docs/compose-ps.txt`',
    ]),
  ]),
  week('Harden images: non-root, scan, document Compose as local platform.', 'Trivy (or scan) report committed; image size noted.', [
    t('scan', 'Scan API image', [
      'Build image; run Trivy or `docker scout` if available; save summary to `docs/security/trivy-api.txt`',
      'Fix Criticals you can fix; document accepted risks',
    ]),
  ]),
  week('Restart policies + healthchecks so a crashed game container restarts.', 'Compose healthcheck + restart policy demonstrated.', [
    t('restart', 'Game service resilience', [
      'Add healthcheck and `restart: unless-stopped` to gamesvc',
      'Kill the game container PID 1 once; show it returns; save evidence `docs/compose-restart.txt`',
      'Document signals/PID 1 notes in `docs/containers/pid1.md`',
    ]),
  ]),
];

// ─── DEV104 ───────────────────────────────────────────────────────────────
plans.dev104 = [
  week('AWS account hygiene for SquadForge.', 'MFA on, billing alarm set, region chosen with latency note.', [
    t('account', 'Account baseline', [
      'Enable MFA on root/ops user; create billing alarm SNS email for estimated charges > $20',
      'Write `docs/aws/account.md` with home region + why (player latency)',
    ]),
  ]),
  week('IAM roles for future orchestrator (IRSA mindset).', 'IAM policy JSON drafted with least privilege.', [
    t('iam', 'Draft orchestrator policy', [
      'Create `deploy/aws/iam/orchestrator-policy.json` allowing only ECR pull, specific S3 prefix, SQS queue, and describe for EC2/EKS you need',
      'Write why each statement exists in `docs/aws/iam.md`',
    ]),
  ]),
  week('Design and (optionally) build the SquadForge VPC.', 'Diagram + CLI or console evidence for 3-tier layout.', [
    t('vpc', 'VPC for Forge', [
      'Follow A1: public ALB subnets, private app, private db; SGs for API vs game ports',
      'Save diagram to `docs/aws/vpc.md` and teardown notes',
    ]),
  ]),
  week('Decide ASG/node strategy for game hosts before EKS.', 'Node bootstrap user-data sketch committed.', [
    t('userdata', 'User-data sketch', [
      'Create `deploy/aws/userdata/game-node.sh` installing docker or kubelet placeholders, writing `/etc/squadforge/node.env`',
      'Document ASG sizing guess for 50 concurrent servers',
    ]),
  ]),
  week('ALB for control API + Route 53 notes; NLB note for game ports.', 'DNS/LB design written against your VPC.', [
    t('lb-dns', 'LB design', [
      'Update `docs/aws/edge.md`: ALB→API target group health on /healthz; Route 53 api.; NLB/game ports trade-offs',
    ]),
  ]),
  week('S3 buckets for world backups.', 'Bucket config documented: Block Public Access, versioning, lifecycle.', [
    t('s3', 'World backup bucket', [
      'Create bucket (or document intended name) with BPA on, versioning on, lifecycle to IA after 30d',
      'Record settings in `docs/aws/s3-worlds.md`',
    ]),
  ]),
  week('RDS Postgres + Redis sizing notes for Forge metadata/queue.', 'Sizing doc with instance classes and why.', [
    t('data', 'Data stores', [
      'Write `docs/aws/data-stores.md`: RDS Postgres for tenants/sessions; Redis/SQS for jobs; sizes for lab vs prod',
    ]),
  ]),
  week('ECR repos for api, orchestrator, game images.', 'Repos exist (or Terraform later) with lifecycle policy notes.', [
    t('ecr', 'ECR repos', [
      'Create repos `squadforge-api`, `squadforge-orchestrator`, `squadforge-game-minecraft` (or document)',
      'Add lifecycle keep-last-10 note in `docs/aws/ecr.md`',
    ]),
  ]),
  week('CloudWatch alarm stubs for API 5xx and node CPU.', 'Alarms created or fully specified as IaC-ready JSON.', [
    t('alarms', 'Alarm stubs', [
      'Create `deploy/aws/cloudwatch/alarms.md` with metric, threshold, action for API 5xx and node CPU',
    ]),
  ]),
  week('Secrets and encryption choices for Forge.', 'KMS/Secrets Manager plan written; no secrets in git.', [
    t('secrets', 'Secrets plan', [
      'Write `docs/aws/secrets.md`: DB password in Secrets Manager; TLS certs; never commit .env',
      'Add .env.example with empty placeholders only',
    ]),
  ]),
  week('SAA-style review of YOUR SquadForge architecture + cost.', 'Architecture one-pager + Friday-night cost estimate.', [
    t('review', 'Architecture + cost', [
      'Create `docs/aws/architecture.md` diagram and 5 SAA topics mapped to Forge decisions',
      'Create `docs/aws/cost-friday-night.md` estimating 50 concurrent servers',
    ]),
  ]),
];

// ─── DEV201 ───────────────────────────────────────────────────────────────
plans.dev201 = [
  week('Stand up kind and deploy the Forge control plane namespace.', 'kind running; namespace squadforge-dev exists.', [
    t('kind', 'Create kind cluster', [
      'Install kind/kubectl if needed; `kind create cluster --name squadforge`',
      '`kubectl create namespace squadforge-dev`',
      'Save `kubectl get ns` to `docs/k8s/kind.md`',
    ]),
  ]),
  week('Deploy API + orchestrator as Deployments with resources.', 'Pods Running with requests/limits set.', [
    t('workloads', 'Manifests', [
      'Create `deploy/k8s/api-deploy.yaml` and `orchestrator-deploy.yaml` with requests/limits',
      'Apply; `kubectl -n squadforge-dev get pods -o wide` evidence',
    ]),
  ]),
  week('Services for API; document how join IP/port is published.', 'ClusterIP/NodePort choice documented; curl via port-forward works.', [
    t('svc', 'API Service', [
      'Create Service for API; `kubectl port-forward` and curl /healthz',
      'Write `docs/k8s/join-publishing.md` for game Server NodePort vs LB',
    ]),
  ]),
  week('ConfigMaps/Secrets for game presets; no passwords in images.', 'ConfigMap applied; Secret for DB URL; image has no secrets.', [
    t('config', 'Config + Secret', [
      'ConfigMap `game-presets` with a minecraft preset JSON',
      'Secret `forge-db` with dummy DSN; mount into API',
    ]),
  ]),
  week('Ingress for API; game port Service trade-offs.', 'Ingress controller works for API host.', [
    t('ingress', 'API Ingress', [
      'Install ingress-nginx on kind if needed; Ingress for api.squadforge.local',
      'Evidence curl via ingress',
    ]),
  ]),
  week('Probes + HPA on API; PDB notes for orchestrator.', 'HPA exists; probes on API containers.', [
    t('hpa', 'Probes and HPA', [
      'Add liveness/readiness probes to API',
      'Create HPA targeting CPU 70%; document PDB intent for orchestrator',
    ]),
  ]),
  week('NetworkPolicies: isolate tenants; API can reach orchestrator.', 'NetworkPolicy YAMLs applied and tested.', [
    t('netpol', 'Policies', [
      'Default deny in namespace; allow API→orchestrator; deny game↔game (document test)',
    ]),
  ]),
  week('PVCs for world data; backup job idea to S3.', 'PVC mounted in a game pod stub; backup CronJob sketched.', [
    t('pvc', 'World PVC', [
      'PVC + pod mounting `/worlds`; CronJob YAML that echoes backup (real S3 later)',
    ]),
  ]),
  week('RBAC for orchestrator ServiceAccount.', 'Role/RoleBinding least privilege applied.', [
    t('rbac', 'Orchestrator RBAC', [
      'SA + Role allowing get/list/watch/create/delete on pods/services in namespace only',
      'Bind; prove with `kubectl auth can-i`',
    ]),
  ]),
  week('Helm or Kustomize package for SquadForge.', 'One command deploys/updates control plane.', [
    t('package', 'Package', [
      'Choose Kustomize overlay or Helm chart under `deploy/k8s/chart`',
      'Document `kubectl apply -k` or `helm upgrade --install`',
    ]),
  ]),
  week('EKS path checklist; optional mesh only on control plane.', 'EKS migration checklist committed; mesh OPTIONAL note.', [
    t('eks-path', 'EKS checklist', [
      'Write `docs/k8s/eks-path.md`: IRSA, LB controller, node groups, migrating kind manifests',
      'OPTIONAL: one paragraph on Linkerd/Istio for API only — do not block',
    ]),
  ]),
];

// ─── DEV202 ───────────────────────────────────────────────────────────────
plans.dev202 = [
  week('Terraform project layout + remote state for Forge.', 'Backend configured; first `terraform init` works.', [
    t('tf-layout', 'Layout', [
      'Create `deploy/terraform/` with versions.tf, backend.tf (S3+DynamoDB or local for lab), providers.tf',
      '`terraform init` evidence in docs/terraform/init.txt',
    ]),
  ]),
  week('VPC module from your DEV102/104 design.', 'Module applied or planned with outputs.', [
    t('vpc-mod', 'VPC module', [
      'modules/vpc with public/private/game/db subnets matching cidr-table.md',
      'Root calls module; outputs vpc_id, subnet ids',
    ]),
  ]),
  week('IAM + IRSA for orchestrator.', 'IRSA role resource committed.', [
    t('irsa', 'IRSA', [
      'Terraform for IAM role trusted by Forge SA; attach orchestrator policy',
    ]),
  ]),
  week('Modules: language patterns you will reuse.', 'Variable validation + outputs documented.', [
    t('lang', 'Module quality', [
      'Add variables with validation; outputs; README in module',
    ]),
  ]),
  week('Lifecycle and dependencies for EKS-related resources.', 'depends_on and create/destroy order documented.', [
    t('lifecycle', 'Order', [
      'Document destroy order in docs/terraform/destroy-order.md',
    ]),
  ]),
  week('Workspaces or directories: dev/staging/prod.', 'Three envs exist with separate tfvars.', [
    t('envs', 'Environments', [
      'env/dev.tfvars staging.tfvars prod.tfvars with CIDRs and sizes',
    ]),
  ]),
  week('Policy / HCP notes; tflint+Checkov locally.', 'CI-ready lint commands documented and run once.', [
    t('lint', 'Lint', [
      'Run tflint and Checkov (or document install); save summaries',
    ]),
  ]),
  week('terraform plan in CI mindset; no laptop apply to prod.', 'GitHub Action or script that runs plan on PR.', [
    t('plan-ci', 'Plan only', [
      'Add workflow or script `scripts/tf-plan.sh`; forbid apply in prod from laptop in CONTRIBUTING',
    ]),
  ]),
  week('Optional Ansible for bastion only.', 'Ansible role OR explicit skip; Terraform remains source of truth.', [
    t('ansible', 'Bastion optional', [
      'Either `ansible/bastion.yml` hardens sshd or write SKIPPED',
    ]),
  ]),
  week('EKS module + node groups sized for game density.', 'EKS terraform sketched/applied in lab account.', [
    t('eks', 'EKS', [
      'Module or resources for cluster + node group; document density assumption',
    ]),
  ]),
  week('Destroy drills in dev; state recovery notes.', 'Timed destroy/rebuild notes committed.', [
    t('destroy', 'Drill', [
      'Destroy dev and rebuild; write time taken and recovery tips in docs/terraform/rebuild.md',
    ]),
  ]),
];

// ─── DEV203 ───────────────────────────────────────────────────────────────
plans.dev203 = [
  week('CI/CD concepts mapped to SquadForge delivery.', 'Delivery diagram: PR→build→scan→staging→prod.', [
    t('diagram', 'Delivery diagram', [
      'Write docs/delivery/overview.md with the happy path for Forge images',
    ]),
  ]),
  week('GitHub Actions: test + build Go images on PR.', 'Workflow file exists and runs on PR.', [
    t('gha', 'Workflow', [
      'Create `.github/workflows/ci.yml`: checkout, setup-go, go test, docker build api',
    ]),
  ]),
  week('Jenkins parity pipeline (or documented equivalent).', 'Jenkinsfile or skip-with-reason if no Jenkins.', [
    t('jenkins', 'Jenkinsfile', [
      'Add Jenkinsfile with same stages as GHA, or docs/delivery/jenkins-skip.md',
    ]),
  ]),
  week('Scan + sign + push to ECR via OIDC.', 'OIDC role notes + Trivy gate on Critical.', [
    t('publish', 'Publish', [
      'Extend workflow: Trivy fail on CRITICAL; push to ECR with OIDC (or document blockers)',
    ]),
  ]),
  week('Versioning and releases for Forge.', 'Tagging scheme + changelog process written.', [
    t('semver', 'Semver', [
      'Document vMAJOR.MINOR.PATCH for api/orchestrator; game pack versions separate',
    ]),
  ]),
  week('Deployment strategies for control plane.', 'Choose rolling vs canary; write ADR.', [
    t('strategy', 'ADR deploy', [
      'docs/adr/00X-control-plane-deploy.md deciding canary for API',
    ]),
  ]),
  week('Argo CD app for SquadForge manifests.', 'Argo CD app YAML committed; sync explained.', [
    t('argo', 'Argo CD', [
      'deploy/gitops/application-squadforge.yaml pointing at deploy/k8s',
      'docs/delivery/argocd.md with sync waves notes',
    ]),
  ]),
  week('Progressive delivery / canary for API.', 'Rollouts manifest or documented substitute.', [
    t('canary', 'Canary', [
      'Argo Rollouts (or nginx canary) for API; analysis on 5xx',
    ]),
  ]),
  week('Infra pipelines + game image catalog updates.', 'Pipeline updates game image tags via PR.', [
    t('catalog', 'Game catalog pipeline', [
      'Document how games/catalog.yaml version bumps flow to cluster',
    ]),
  ]),
  week('Supply-chain checklist in SECURITY.md.', 'SECURITY.md with signing, SBOM, secret scanning.', [
    t('supply', 'SECURITY.md', [
      'Add SECURITY.md with checklist used by CI',
    ]),
  ]),
  week('End-to-end: merge → players can start a server in staging.', 'Smoke demo script + recorded evidence.', [
    t('e2e', 'E2E smoke', [
      'scripts/e2e-staging.sh: login, start server, health, stop',
      'Save output docs/delivery/e2e-staging.txt',
    ]),
  ]),
];

// ─── DEV204 ───────────────────────────────────────────────────────────────
plans.dev204 = [
  week('SRE principles applied to SquadForge SLOs.', 'SLO ADR drafted (API availability, time-to-join, crash budget).', [
    t('slo-adr', 'SLO ADR', [
      'docs/adr/0YY-squadforge-slos.md with three SLOs and error budget policy',
    ]),
  ]),
  week('Prometheus metrics on API/orchestrator.', 'Metrics scraped; list of metric names committed.', [
    t('metrics', 'Emit metrics', [
      'Ensure /metrics has request latency histogram and servers_started_total',
      'docs/observability/metrics.md lists them',
    ]),
  ]),
  week('Grafana dashboard “time to join”.', 'Dashboard JSON exported in repo.', [
    t('dash', 'Dashboard', [
      'deploy/observability/grafana-time-to-join.json with panels for latency and start failures',
    ]),
  ]),
  week('Logs and traces for control plane + game containers.', 'Log labels + trace note committed.', [
    t('logs', 'Log pipeline', [
      'Document labels: namespace, session_id, clan_id; how to query a failed start',
    ]),
  ]),
  week('Alerting: start failures, crash loops, disk full.', 'Alert rules YAML + routing to phone app.', [
    t('alerts', 'Alert rules', [
      'deploy/observability/alerts.yaml with burn-rate or threshold rules; runbook links',
    ]),
  ]),
  week('Incident response runbooks for Forge.', 'Three runbooks with exact kubectl/aws commands.', [
    t('runbooks', 'Runbooks', [
      'docs/runbooks/server-wont-start.md',
      'docs/runbooks/node-pressure.md',
      'docs/runbooks/image-pull-backoff.md',
    ]),
  ]),
  week('Postmortem practice on a Forge fault you inject.', 'One blameless postmortem committed.', [
    t('pm', 'Postmortem', [
      'Inject a fault; write docs/incidents/ using the course template',
    ]),
  ]),
  week('AWS security audit against Forge IAM/S3/SG.', 'Prowler or manual checklist results ranked.', [
    t('aws-sec', 'Audit', [
      'Run prowler or manual CIS-ish checklist; docs/security/aws-audit.md ranked remediations',
    ]),
  ]),
  week('Kubernetes security for Forge namespaces.', 'kube-bench/kube-hunter notes or manual RBAC/netpol review.', [
    t('k8s-sec', 'K8s audit', [
      'docs/security/k8s-audit.md with findings on SA privileges and exposed Services',
    ]),
  ]),
  week('Abuse flow + metering export.', 'Suspend-tenant steps + vCPU-hours export script stub.', [
    t('abuse-meter', 'Abuse + metering', [
      'docs/ops/abuse.md: report → suspend → kill servers',
      'scripts/metering-export.sh stub writing CSV hours per clan',
    ]),
  ]),
  week('Game day #1 on staging Forge; optional Kafka only if ready.', 'Game-day report committed; Kafka OPTIONAL note.', [
    t('gameday', 'Game day', [
      'Run 3 faults; docs/gamedays/0001.md with timeline',
      'OPTIONAL Kafka: one paragraph deferral unless Redis/SQS mastered',
    ]),
  ]),
];

// ─── DEV301 ───────────────────────────────────────────────────────────────
plans.dev301 = [
  week('One-command bootstrap for SquadForge (kind or EKS).', 'README bootstrap section works for a reviewer on an empty machine/account.', [
    t('bootstrap', 'Bootstrap script', [
      'Create `scripts/bootstrap.sh` that brings up local kind+Forge or documents AWS apply',
      'README: prerequisites, one command up, one command down',
      'Have a friend/reviewer follow it; note gaps fixed',
    ]),
  ]),
  week('Failure lab Kubernetes scenarios 1–10 on Forge.', '10 postmortems linked from docs/incidents/.', [
    t('k8s-fail', 'Scenarios 1–10', [
      'For each scenario: reproduce on Forge path, write postmortem, add a guard',
      'Index in docs/incidents/README.md',
    ]),
  ]),
  week('Failure lab AWS/network scenarios 11–20 against your VPC/join path.', '10 postmortems for join/control failures.', [
    t('aws-fail', 'Scenarios 11–20', [
      'Same standard: postmortem + guard per scenario on Forge networking/AWS',
    ]),
  ]),
  week('Failure lab Terraform/CI scenarios 21–30.', '10 postmortems on delivery/IaC faults.', [
    t('tfci-fail', 'Scenarios 21–30', [
      'Plant/fix pipeline and terraform faults; postmortems + guards',
    ]),
  ]),
  week('Blind game day + cost review + optional polish.', 'Game-day report + cost review committed.', [
    t('blind', 'Blind game day', [
      'Someone else injects 5 faults; you IC; write report + cost review docs/gamedays/blind.md',
    ]),
  ]),
  week('Portfolio: architecture, demo, hire-me narrative.', 'Public-ready README + ≤3 min demo script covering start→join→idle stop→invoice.', [
    t('portfolio', 'Portfolio pack', [
      'Polish README with architecture diagram first',
      'Record demo ≤3 minutes; link in README',
      'Write docs/portfolio/narrative.md mapping units to Forge milestones',
      'Three short posts from best postmortems (can be md in docs/blog/)',
    ]),
  ]),
];

// Overlay expanded plans for units authored in forge-plans-data.json
const overlayPath = path.join(__dirname, 'forge-plans-data.json');
if (fs.existsSync(overlayPath)) {
  const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
  for (const [unitId, weeks] of Object.entries(overlay.plans ?? {})) {
    plans[unitId] = weeks;
  }
}

// Validate counts match curriculum
for (const u of curriculum.units) {
  const p = plans[u.id];
  if (!p) throw new Error(`Missing plans for ${u.id}`);
  if (p.length !== u.weeks.length) {
    throw new Error(`${u.id}: plans ${p.length} != weeks ${u.weeks.length}`);
  }
}

const lines = [];
lines.push('/** Auto-generated by scripts/generate-forge-weeks.mjs — edit that script, not this file. */');
lines.push('import type { ForgeWeekPlan } from \'./squadforge\';');
lines.push('');
lines.push('export const FORGE_WEEK_PLANS: Record<string, ForgeWeekPlan[]> = {');
for (const [unitId, weeks] of Object.entries(plans)) {
  lines.push(`  ${JSON.stringify(unitId)}: [`);
  for (const w of weeks) {
    lines.push('    {');
    lines.push(`      summary: ${JSON.stringify(w.summary)},`);
    lines.push(`      outcome: ${JSON.stringify(w.outcome)},`);
    lines.push('      tasks: [');
    for (const task of w.tasks) {
      lines.push('        {');
      lines.push(`          id: ${JSON.stringify(task.id)},`);
      lines.push(`          title: ${JSON.stringify(task.title)},`);
      lines.push(`          steps: ${JSON.stringify(task.steps, null, 0)},`);
      lines.push('        },');
    }
    lines.push('      ],');
    lines.push('    },');
  }
  lines.push('  ],');
}
lines.push('};');
lines.push('');

const out = path.join(root, 'src/data/forgeWeeks.ts');
fs.writeFileSync(out, lines.join('\n'));
console.log('Wrote', out);
console.log(
  'Weeks:',
  Object.values(plans).reduce((n, w) => n + w.length, 0),
  'Tasks:',
  Object.values(plans).reduce((n, weeks) => n + weeks.reduce((a, w) => a + w.tasks.length, 0), 0),
);

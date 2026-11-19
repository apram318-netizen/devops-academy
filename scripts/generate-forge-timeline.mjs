/** Generates src/data/forgeTimeline.ts — real-world project phases with multi-subject links. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const L = (unitId, weekIndex, ...concepts) => ({ unitId, weekIndex, concepts });
const task = (id, title, steps, links) => ({ id, title, steps, links });
const phase = (id, title, goal, by, tasks) => ({ id, title, goal, by, tasks });

const phases = [
  phase(
    'p0',
    'P0 · Foundation',
    'Repo, ADR, host paths, and operator access sketched — enough to start building without cloud.',
    '2026-12-06',
    [
      task(
        'p0-repo',
        'Create SquadForge monorepo layout',
        [
          'mkdir -p ~/src && cd ~/src && git init squadforge && cd squadforge',
          'mkdir -p cmd/api cmd/orchestrator cmd/forgectl cmd/host-agent internal deploy/compose deploy/systemd deploy/k8s deploy/terraform games docs/adr scripts host',
          'find . -type d -empty -exec touch {}/.gitkeep \\;',
          'git add -A && git commit -m "chore: scaffold SquadForge monorepo"',
        ],
        [L('dev103', 1, 'Git repo layout', 'commit history'), L('dev101', 1, 'Directory tree', 'permissions mindset')],
      ),
      task(
        'p0-adr',
        'Write ADR-001: why game-server SaaS',
        [
          'Create docs/adr/001-why-squadforge.md with Context, Decision, Consequences, Alternatives',
          'Decision: clans click start → isolated dedicated-server container → join info → health → idle stop → meter hours',
          'git add docs/adr && git commit -m "docs: ADR-001"',
        ],
        [L('dev103', 2, 'Collaboration / docs in PRs'), L('dev104', 11, 'Architecture narrative')],
      ),
      task(
        'p0-paths',
        'Create host agent paths with correct ownership',
        [
          'sudo mkdir -p /var/lib/squadforge/worlds /var/lib/squadforge/logs /etc/squadforge',
          'sudo groupadd -f squadforge && sudo useradd -r -g squadforge -d /var/lib/squadforge -s /usr/sbin/nologin forge-agent || true',
          'sudo chown -R forge-agent:squadforge /var/lib/squadforge /etc/squadforge',
          'sudo chmod 750 /var/lib/squadforge /etc/squadforge && sudo chmod 2770 /var/lib/squadforge/worlds',
          'namei -l /var/lib/squadforge/worlds | tee host/permissions-check.txt',
        ],
        [L('dev101', 1, 'Filesystem permissions', 'umask/setgid'), L('dev101', 2, 'Users and groups')],
      ),
      task(
        'p0-readme',
        'Root README: product + repo map',
        [
          'Write README.md: one-liner product, folder map, link to ADR-001, placeholder for compose up',
          'git add README.md && git commit -m "docs: root README"',
        ],
        [L('dev103', 1, 'Repo hygiene'), L('dev301', 6, 'Portfolio README later')],
      ),
      task(
        'p0-bastion',
        'Draft bastion / SSH jump notes',
        [
          'Write docs/bastion.md with Host forge-bastion and Host forge-game ProxyJump examples',
          'Note PasswordAuthentication no / PermitRootLogin no as target state',
        ],
        [L('dev101', 8, 'SSH hardening'), L('dev102', 11, 'VPN / hybrid access')],
      ),
      task(
        'p0-zones-sketch',
        'Sketch control-plane vs game-traffic zones',
        [
          'mkdir -p docs/network',
          'Create docs/network/zones.md: Player→join port→game host; Operator→TLS→API; API→orchestrator→game',
        ],
        [L('dev102', 1, 'Network models'), L('dev102', 3, 'TCP/UDP ports')],
      ),
    ],
  ),

  phase(
    'p1',
    'P1 · Vertical slice (Compose MVP)',
    'One command brings up API + DB + Redis + one game image; forgectl can start/stop a stub session.',
    '2027-01-11',
    [
      task(
        'p1-gomod',
        'Initialize Go module + forgectl stub',
        [
          'go mod init github.com/<you>/squadforge',
          'Create cmd/forgectl/main.go printing forgectl 0.0.1',
          'go run ./cmd/forgectl',
        ],
        [L('dev103', 7, 'Go for ops'), L('dev103', 1, 'Module in monorepo')],
      ),
      task(
        'p1-api',
        'Build Go API: health, ready, metrics, /v1/servers CRUD',
        [
          'Create cmd/api/main.go listening :8080',
          'GET /healthz, /readyz, /metrics; JSON CRUD /v1/servers in-memory',
          'Structured JSON logs with request_id',
          'scripts/smoke-api.sh creates/lists/stops; tee docs/api/smoke.txt',
        ],
        [L('dev103', 8, 'Go services'), L('dev102', 5, 'HTTP status codes'), L('dev103', 6, 'Testing mindset')],
      ),
      task(
        'p1-cli',
        'forgectl: login stub, servers list/start/stop',
        [
          'Subcommands: version, login (token in ~/.config/squadforge/credentials), servers list|start|stop',
          'Talk to local API or in-memory map; document in README',
        ],
        [L('dev103', 7, 'Go CLI'), L('dev103', 2, 'Conventional usage docs')],
      ),
      task(
        'p1-scripts',
        'Host health + log parse helpers',
        [
          'scripts/host-health.sh (CPU/mem/disk/agent; --json; non-zero on fail)',
          'scripts/parse-game-log.sh against games/samples/server.log',
          'shellcheck scripts/*.sh',
        ],
        [L('dev101', 4, 'Bash scripting'), L('dev101', 5, 'grep/awk/jq'), L('dev101', 9, 'Performance signals')],
      ),
      task(
        'p1-docker',
        'Dockerize API + orchestrator stub',
        [
          'deploy/docker/Dockerfile.api multi-stage non-root',
          'cmd/orchestrator/main.go reconcile loop log every 5s + Dockerfile',
        ],
        [L('dev103', 9, 'Docker fundamentals'), L('dev103', 10, 'Production images')],
      ),
      task(
        'p1-compose',
        'Compose stack: api, orchestrator, postgres, redis, gamesvc',
        [
          'deploy/compose/docker-compose.yml — only API published to localhost',
          'gamesvc: public dedicated-server image or nginx placeholder (document choice)',
          'docker compose -f deploy/compose/docker-compose.yml up -d --build',
          'docker compose ps | tee docs/compose-ps.txt',
        ],
        [L('dev103', 9, 'Compose networks'), L('dev103', 11, 'Container lifecycle'), L('dev101', 3, 'Services mindset')],
      ),
      task(
        'p1-restart',
        'Healthchecks + restart so crashed game returns',
        [
          'Add healthcheck + restart: unless-stopped on gamesvc',
          'docker kill gamesvc once; prove it returns; docs/compose-restart.txt',
          'docs/containers/pid1.md',
        ],
        [L('dev103', 11, 'Restart policies'), L('dev101', 2, 'Signals / processes')],
      ),
      task(
        'p1-timer',
        'systemd timer scraping host metrics JSON',
        [
          'scripts/scrape-host-metrics.sh → /var/lib/squadforge/logs/metrics-latest.json',
          'deploy/systemd/forge-metrics.service + .timer every 5m',
          'Enable timer; commit host/metrics-sample.json',
        ],
        [L('dev101', 7, 'Logs and scheduling'), L('dev101', 3, 'systemd units')],
      ),
    ],
  ),

  phase(
    'p2',
    'P2 · Join path & edge',
    'Players have a join DNS story; control API is HTTPS behind a proxy; firewalls default deny.',
    '2027-01-25',
    [
      task(
        'p2-ports',
        'Port matrix: API vs game vs metrics',
        [
          'docs/network/ports.md: 443 edge, 8080 API, 9090 metrics internal, game port (e.g. 25565), SSH bastion-only',
          'ss -tulpn while API runs → docs/network/ss-listeners.txt',
        ],
        [L('dev102', 3, 'TCP/UDP'), L('dev102', 1, 'Zones'), L('dev103', 8, 'API listen port')],
      ),
      task(
        'p2-dns',
        'Join DNS design + lab names',
        [
          'docs/network/join-dns.md: <session>.play.squadforge.local + short TTL',
          'Add two lab hosts entries; dig/getent → docs/network/dig-join.txt',
        ],
        [L('dev102', 4, 'DNS'), L('dev104', 5, 'Route 53 later')],
      ),
      task(
        'p2-http-routes',
        'Document HTTP routes + status codes',
        [
          'docs/api/http-routes.md: POST/GET/stop servers, /healthz with 201/200/404/409/503',
        ],
        [L('dev102', 5, 'HTTP'), L('dev103', 8, 'API handlers')],
      ),
      task(
        'p2-tls',
        'Lab CA + TLS reverse proxy for API',
        [
          'scripts/gen-lab-certs.sh → deploy/certs/',
          'deploy/compose/edge/nginx.conf HTTPS → API; HTTP→HTTPS',
          'curl -v https://api.squadforge.local/healthz | tee docs/api/curl-tls.txt',
          'docs/network/tls-scope.md: game ports not terminated here',
        ],
        [L('dev102', 6, 'TLS and certificates'), L('dev102', 9, 'Proxies'), L('dev103', 9, 'Edge container')],
      ),
      task(
        'p2-fw',
        'Default-deny firewall for lab',
        [
          'deploy/firewall/forge-lab.ufw.md: allow 22 from bastion CIDR, 443 API, one game port',
          'Apply; ufw status / nft list → docs/network/firewall.txt',
        ],
        [L('dev102', 8, 'Firewalls'), L('dev101', 8, 'Bastion SSH')],
      ),
      task(
        'p2-pcap',
        'tcpdump a join/connect + unreachable analysis',
        [
          'sudo tcpdump -ni any port 443 or gameport -c 40 | tee docs/network/join-tcpdump.txt',
          'docs/network/unreachable.md: DNS fail vs SYN no ACK vs TLS alert vs 502',
        ],
        [L('dev102', 10, 'Packet analysis'), L('dev102', 7, 'Routing/NAT symptoms')],
      ),
      task(
        'p2-cidr',
        'CIDR table for future VPC (design now)',
        [
          'docs/network/cidr-table.md for 10.0.0.0/16 × envs × AZs × public/private/game/db',
          'No overlaps; ≥50% free; VPN reservation',
        ],
        [L('dev102', 2, 'Subnetting'), L('dev104', 3, 'VPC design')],
      ),
    ],
  ),

  phase(
    'p3',
    'P3 · AWS footing',
    'Account hygiene, VPC/IAM/S3/ECR/RDS plan for Forge; cost alarm on; architecture one-pager.',
    '2027-02-15',
    [
      task(
        'p3-account',
        'AWS account hygiene',
        [
          'MFA on; billing alarm > USD 20 via SNS email',
          'docs/aws/account.md: home region + latency rationale',
        ],
        [L('dev104', 1, 'AWS foundations'), L('dev104', 11, 'Cost')],
      ),
      task(
        'p3-iam',
        'Orchestrator IAM policy (IRSA mindset)',
        [
          'deploy/aws/iam/orchestrator-policy.json least privilege ECR/S3/SQS/describe',
          'docs/aws/iam.md bullet per statement',
        ],
        [L('dev104', 2, 'IAM'), L('dev204', 8, 'AWS security later')],
      ),
      task(
        'p3-vpc',
        '3-tier VPC for Forge (build or stage)',
        [
          'docs/aws/vpc.md diagram: public ALB, private app, db, game SG notes',
          'CLI/console evidence + teardown notes in docs/aws/vpc-cli.md',
        ],
        [L('dev104', 3, 'VPC'), L('dev102', 2, 'CIDRs'), L('dev102', 7, 'NAT')],
      ),
      task(
        'p3-edge-aws',
        'ALB + DNS design for control API',
        [
          'docs/aws/edge.md: ALB→/healthz; Route 53 api.; NLB trade-offs for game ports',
        ],
        [L('dev104', 5, 'Load balancers and DNS'), L('dev102', 9, 'LB concepts')],
      ),
      task(
        'p3-s3',
        'S3 world backup bucket settings',
        [
          'Bucket (or intended name): BPA, versioning, lifecycle → IA 30d',
          'docs/aws/s3-worlds.md',
        ],
        [L('dev104', 6, 'S3'), L('dev101', 6, 'Disk / world layout')],
      ),
      task(
        'p3-data',
        'RDS + Redis/SQS sizing notes',
        [
          'docs/aws/data-stores.md: Postgres for metadata; Redis/SQS for jobs; lab vs prod sizes',
        ],
        [L('dev104', 7, 'Databases'), L('dev103', 8, 'API persistence')],
      ),
      task(
        'p3-ecr',
        'ECR repos for api, orchestrator, game',
        [
          'Create or document squadforge-api, orchestrator, game-minecraft',
          'docs/aws/ecr.md keep-last-10',
        ],
        [L('dev104', 10, 'Containers on AWS'), L('dev103', 10, 'Image publish')],
      ),
      task(
        'p3-secrets',
        'Secrets plan — nothing secret in git',
        [
          '.env.example placeholders only',
          'docs/aws/secrets.md: Secrets Manager for DB; never commit .env',
        ],
        [L('dev104', 9, 'Secrets and encryption'), L('dev203', 10, 'Supply chain later')],
      ),
      task(
        'p3-arch-cost',
        'Architecture + Friday-night cost estimate',
        [
          'docs/aws/architecture.md + 5 SAA topics mapped to Forge',
          'docs/aws/cost-friday-night.md for 50 concurrent servers',
        ],
        [L('dev104', 11, 'Architecture and cost'), L('dev204', 11, 'Capacity later')],
      ),
    ],
  ),

  phase(
    'p4',
    'P4 · Run on Kubernetes',
    'Forge control plane on kind; join publishing documented; policies and packaging in place; EKS path written.',
    '2027-03-15',
    [
      task(
        'p4-kind',
        'kind cluster + squadforge-dev namespace',
        [
          'kind create cluster --name squadforge',
          'kubectl create namespace squadforge-dev',
          'kubectl get ns | tee docs/k8s/kind.md',
        ],
        [L('dev201', 1, 'Kubernetes architecture'), L('dev103', 9, 'Images to pull')],
      ),
      task(
        'p4-workloads',
        'Deploy API + orchestrator with requests/limits',
        [
          'deploy/k8s/api-deploy.yaml + orchestrator-deploy.yaml',
          'kubectl apply; get pods -o wide | tee docs/k8s/pods.txt',
        ],
        [L('dev201', 2, 'Workloads'), L('dev103', 8, 'API binary')],
      ),
      task(
        'p4-svc-join',
        'API Service + join publishing notes',
        [
          'ClusterIP Service; port-forward; curl /healthz → docs/k8s/healthz.txt',
          'docs/k8s/join-publishing.md NodePort vs LB for game ports',
        ],
        [L('dev201', 3, 'Services and traffic'), L('dev102', 4, 'Join DNS'), L('dev102', 3, 'Game ports')],
      ),
      task(
        'p4-config',
        'ConfigMaps/Secrets — no passwords in images',
        [
          'game-presets ConfigMap; forge-db Secret; mount into API',
          'describe pod mounts → docs/k8s/mounts.txt',
        ],
        [L('dev201', 4, 'Config and health'), L('dev104', 9, 'Secrets')],
      ),
      task(
        'p4-ingress',
        'Ingress for API on kind',
        [
          'Install ingress-nginx if needed; Ingress for api.squadforge.local',
          'curl with Host header → docs/k8s/ingress.txt',
        ],
        [L('dev201', 3, 'Ingress'), L('dev102', 9, 'Reverse proxy')],
      ),
      task(
        'p4-hpa',
        'Probes + HPA; PDB intent',
        [
          'liveness/readiness on API; HPA CPU 70%',
          'docs/k8s/pdb.md for orchestrator',
        ],
        [L('dev201', 5, 'Scheduling and scaling'), L('dev201', 4, 'Probes')],
      ),
      task(
        'p4-netpol-rbac',
        'NetworkPolicies + orchestrator RBAC',
        [
          'default-deny + allow API→orchestrator',
          'SA/Role/RoleBinding; kubectl auth can-i → docs/k8s/rbac.txt',
        ],
        [L('dev201', 7, 'Cluster security'), L('dev102', 8, 'Segmentation'), L('dev204', 9, 'K8s security later')],
      ),
      task(
        'p4-pvc',
        'World PVC + backup CronJob sketch',
        [
          'PVC worlds-pvc mounted at /worlds on stub/game pod',
          'CronJob YAML echoing backup (S3 later)',
        ],
        [L('dev201', 6, 'Storage'), L('dev104', 6, 'S3 backups'), L('dev101', 6, 'Disk layout')],
      ),
      task(
        'p4-package-eks',
        'Kustomize/Helm package + EKS path checklist',
        [
          'deploy/k8s/overlays/dev or chart; docs/k8s/package.md one-liner',
          'docs/k8s/eks-path.md: IRSA, LB controller, node groups',
        ],
        [L('dev201', 9, 'Packaging'), L('dev201', 11, 'Amazon EKS'), L('dev201', 10, 'Troubleshooting')],
      ),
    ],
  ),

  phase(
    'p5',
    'P5 · Platform as code',
    'Terraform encodes VPC/EKS/IAM/ECR; env tfvars; plan-only for prod; destroy/rebuild drill in dev.',
    '2027-04-05',
    [
      task(
        'p5-layout',
        'Terraform project + backend init',
        [
          'deploy/terraform/: versions.tf providers.tf backend.tf',
          'terraform init | tee docs/terraform/init.txt',
        ],
        [L('dev202', 1, 'Terraform basics'), L('dev202', 3, 'State')],
      ),
      task(
        'p5-vpc-mod',
        'VPC module from cidr-table.md',
        [
          'modules/vpc matching docs/network/cidr-table.md',
          'Root module outputs vpc_id + subnet ids',
        ],
        [L('dev202', 2, 'Language'), L('dev202', 4, 'Modules'), L('dev104', 3, 'VPC design'), L('dev102', 2, 'CIDRs')],
      ),
      task(
        'p5-irsa',
        'IAM + IRSA for orchestrator',
        [
          'Terraform IAM role trusted by Forge SA; attach policy from P3',
          'docs/terraform/irsa.md',
        ],
        [L('dev202', 4, 'Modules'), L('dev104', 2, 'IAM'), L('dev201', 11, 'EKS IRSA')],
      ),
      task(
        'p5-envs',
        'dev/staging/prod tfvars + destroy order',
        [
          'env/*.tfvars with sizes/CIDRs',
          'docs/terraform/envs.md + destroy-order.md',
        ],
        [L('dev202', 6, 'Environments'), L('dev202', 5, 'Lifecycle')],
      ),
      task(
        'p5-eks',
        'EKS module / node group density',
        [
          'EKS + node group resources; docs/terraform/eks-density.md',
        ],
        [L('dev202', 10, 'Terraform for EKS'), L('dev201', 11, 'EKS'), L('dev104', 4, 'ASG/node sizing')],
      ),
      task(
        'p5-lint-ci',
        'tflint/Checkov + plan-only discipline',
        [
          'Run linters → docs/terraform/lint.txt',
          'scripts/tf-plan.sh; CONTRIBUTING: no laptop apply to prod',
        ],
        [L('dev202', 8, 'Testing IaC'), L('dev202', 7, 'Policy'), L('dev203', 9, 'Infra pipelines')],
      ),
      task(
        'p5-rebuild',
        'Destroy/rebuild drill in dev',
        [
          'Timed destroy+apply; docs/terraform/rebuild.md',
        ],
        [L('dev202', 11, 'Hygiene'), L('dev301', 1, 'Bootstrap later')],
      ),
    ],
  ),

  phase(
    'p6',
    'P6 · Delivery',
    'PR builds/scans/pushes; GitOps syncs Forge; canary for API; staging E2E start→stop.',
    '2027-04-26',
    [
      task(
        'p6-overview',
        'Delivery overview diagram',
        ['docs/delivery/overview.md: PR → build → scan → staging → prod'],
        [L('dev203', 1, 'CI/CD concepts')],
      ),
      task(
        'p6-gha',
        'GitHub Actions: test + docker build',
        [
          '.github/workflows/ci.yml: setup-go, go test, docker build api',
          'Prove a run; docs/delivery/ci-run.md',
        ],
        [L('dev203', 2, 'GitHub Actions'), L('dev103', 6, 'Tests in CI')],
      ),
      task(
        'p6-publish',
        'Trivy gate + ECR push via OIDC notes',
        [
          'Fail workflow on CRITICAL',
          'docs/delivery/ecr-oidc.md',
        ],
        [L('dev203', 4, 'Build and publish'), L('dev203', 10, 'Supply chain'), L('dev104', 10, 'ECR')],
      ),
      task(
        'p6-version',
        'Semver + changelog process',
        [
          'docs/delivery/versioning.md; keep CHANGELOG Unreleased updated',
        ],
        [L('dev203', 5, 'Versioning and releases'), L('dev103', 2, 'Tags')],
      ),
      task(
        'p6-argo',
        'Argo CD application for SquadForge',
        [
          'deploy/gitops/application-squadforge.yaml',
          'docs/delivery/argocd.md',
        ],
        [L('dev203', 7, 'GitOps with Argo CD'), L('dev201', 9, 'Manifests')],
      ),
      task(
        'p6-canary',
        'Canary / progressive delivery for API',
        [
          'Argo Rollouts or documented substitute; analysis on 5xx',
          'docs/adr for control-plane deploy strategy',
        ],
        [L('dev203', 8, 'Progressive delivery'), L('dev203', 6, 'Deployment strategies')],
      ),
      task(
        'p6-catalog',
        'Game catalog version bumps via PR',
        [
          'games/catalog.yaml + docs/delivery/game-catalog.md',
        ],
        [L('dev203', 5, 'Releases'), L('dev103', 11, 'Image tags')],
      ),
      task(
        'p6-e2e',
        'Staging E2E: login → start → health → stop',
        [
          'scripts/e2e-staging.sh',
          'tee docs/delivery/e2e-staging.txt',
        ],
        [L('dev203', 11, 'Pipeline reliability'), L('dev103', 7, 'forgectl')],
      ),
      task(
        'p6-security-md',
        'SECURITY.md supply-chain checklist',
        ['SECURITY.md aligned with CI gates'],
        [L('dev203', 10, 'Supply chain security'), L('dev204', 10, 'Compliance')],
      ),
    ],
  ),

  phase(
    'p7',
    'P7 · Production bar',
    'SLOs, dashboards, alerts, runbooks, abuse/metering, security audits, first game day.',
    '2027-05-17',
    [
      task(
        'p7-slo',
        'SLO ADR for SquadForge',
        [
          'docs/adr: API availability, time-to-join p95, crash-loop budget + error budget policy',
        ],
        [L('dev204', 1, 'SRE principles'), L('dev104', 11, 'Architecture')],
      ),
      task(
        'p7-metrics',
        'Prometheus metrics + Grafana time-to-join',
        [
          '/metrics: latency histogram + servers_started_total',
          'docs/observability/metrics.md',
          'deploy/observability/grafana-time-to-join.json',
        ],
        [L('dev204', 2, 'Prometheus'), L('dev204', 3, 'Dashboards'), L('dev103', 8, 'API /metrics')],
      ),
      task(
        'p7-logs',
        'Log/trace labels for failed starts',
        [
          'docs/observability/logs.md: namespace, session_id, clan_id + example query',
        ],
        [L('dev204', 4, 'Logs and traces'), L('dev101', 5, 'Log parsing')],
      ),
      task(
        'p7-alerts',
        'Alert rules + phone routing',
        [
          'deploy/observability/alerts.yaml: start failures, crash loops, disk full',
          'docs/observability/alerting.md',
        ],
        [L('dev204', 5, 'Alerting'), L('dev101', 6, 'Disk full')],
      ),
      task(
        'p7-runbooks',
        'Three runbooks with exact commands',
        [
          'docs/runbooks/server-wont-start.md',
          'docs/runbooks/node-pressure.md',
          'docs/runbooks/image-pull-backoff.md',
        ],
        [L('dev204', 6, 'Incident response'), L('dev201', 10, 'K8s troubleshooting'), L('dev101', 11, 'Troubleshooting method')],
      ),
      task(
        'p7-postmortem',
        'Inject a fault; write blameless postmortem',
        [
          'Break probe/image/config on purpose; docs/incidents/ write-up',
        ],
        [L('dev204', 7, 'Postmortems'), L('dev301', 2, 'Failure lab style')],
      ),
      task(
        'p7-audits',
        'AWS + K8s security audits ranked',
        [
          'docs/security/aws-audit.md',
          'docs/security/k8s-audit.md',
        ],
        [L('dev204', 8, 'AWS security'), L('dev204', 9, 'Kubernetes security')],
      ),
      task(
        'p7-abuse-meter',
        'Abuse suspend flow + metering stub',
        [
          'docs/ops/abuse.md: report → suspend → kill servers',
          'scripts/metering-export.sh CSV hours per clan',
        ],
        [L('dev204', 10, 'Compliance mindset'), L('dev103', 4, 'Python/ops glue optional')],
      ),
      task(
        'p7-gameday',
        'Game day #1 on staging',
        [
          '3 faults as IC; docs/gamedays/0001.md timeline',
        ],
        [L('dev204', 11, 'Capacity and chaos'), L('dev204', 6, 'Incident response')],
      ),
    ],
  ),

  phase(
    'p8',
    'P8 · Hardening & hire-me',
    'One-command bootstrap, failure portfolio, blind game day, demo start→join→idle stop→invoice.',
    '2027-06-20',
    [
      task(
        'p8-bootstrap',
        'One-command bootstrap + teardown',
        [
          'scripts/bootstrap.sh (kind path or documented AWS apply)',
          'README prerequisites + up/down',
          'Friend follows it; docs/bootstrap-feedback.md',
        ],
        [L('dev301', 1, 'Platform rebuild'), L('dev202', 11, 'Rebuild drills'), L('dev201', 1, 'kind')],
      ),
      task(
        'p8-fail-k8s',
        'Failure scenarios 1–10 on Forge K8s path',
        [
          '10 postmortems + guards; index docs/incidents/README.md',
        ],
        [L('dev301', 2, 'K8s failure lab'), L('dev201', 10, 'Troubleshooting'), L('dev204', 7, 'Postmortems')],
      ),
      task(
        'p8-fail-aws',
        'Failure scenarios 11–20 on join/AWS path',
        [
          '10 postmortems against VPC/join/TLS path',
        ],
        [L('dev301', 3, 'AWS/network failure lab'), L('dev102', 10, 'Packet analysis'), L('dev104', 3, 'VPC')],
      ),
      task(
        'p8-fail-tfci',
        'Failure scenarios 21–30 on Terraform/CI',
        [
          '10 postmortems on delivery/IaC faults',
        ],
        [L('dev301', 4, 'TF/CI failure lab'), L('dev202', 3, 'State'), L('dev203', 11, 'Pipeline reliability')],
      ),
      task(
        'p8-blind',
        'Blind game day + cost review',
        [
          '5 unknown faults; docs/gamedays/blind.md + cost section',
        ],
        [L('dev301', 5, 'Blind game day'), L('dev204', 11, 'Chaos'), L('dev104', 11, 'Cost')],
      ),
      task(
        'p8-portfolio',
        'Portfolio: README, ≤3 min demo, narrative, 3 posts',
        [
          'README led by architecture + start→join→stop→invoice',
          'Demo ≤3 min linked',
          'docs/portfolio/narrative.md mapping phases → skills',
          'docs/blog/ three short posts from best postmortems',
        ],
        [L('dev301', 6, 'Portfolio and interviews'), L('dev104', 11, 'Architecture'), L('dev204', 7, 'Postmortems')],
      ),
    ],
  ),
];

const lines = [];
lines.push('/** Auto-generated by scripts/generate-forge-timeline.mjs — edit that script. */');
lines.push('import type { ProjectPhase } from \'./squadforge\';');
lines.push('');
lines.push('export const FORGE_PHASES: ProjectPhase[] = ');
lines.push(JSON.stringify(phases, null, 2) + ' as ProjectPhase[];');
lines.push('');

const out = path.join(root, 'src/data/forgeTimeline.ts');
fs.writeFileSync(out, lines.join('\n'));
const tasks = phases.reduce((n, p) => n + p.tasks.length, 0);
const links = phases.reduce((n, p) => n + p.tasks.reduce((a, t) => a + t.links.length, 0), 0);
console.log('Wrote', out, 'phases', phases.length, 'tasks', tasks, 'links', links);

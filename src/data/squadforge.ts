/** SquadForge — on-demand game-server SaaS spine for the curriculum. */

export type ForgeMilestone = {
  id: string;
  title: string;
  by: string; // ISO date Sunday deadline
  unit: string;
  doneWhen: string;
};

export const SQUADFORGE = {
  name: 'SquadForge',
  tagline: 'Friends click start. You run the platform that spins up the game server.',
  problem:
    'Clans either burn money on always-on VPS boxes or host from home. Neither is reliable, isolated, or observable.',
  product:
    'A multi-tenant game-server SaaS: clans request a server, Forge launches an isolated dedicated-server container, returns join info, health-checks it, shuts it down when empty, and meters hours for billing.',
  stack: 'Go API + orchestrator + forgectl · Postgres · Redis/SQS · object storage for worlds · Compose → kind → EKS · Terraform · GitOps · SRE',
  language: 'Go (control plane). Shell for host labs. Game binary = upstream dedicated-server image.',
};

export const FORGE_MILESTONES: ForgeMilestone[] = [
  {
    id: 'm-host',
    title: 'Host bootstrap + health agent',
    by: '2026-12-13',
    unit: 'dev101',
    doneWhen: 'Linux node can run Forge helpers; health script ready for game-host monitoring',
  },
  {
    id: 'm-net',
    title: 'Join path + TLS edge design',
    by: '2027-01-03',
    unit: 'dev102',
    doneWhen: 'Network design for tenant servers + local TLS reverse proxy in front of control API',
  },
  {
    id: 'm-compose',
    title: 'Compose MVP (start/stop one game)',
    by: '2027-01-24',
    unit: 'dev103',
    doneWhen: 'docker compose up runs API, orchestrator, Postgres, Redis, and one game image; forgectl start/stop works',
  },
  {
    id: 'm-aws',
    title: 'AWS foundation for Forge',
    by: '2027-02-14',
    unit: 'dev104',
    doneWhen: 'VPC/IAM/ECR/S3/RDS plan applied or staged; cost alarms on',
  },
  {
    id: 'm-k8s',
    title: 'Game servers on kind → EKS path',
    by: '2027-03-07',
    unit: 'dev201',
    doneWhen: 'Forge deploys on kind; tenant server pods get join endpoints; EKS path documented',
  },
  {
    id: 'm-tf',
    title: 'Platform as code',
    by: '2027-03-28',
    unit: 'dev202',
    doneWhen: 'Terraform brings up VPC+EKS skeleton; workspaces for dev/staging/prod',
  },
  {
    id: 'm-gitops',
    title: 'CI + GitOps delivery',
    by: '2027-04-18',
    unit: 'dev203',
    doneWhen: 'Merge builds/scans/pushes images; Argo CD syncs Forge; canary for control plane',
  },
  {
    id: 'm-sre',
    title: 'SLOs, billing hooks, game day',
    by: '2027-05-09',
    unit: 'dev204',
    doneWhen: 'Dashboards+alerts; metering/quotas; game-day report on Forge',
  },
  {
    id: 'm-capstone',
    title: 'Industry-complete portfolio',
    by: '2027-06-20',
    unit: 'dev301',
    doneWhen: 'One-command bootstrap, failure portfolio, demo: start → join → idle stop → invoice',
  },
];

/** How this unit-week advances SquadForge (1-based week index within the unit). */
export function squadForgeApply(unitId: string, weekIndex1Based: number): string {
  const map: Record<string, string[]> = {
    dev101: [
      'Create the SquadForge monorepo skeleton and ADR-001 (why game-server SaaS). Practise permissions on paths the host agent will use (/var/lib/squadforge, /etc/squadforge).',
      'Model clan/host users and process signals. Sketch how the host agent will track game-server PIDs and restart crashed processes.',
      'Install packages the way a game host will: container runtime deps, systemd unit draft for the Forge host agent, journald logging.',
      'Write Bash helpers for SquadForge: start-check, disk guard, and a script that exits non-zero when a game host is unhealthy.',
      'Parse game/server logs with grep/awk/jq — the same skills the worker will use for crash-loop detection.',
      'Plan disk layout for world saves and logs (mounts, quotas). Document LVM growth for busy Friday nights.',
      'Add logrotate + a systemd timer that scrapes host metrics into a file the future API can ingest.',
      'Harden SSH to the Forge bastion/jump pattern you will use before Kubernetes exists.',
      'Baseline load/memory/disk for a noisy game server; note OOM killer behaviour for later cgroup limits.',
      'Use strace/lsof on a stuck game process so you can debug tenant servers later without panic.',
      'Write two mini-incident reports on host faults as if SquadForge production paged you.',
    ],
    dev102: [
      'Draw SquadForge network zones: control plane vs tenant game traffic; MAC/IP/ARP basics on your lab VMs.',
      'Allocate CIDRs for Forge (dev/staging/prod, public/private/game subnets) — this becomes the Terraform VPC later.',
      'Explain TCP ports for the control API vs UDP/TCP game ports; practise ss/netstat on a running dedicated server container.',
      'Design join DNS: session-id.play.squadforge.local → later Route 53. Practise dig against your lab names.',
      'Put the Forge control API behind HTTP with clear status codes for start/stop/join endpoints.',
      'Terminate TLS for the control API (own CA ok in lab); game traffic stays on dedicated ports with a written threat note.',
      'Route lab VMs so game hosts are not on the public default path without NAT intent.',
      'Firewall: default deny; only API and required game ports open per tenant experiment.',
      'Run nginx/Caddy as reverse proxy in front of the Go API; health-check the API like an ALB target.',
      'tcpdump a join attempt; write what “server unreachable” looks like on the wire.',
      'Document VPN/bastion access for operators managing SquadForge nodes (WireGuard or SSH ProxyJump).',
    ],
    dev103: [
      'Init Git monorepo layout: /cmd/api /cmd/orchestrator /cmd/forgectl /deploy /games. Conventional commits + PR template.',
      'Collaboration flow: trunk-based PRs for Forge; protect main; tag v0.1.0 when Compose MVP works.',
      'Python helpers only if needed for labs; prefer starting Go module scaffolding for forgectl.',
      'Keep Python ops scripts out of the hot path; document any boto3 helper as optional glue.',
      'Optional boto3: push a placeholder game world tarball to S3 — or skip if focusing purely on Go.',
      'pytest any Python glue; Go tests come next week.',
      'Build forgectl in Go (cobra): login stub, servers list, start, stop.',
      'Go API: /healthz /readyz /v1/servers CRUD stub with structured logs.',
      'Dockerize API + orchestrator; run a public dedicated-server image as gamesvc; Compose network between them.',
      'Multi-stage Go builds, non-root, Trivy scan; Compose file is the SquadForge local platform.',
      'Restart policies + healthchecks so a crashed Minecraft/Valheim container restarts; document signals/PID 1.',
    ],
    dev104: [
      'AWS account hygiene for SquadForge: MFA, billing alarm, regions/AZs chosen for player latency.',
      'IAM roles for Forge orchestrator (future IRSA): least privilege to EC2/EKS/ECR/S3/SQS.',
      'Design SquadForge VPC: public (LB), private (control plane), game subnets; SGs for API vs game ports.',
      'Decide ASG/node strategy for game hosts before EKS; user-data sketch for node bootstrap.',
      'ALB for control API + Route 53 records; NLB notes for raw game ports if needed.',
      'S3 buckets for world backups (versioning, Block Public Access, lifecycle).',
      'RDS Postgres for Forge metadata; ElastiCache/Redis for queue — size notes.',
      'ECR repos for api, orchestrator, and game images; lifecycle policies.',
      'CloudWatch alarms stubs for API 5xx and node CPU — wire fully in DEV204.',
      'Cost estimate: Friday night 50 concurrent servers; set budgets.',
      'SAA-style review of *your* SquadForge architecture diagram (not generic cram only).',
    ],
    dev201: [
      'kind cluster; deploy Forge control plane; namespace per env.',
      'Pods/Deployments for API+orchestrator; resource requests for game pods.',
      'Services for API; how join IP/port will be published to players.',
      'ConfigMaps/Secrets for game presets; never bake passwords into images.',
      'Ingress for API; document game port Service type (NodePort/LB) trade-offs.',
      'Probes + HPA on API; PDB notes for orchestrator.',
      'NetworkPolicies: tenants cannot talk to each other; API can reach orchestrator.',
      'PVCs for world data; backup job to S3.',
      'RBAC for orchestrator ServiceAccount.',
      'Helm/Kustomize package for SquadForge.',
      'Optional: Linkerd/Istio on control-plane services only; EKS migration checklist.',
    ],
    dev202: [
      'Terraform project layout for SquadForge; remote state.',
      'VPC module from your DEV102/104 design.',
      'IAM + IRSA for orchestrator.',
      'EKS module + node groups sized for game density.',
      'ECR/S3/RDS/Redis modules wired to Forge.',
      'Security groups matching game vs API ports.',
      'Workspaces or directories: dev/staging/prod.',
      'terraform plan in CI; no apply from laptops to prod.',
      'Module versioning for the game-node profile.',
      'Destroy drills in dev; state recovery notes.',
      'Optional Ansible only for bastion golden image — Terraform remains source of truth.',
    ],
    dev203: [
      'GitHub Actions: test + build Go images on PR.',
      'Scan + sign images; push to ECR.',
      'CD: staging auto-deploy control plane.',
      'Argo CD app for SquadForge manifests.',
      'Promote prod via PR/GitOps only.',
      'Progressive delivery / canary for API.',
      'Pipeline for game image updates (catalog versions).',
      'Broken-pipeline drill: recover a failed release.',
      'Webhooks from Forge to Discord/Slack on server.ready.',
      'Supply-chain checklist in repo SECURITY.md.',
      'End-to-end: merge → players can start a server in staging.',
    ],
    dev204: [
      'Prometheus metrics on API/orchestrator; Grafana dashboard “time to join”.',
      'Log pipeline for control plane + game containers.',
      'SLO/error budget ADR for SquadForge.',
      'Alerts: start failures, crash loops, disk full on world volumes.',
      'Runbooks: server won’t start; node pressure; image pull backoff.',
      'Load test Friday-night surge (many start requests).',
      'Security audit: IAM, NetworkPolicies, secrets, public ports.',
      'Abuse flow: suspend tenant → kill servers.',
      'Metering export: vCPU-hours per clan.',
      'Game day #1 on staging Forge.',
      'Optional Kafka only if Redis/SQS is mastered; write multi-region AA design doc.',
    ],
    dev301: [
      'One-command bootstrap README for SquadForge (kind or EKS).',
      'Failure scenarios 1–10 on Forge Kubernetes path; postmortems.',
      'Scenarios 11–20 AWS/network against your VPC/join path.',
      'Scenarios 21–30 Terraform/CI against your pipelines.',
      'Blind game day + cost review + optional mesh/UI polish.',
      'Portfolio: architecture, demo video (start→join→idle stop→invoice), hire-me narrative.',
    ],
  };

  const list = map[unitId];
  if (!list?.length) {
    return 'Advance SquadForge with a concrete change in the monorepo this week (PR + evidence).';
  }
  const idx = Math.max(1, weekIndex1Based) - 1;
  return list[Math.min(idx, list.length - 1)]!;
}

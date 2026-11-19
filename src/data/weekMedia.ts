/** Per-week concept media. Unit books in curriculum.json are unchanged. */
export type WeekVideo = {
  title: string;
  youtubeId: string;
  startSeconds?: number;
  endHint?: string;
  why: string;
  required?: boolean;
};

export type WeekRead = { title: string; url: string; why: string };

export type WeekMedia = {
  concepts: string[];
  videos: WeekVideo[];
  reads: WeekRead[];
};

export const weekMedia: Record<string, Record<number, WeekMedia>> = {
  dev101: {
    1: {
      concepts: [
        "Filesystem hierarchy",
        "rwx permissions",
        "umask"
      ],
      videos: [
        {
          title: "Linux full course — filesystem & permissions sections",
          youtubeId: "sWbUDq4S6Y8",
          why: "Core FS + chmod mental model",
          startSeconds: 900,
          required: true
        }
      ],
      reads: [
        {
          title: "Permissions (TLCL companion)",
          url: "https://linuxcommand.org/lc3_lts0090.php",
          why: "Permissions deep dive"
        }
      ]
    },
    2: {
      concepts: [
        "Users/groups",
        "sudo",
        "processes/signals"
      ],
      videos: [
        {
          title: "Linux full course — users & processes",
          youtubeId: "sWbUDq4S6Y8",
          why: "passwd/group + process control",
          startSeconds: 2400,
          required: true
        }
      ],
      reads: [
        {
          title: "man 7 signal",
          url: "https://man7.org/linux/man-pages/man7/signal.7.html",
          why: "Signal reference"
        }
      ]
    },
    3: {
      concepts: [
        "apt/dnf",
        "systemd",
        "journalctl"
      ],
      videos: [
        {
          title: "Linux full course — packages & services",
          youtubeId: "sWbUDq4S6Y8",
          why: "systemd unit model",
          startSeconds: 4200,
          required: true
        }
      ],
      reads: [
        {
          title: "systemd documentation",
          url: "https://systemd.io/",
          why: "Official systemd"
        }
      ]
    },
    4: {
      concepts: [
        "Bash scripting",
        "set -euo pipefail",
        "arguments"
      ],
      videos: [
        {
          title: "Linux full course — shell scripting",
          youtubeId: "sWbUDq4S6Y8",
          why: "Scripting fundamentals",
          startSeconds: 6000,
          required: true
        }
      ],
      reads: [
        {
          title: "Bash FAQ",
          url: "https://mywiki.wooledge.org/BashFAQ",
          why: "Correct Bash patterns"
        }
      ]
    },
    5: {
      concepts: [
        "grep/sed/awk",
        "pipes",
        "jq"
      ],
      videos: [
        {
          title: "Linux full course — text tools",
          youtubeId: "sWbUDq4S6Y8",
          why: "Pipelines and filters",
          startSeconds: 7200,
          required: true
        }
      ],
      reads: [
        {
          title: "jq manual",
          url: "https://jqlang.github.io/jq/manual/",
          why: "JSON filtering"
        }
      ]
    },
    6: {
      concepts: [
        "Block devices",
        "partitions",
        "filesystems",
        "mounting"
      ],
      videos: [
        {
          title: "Linux fundamentals (course segment)",
          youtubeId: "sWbUDq4S6Y8",
          why: "Supports this week: Disks and storage",
          startSeconds: 4000,
          required: true
        }
      ],
      reads: [
        {
          title: "ExplainShell",
          url: "https://explainshell.com/",
          why: "Decode commands while you lab"
        }
      ]
    },
    7: {
      concepts: [
        "/var/log",
        "rsyslog",
        "logrotate",
        "cron and crontab syntax"
      ],
      videos: [
        {
          title: "Linux fundamentals (course segment)",
          youtubeId: "sWbUDq4S6Y8",
          why: "Supports this week: Logs and scheduling",
          startSeconds: 4800,
          required: true
        }
      ],
      reads: [
        {
          title: "ExplainShell",
          url: "https://explainshell.com/",
          why: "Decode commands while you lab"
        }
      ]
    },
    8: {
      concepts: [
        "SSH keys",
        "ProxyJump",
        "sshd hardening"
      ],
      videos: [
        {
          title: "Linux full course — remote access / SSH",
          youtubeId: "sWbUDq4S6Y8",
          why: "Keys and hardening habits",
          startSeconds: 9000,
          required: true
        }
      ],
      reads: [
        {
          title: "SSH man ssh_config",
          url: "https://man.openbsd.org/ssh_config",
          why: "Config knobs"
        }
      ]
    },
    9: {
      concepts: [
        "Load average",
        "top and htop",
        "vmstat",
        "iostat"
      ],
      videos: [
        {
          title: "Linux fundamentals (course segment)",
          youtubeId: "sWbUDq4S6Y8",
          why: "Supports this week: Performance basics",
          startSeconds: 6400,
          required: true
        }
      ],
      reads: [
        {
          title: "ExplainShell",
          url: "https://explainshell.com/",
          why: "Decode commands while you lab"
        }
      ]
    },
    10: {
      concepts: [
        "strace",
        "lsof",
        "file descriptors",
        "ulimits"
      ],
      videos: [
        {
          title: "Linux fundamentals (course segment)",
          youtubeId: "sWbUDq4S6Y8",
          why: "Supports this week: Deep inspection",
          startSeconds: 7200,
          required: true
        }
      ],
      reads: [
        {
          title: "ExplainShell",
          url: "https://explainshell.com/",
          why: "Decode commands while you lab"
        }
      ]
    },
    11: {
      concepts: [
        "Symptom",
        "hypothesis",
        "test",
        "narrow down; the USE checklist; writing up incidents"
      ],
      videos: [
        {
          title: "Linux fundamentals (course segment)",
          youtubeId: "sWbUDq4S6Y8",
          why: "Supports this week: Troubleshooting method",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "ExplainShell",
          url: "https://explainshell.com/",
          why: "Decode commands while you lab"
        }
      ]
    }
  },
  dev102: {
    1: {
      concepts: [
        "OSI/TCP-IP",
        "MAC vs IP",
        "ARP"
      ],
      videos: [
        {
          title: "NetworkChuck — networking models / intro",
          youtubeId: "ieRIjLkp9SQ",
          why: "Models without the exam fog",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare What is a protocol",
          url: "https://www.cloudflare.com/learning/network-layer/what-is-a-protocol/",
          why: "Friendly primer"
        }
      ]
    },
    2: {
      concepts: [
        "CIDR",
        "subnet masks",
        "RFC1918"
      ],
      videos: [
        {
          title: "NetworkChuck — subnetting",
          youtubeId: "5WfiTtigUjQ",
          why: "Do subnetting until it is boring",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Practical Networking subnetting",
          url: "https://www.practicalnetworking.net/stand-alone/ip-subnetting/",
          why: "Drills"
        }
      ]
    },
    3: {
      concepts: [
        "TCP vs UDP",
        "the 3-way handshake",
        "ports",
        "connection states"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: TCP and UDP",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    },
    4: {
      concepts: [
        "DNS records",
        "TTL",
        "dig"
      ],
      videos: [
        {
          title: "DNS explained (Cloudflare / NC style)",
          youtubeId: "ZlY1XVuY8qY",
          why: "Recursive resolution intuition",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare DNS",
          url: "https://www.cloudflare.com/learning/dns/what-is-dns/",
          why: "DNS map"
        }
      ]
    },
    5: {
      concepts: [
        "HTTP/1.1 and HTTP/2",
        "methods",
        "status codes",
        "headers"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: HTTP",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    },
    6: {
      concepts: [
        "TLS handshake",
        "certs",
        "SNI"
      ],
      videos: [
        {
          title: "TLS handshake explained",
          youtubeId: "0TLDRidtcKU",
          why: "Packet-level intuition for Forge API TLS",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare TLS",
          url: "https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/",
          why: "Handshake steps"
        }
      ]
    },
    7: {
      concepts: [
        "Routing tables",
        "default gateway",
        "ip route",
        "NAT and SNAT"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: Routing and NAT",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    },
    8: {
      concepts: [
        "iptables and nftables chains",
        "stateful vs stateless filtering",
        "default deny"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: Firewalls",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    },
    9: {
      concepts: [
        "L4 vs L7 load balancing",
        "reverse proxies",
        "health checks",
        "nginx upstreams"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: Load balancing and proxies",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    },
    10: {
      concepts: [
        "tcpdump filters",
        "Wireshark",
        "MTU and fragmentation",
        "latency"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: Packet analysis",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    },
    11: {
      concepts: [
        "VPN types",
        "IPsec",
        "WireGuard",
        "BGP basics"
      ],
      videos: [
        {
          title: "Networking fundamentals clip",
          youtubeId: "ieRIjLkp9SQ",
          why: "Week focus: VPNs and hybrid networking",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Cloudflare Learning",
          url: "https://www.cloudflare.com/learning/",
          why: "Concept primers"
        }
      ]
    }
  },
  dev103: {
    1: {
      concepts: [
        "Git commits/trees",
        "merge vs rebase"
      ],
      videos: [
        {
          title: "freeCodeCamp — Git & GitHub",
          youtubeId: "RGOj5yH7evk",
          why: "Internals + collaboration base",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Pro Git Ch1-3",
          url: "https://git-scm.com/book/en/v2",
          why: "Book remains canonical"
        }
      ]
    },
    2: {
      concepts: [
        "Pull requests",
        "code review",
        "merge conflicts",
        "tags"
      ],
      videos: [
        {
          title: "Git & GitHub course segment",
          youtubeId: "RGOj5yH7evk",
          why: "Supports this week: Collaboration with Git",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    3: {
      concepts: [
        "Files",
        "pathlib",
        "subprocess",
        "os and environment variables"
      ],
      videos: [
        {
          title: "Git & GitHub course segment",
          youtubeId: "RGOj5yH7evk",
          why: "Supports this week: Python for ops 1",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    4: {
      concepts: [
        "requests",
        "JSON and YAML",
        "exceptions",
        "logging"
      ],
      videos: [
        {
          title: "Git & GitHub course segment",
          youtubeId: "RGOj5yH7evk",
          why: "Supports this week: Python for ops 2",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    5: {
      concepts: [
        "boto3 clients vs resources",
        "the credentials chain",
        "pagination",
        "virtual environments"
      ],
      videos: [
        {
          title: "Git & GitHub course segment",
          youtubeId: "RGOj5yH7evk",
          why: "Supports this week: AWS automation with boto3",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    6: {
      concepts: [
        "pytest",
        "fixtures",
        "mocking",
        "coverage"
      ],
      videos: [
        {
          title: "Git & GitHub course segment",
          youtubeId: "RGOj5yH7evk",
          why: "Supports this week: Testing",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    7: {
      concepts: [
        "Go modules",
        "cobra",
        "goroutines"
      ],
      videos: [
        {
          title: "Go programming — tour style course segment",
          youtubeId: "YyUeFnumOfg",
          why: "Go fundamentals for forgectl",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "A Tour of Go",
          url: "https://go.dev/tour/",
          why: "Official interactive"
        }
      ]
    },
    8: {
      concepts: [
        "HTTP servers",
        "health and readiness endpoints",
        "graceful shutdown",
        "structured logs"
      ],
      videos: [
        {
          title: "Go course segment",
          youtubeId: "YyUeFnumOfg",
          why: "Supports this week: Go services",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    9: {
      concepts: [
        "Images vs containers",
        "Dockerfile",
        "volumes"
      ],
      videos: [
        {
          title: "TechWorld with Nana — Docker Tutorial for Beginners",
          youtubeId: "3c-iJs0HgeM",
          why: "Docker mental model for game images",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Docker get started",
          url: "https://docs.docker.com/get-started/",
          why: "Official"
        }
      ]
    },
    10: {
      concepts: [
        "Multi-stage builds",
        "distroless images",
        "non-root users",
        "Trivy scanning"
      ],
      videos: [
        {
          title: "Docker tutorial (Nana)",
          youtubeId: "3c-iJs0HgeM",
          why: "Supports this week: Docker in production",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    },
    11: {
      concepts: [
        "Restart policies",
        "signals and PID 1",
        "exit codes",
        "resource limits"
      ],
      videos: [
        {
          title: "Docker tutorial (Nana)",
          youtubeId: "3c-iJs0HgeM",
          why: "Supports this week: Container lifecycle",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Official docs hub",
          url: "https://docs.docker.com/",
          why: "Use the tool docs for this week"
        }
      ]
    }
  },
  dev104: {
    1: {
      concepts: [
        "Regions",
        "availability zones",
        "the shared responsibility model",
        "root account security"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: AWS foundations",
          startSeconds: 600,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    2: {
      concepts: [
        "IAM roles/policies",
        "least privilege"
      ],
      videos: [
        {
          title: "AWS IAM deep dive (freeCodeCamp/SAA section)",
          youtubeId: "Ia-N3q2ew-4",
          why: "Policy evaluation for Forge IRSA later",
          startSeconds: 1800,
          required: true
        }
      ],
      reads: [
        {
          title: "IAM User Guide",
          url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html",
          why: "Official"
        }
      ]
    },
    3: {
      concepts: [
        "VPC",
        "subnets",
        "SG vs NACL"
      ],
      videos: [
        {
          title: "AWS VPC (SAA course section)",
          youtubeId: "Ia-N3q2ew-4",
          why: "Map to SquadForge join/game subnets",
          startSeconds: 3600,
          required: true
        }
      ],
      reads: [
        {
          title: "VPC documentation",
          url: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html",
          why: "Official"
        }
      ]
    },
    4: {
      concepts: [
        "AMIs",
        "instance types",
        "user data",
        "EBS volumes"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: EC2 and Auto Scaling",
          startSeconds: 2400,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    5: {
      concepts: [
        "ALB and NLB",
        "listeners",
        "target groups",
        "health checks"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: Load balancers and DNS",
          startSeconds: 3000,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    6: {
      concepts: [
        "Storage classes",
        "bucket policies",
        "versioning",
        "lifecycle rules"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: S3",
          startSeconds: 3600,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    7: {
      concepts: [
        "RDS and Multi-AZ",
        "read replicas",
        "Aurora",
        "DynamoDB basics"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: Databases",
          startSeconds: 4200,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    8: {
      concepts: [
        "CloudWatch metrics",
        "logs and alarms",
        "CloudTrail",
        "AWS Config"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: Monitoring and audit",
          startSeconds: 4800,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    9: {
      concepts: [
        "KMS keys",
        "envelope encryption",
        "Secrets Manager",
        "Parameter Store"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: Secrets and encryption",
          startSeconds: 5400,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    10: {
      concepts: [
        "ECR",
        "ECS on Fargate",
        "task definitions",
        "Lambda"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: Containers and serverless on AWS",
          startSeconds: 6000,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    },
    11: {
      concepts: [
        "Well-Architected pillars",
        "high availability",
        "disaster recovery (RPO",
        "RTO)"
      ],
      videos: [
        {
          title: "AWS course segment",
          youtubeId: "Ia-N3q2ew-4",
          why: "Supports this week: Architecture and cost",
          startSeconds: 6600,
          required: true
        }
      ],
      reads: [
        {
          title: "AWS Documentation",
          url: "https://docs.aws.amazon.com/",
          why: "Service docs for this week"
        }
      ]
    }
  },
  dev201: {
    1: {
      concepts: [
        "K8s architecture",
        "kubectl"
      ],
      videos: [
        {
          title: "Nana — Kubernetes full course (architecture)",
          youtubeId: "X48VuDVv0do",
          why: "Control plane + workers",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes concepts",
          url: "https://kubernetes.io/docs/concepts/",
          why: "Official"
        }
      ]
    },
    2: {
      concepts: [
        "Pods",
        "Deployments"
      ],
      videos: [
        {
          title: "Nana — Kubernetes full course (Pods/Deployments)",
          youtubeId: "X48VuDVv0do",
          why: "Run Forge API as Deployment",
          startSeconds: 1200,
          required: true
        }
      ],
      reads: [
        {
          title: "Deployments",
          url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
          why: "Official"
        }
      ]
    },
    3: {
      concepts: [
        "ClusterIP",
        "NodePort",
        "LoadBalancer",
        "cluster DNS"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Services and traffic",
          startSeconds: 2700,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    4: {
      concepts: [
        "ConfigMaps",
        "Secrets",
        "requests and limits",
        "QoS classes"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Config and health",
          startSeconds: 3600,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    5: {
      concepts: [
        "Services",
        "Ingress"
      ],
      videos: [
        {
          title: "Nana — Kubernetes full course (Services/Ingress)",
          youtubeId: "X48VuDVv0do",
          why: "Publish Forge API + think about game ports",
          startSeconds: 4800,
          required: true
        }
      ],
      reads: [
        {
          title: "Ingress",
          url: "https://kubernetes.io/docs/concepts/services-networking/ingress/",
          why: "Official"
        }
      ]
    },
    6: {
      concepts: [
        "PersistentVolumes",
        "PersistentVolumeClaims",
        "StorageClasses",
        "dynamic provisioning"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Storage",
          startSeconds: 5400,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    7: {
      concepts: [
        "RBAC (Roles",
        "ClusterRoles",
        "bindings)",
        "ServiceAccounts"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Cluster security",
          startSeconds: 6300,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    8: {
      concepts: [
        "kubeadm install",
        "version skew",
        "cluster upgrades",
        "node drain"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Cluster operations",
          startSeconds: 7200,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    9: {
      concepts: [
        "Helm charts and values",
        "Kustomize overlays",
        "CRDs",
        "Operators"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Packaging",
          startSeconds: 8100,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    10: {
      concepts: [
        "Debugging pods",
        "nodes",
        "Services",
        "DNS and the control plane; events; logs; kubectl debug"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Troubleshooting",
          startSeconds: 9000,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    },
    11: {
      concepts: [
        "Managed node groups",
        "EKS Pod Identity and IRSA",
        "AWS Load Balancer Controller",
        "Karpenter"
      ],
      videos: [
        {
          title: "Kubernetes full course segment (Nana)",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Amazon EKS",
          startSeconds: 9900,
          required: true
        }
      ],
      reads: [
        {
          title: "Kubernetes docs",
          url: "https://kubernetes.io/docs/home/",
          why: "Official reference"
        }
      ]
    }
  },
  dev202: {
    1: {
      concepts: [
        "Terraform workflow",
        "providers"
      ],
      videos: [
        {
          title: "Terraform Associate course",
          youtubeId: "SPcwo0Gq9T8",
          why: "Core Terraform loop",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided"
        }
      ]
    },
    2: {
      concepts: [
        "Variables",
        "outputs",
        "locals",
        "data sources"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "SPcwo0Gq9T8",
          why: "Supports this week: Terraform language",
          startSeconds: 1400,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    3: {
      concepts: [
        "State",
        "modules",
        "AWS VPC"
      ],
      videos: [
        {
          title: "Terraform + AWS dev environment",
          youtubeId: "iRaai1IBlB0",
          why: "Hands-on VPC-style resources",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "State docs",
          url: "https://developer.hashicorp.com/terraform/language/state",
          why: "Remote state later"
        }
      ]
    },
    4: {
      concepts: [
        "Module structure",
        "inputs and outputs",
        "versioning",
        "the public registry"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Modules",
          startSeconds: 2800,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    5: {
      concepts: [
        "depends_on",
        "create_before_destroy",
        "prevent_destroy",
        "ignore_changes"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Lifecycle and dependencies",
          startSeconds: 3500,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    6: {
      concepts: [
        "Workspaces vs directory layouts",
        "per-environment state",
        "Terragrunt overview"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Environments",
          startSeconds: 4200,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    7: {
      concepts: [
        "HCP Terraform workspaces",
        "remote runs",
        "variable sets",
        "policy as code (Sentinel or OPA)"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: HCP Terraform and policy",
          startSeconds: 4900,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    8: {
      concepts: [
        "terraform fmt and validate",
        "terraform test",
        "tflint",
        "Checkov"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Testing IaC",
          startSeconds: 5600,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    9: {
      concepts: [
        "Inventory",
        "playbooks",
        "modules",
        "roles"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Ansible",
          startSeconds: 6300,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    10: {
      concepts: [
        "EKS module",
        "node groups",
        "add-ons",
        "access entries; Terraform Associate exam this week"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Terraform for EKS",
          startSeconds: 7000,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    },
    11: {
      concepts: [
        "moved blocks",
        "removed blocks",
        "sensitive values",
        "ephemeral resources"
      ],
      videos: [
        {
          title: "Terraform course segment",
          youtubeId: "iRaai1IBlB0",
          why: "Supports this week: Refactoring and hygiene",
          startSeconds: 7700,
          required: true
        }
      ],
      reads: [
        {
          title: "HashiCorp Terraform tutorials",
          url: "https://developer.hashicorp.com/terraform/tutorials",
          why: "Guided labs"
        }
      ]
    }
  },
  dev203: {
    1: {
      concepts: [
        "Continuous integration",
        "delivery vs deployment",
        "pipeline stages",
        "artifacts"
      ],
      videos: [
        {
          title: "CI/CD with GitHub Actions style course",
          youtubeId: "eB0nUzAI7M8",
          why: "Supports this week: CI/CD concepts",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    2: {
      concepts: [
        "Workflows",
        "events",
        "jobs",
        "runners"
      ],
      videos: [
        {
          title: "CI/CD with GitHub Actions style course",
          youtubeId: "eB0nUzAI7M8",
          why: "Supports this week: GitHub Actions",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    3: {
      concepts: [
        "Jenkins on Kubernetes",
        "declarative Jenkinsfile",
        "agents",
        "credentials"
      ],
      videos: [
        {
          title: "CI/CD with GitHub Actions style course",
          youtubeId: "eB0nUzAI7M8",
          why: "Supports this week: Jenkins",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    4: {
      concepts: [
        "GitOps",
        "Argo CD"
      ],
      videos: [
        {
          title: "Argo CD / GitOps overview",
          youtubeId: "MeUoOzQVC9M",
          why: "Promote SquadForge via Git",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Argo CD docs",
          url: "https://argo-cd.readthedocs.io/",
          why: "Official"
        }
      ]
    },
    5: {
      concepts: [
        "Semantic versioning",
        "git tags",
        "SBOMs",
        "changelogs"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: Versioning and releases",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    6: {
      concepts: [
        "Rolling",
        "blue-green",
        "canary",
        "feature flags"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: Deployment strategies",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    7: {
      concepts: [
        "Pull-based delivery",
        "Applications",
        "app of apps",
        "sync policies"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: GitOps with Argo CD",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    8: {
      concepts: [
        "Argo Rollouts",
        "canary steps",
        "analysis templates",
        "Prometheus metrics"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: Progressive delivery",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    9: {
      concepts: [
        "terraform plan on PR",
        "apply on merge",
        "Atlantis",
        "approvals"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: Infrastructure pipelines",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    10: {
      concepts: [
        "cosign image signing",
        "Kyverno admission policies",
        "External Secrets Operator",
        "least-privilege CI"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: Supply chain security",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    },
    11: {
      concepts: [
        "Flaky tests",
        "caching",
        "parallelism",
        "pipeline speed"
      ],
      videos: [
        {
          title: "GitOps / Argo CD",
          youtubeId: "MeUoOzQVC9M",
          why: "Supports this week: Pipeline reliability",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "GitHub Actions docs",
          url: "https://docs.github.com/actions",
          why: "Workflow reference"
        }
      ]
    }
  },
  dev204: {
    1: {
      concepts: [
        "Prometheus",
        "metrics",
        "Grafana"
      ],
      videos: [
        {
          title: "Prometheus / monitoring intro",
          youtubeId: "h4Sl21AKiOY",
          why: "Instrument Forge time-to-join",
          startSeconds: 0,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE workbook SLOs",
          url: "https://sre.google/workbook/implementing-slos/",
          why: "SLO craft"
        }
      ]
    },
    2: {
      concepts: [
        "Pull model",
        "exporters",
        "metric types",
        "PromQL"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Metrics with Prometheus",
          startSeconds: 400,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    3: {
      concepts: [
        "Grafana",
        "RED method (rate",
        "errors",
        "duration)"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Dashboards",
          startSeconds: 800,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    4: {
      concepts: [
        "Loki",
        "structured logging",
        "log levels",
        "OpenTelemetry"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Logs and traces",
          startSeconds: 1200,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    5: {
      concepts: [
        "Alertmanager",
        "routing",
        "symptom-based alerts",
        "multi-window burn-rate alerts"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Alerting",
          startSeconds: 1600,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    6: {
      concepts: [
        "Severity levels",
        "incident commander",
        "communications",
        "on-call rotations"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Incident response",
          startSeconds: 2000,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    7: {
      concepts: [
        "Blameless culture",
        "timelines",
        "contributing factors",
        "5 whys"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Postmortems",
          startSeconds: 2400,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    8: {
      concepts: [
        "IAM review",
        "GuardDuty",
        "Security Hub",
        "encryption at rest and in transit"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: AWS security",
          startSeconds: 2800,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    9: {
      concepts: [
        "RBAC audit",
        "Pod Security",
        "image scanning",
        "Falco runtime detection"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Kubernetes security",
          startSeconds: 3200,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    10: {
      concepts: [
        "CIS benchmarks",
        "ISO 27001",
        "SOC 2",
        "ASD Essential Eight"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Compliance",
          startSeconds: 3600,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    },
    11: {
      concepts: [
        "Capacity planning",
        "load testing with k6",
        "headroom",
        "chaos engineering basics"
      ],
      videos: [
        {
          title: "Observability / Prometheus segment",
          youtubeId: "h4Sl21AKiOY",
          why: "Supports this week: Capacity and chaos",
          startSeconds: 4000,
          required: true
        }
      ],
      reads: [
        {
          title: "Google SRE books",
          url: "https://sre.google/books/",
          why: "Free SRE chapters"
        }
      ]
    }
  },
  dev301: {
    1: {
      concepts: [
        "Terraform",
        "EKS",
        "Argo CD",
        "observability stack"
      ],
      videos: [
        {
          title: "Platform failure / K8s ops context",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Platform rebuild",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "k8s.af failure stories",
          url: "https://k8s.af",
          why: "Real outages to study"
        }
      ]
    },
    2: {
      concepts: [
        "Break it on purpose",
        "check your alerts",
        "diagnose as if blind",
        "fix"
      ],
      videos: [
        {
          title: "Platform failure / K8s ops context",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Failure lab: Kubernetes",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "k8s.af failure stories",
          url: "https://k8s.af",
          why: "Real outages to study"
        }
      ]
    },
    3: {
      concepts: [
        "Same method across AWS and the network layer"
      ],
      videos: [
        {
          title: "Platform failure / K8s ops context",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Failure lab: AWS and networking",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "k8s.af failure stories",
          url: "https://k8s.af",
          why: "Real outages to study"
        }
      ]
    },
    4: {
      concepts: [
        "Same method across infrastructure code and delivery pipelines"
      ],
      videos: [
        {
          title: "Platform failure / K8s ops context",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Failure lab: Terraform and CI/CD",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "k8s.af failure stories",
          url: "https://k8s.af",
          why: "Real outages to study"
        }
      ]
    },
    5: {
      concepts: [
        "Unknown faults",
        "incident command",
        "timelines",
        "stakeholder communication"
      ],
      videos: [
        {
          title: "Platform failure / K8s ops context",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Blind game day",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "k8s.af failure stories",
          url: "https://k8s.af",
          why: "Real outages to study"
        }
      ]
    },
    6: {
      concepts: [
        "README",
        "demo video",
        "blog posts",
        "resume"
      ],
      videos: [
        {
          title: "Platform failure / K8s ops context",
          youtubeId: "X48VuDVv0do",
          why: "Supports this week: Portfolio and interviews",
          startSeconds: 8000,
          required: true
        }
      ],
      reads: [
        {
          title: "k8s.af failure stories",
          url: "https://k8s.af",
          why: "Real outages to study"
        }
      ]
    }
  }
};

export function getWeekMedia(unitId: string, weekIndex1Based: number): WeekMedia | null {
  return weekMedia[unitId]?.[weekIndex1Based] ?? null;
}

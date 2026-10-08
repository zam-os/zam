/**
 * ADR 2026-10-08 R5 — the shell command redactor. Every position the plan
 * (0B.1) claims to cover carries a fake secret here, and the secret must be
 * gone from the output while the command's structure stays.
 */

import { describe, expect, it } from "vitest";
import {
  analyzeObservation,
  looksLikeSecret,
  REDACTED,
  redactCommand,
} from "../../../src/kernel/index.js";
import type { CommandRecord } from "../../../src/kernel/observation/analyzer.js";

// Fake secrets only. Each one is distinct, so a leak names its position.
const S = "Fake5ecretValue";

/** [position, command, the part that must survive] */
const CORPUS: Array<[string, string, string]> = [
  // Environment assignments
  ["NAME=value prefix", `API_TOKEN=${S}1 npm publish`, "npm publish"],
  ["export", `export DB_PASSWORD=${S}2`, "export DB_PASSWORD="],
  ["export quoted", `export DB_PASSWORD="${S}3 x"`, "export DB_PASSWORD="],
  ["env", `env AWS_SECRET_ACCESS_KEY=${S}4 aws s3 ls`, "aws s3 ls"],
  ["plain env value", `export HOMEPAGE_URL=${S}5`, "export HOMEPAGE_URL="],
  ["PowerShell $env", `$env:GITHUB_TOKEN = "${S}6"`, "$env:GITHUB_TOKEN"],
  ["PowerShell $env attached", `$env:API_KEY='${S}7'`, "$env:API_KEY"],
  ["cmd set", `set DB_PASS=${S}8`, "set DB_PASS="],
  ["cmd set quoted", `set "DB_PASS=${S}9"`, "set "],
  ["setx", `setx API_KEY ${S}10 /M`, "setx API_KEY"],
  [
    "SetEnvironmentVariable",
    `[Environment]::SetEnvironmentVariable('API_KEY', '${S}11', 'User')`,
    "SetEnvironmentVariable",
  ],
  // Headers in every form
  ["header -H", `curl -H 'Authorization: Bearer ${S}12' https://x.test`, "curl -H"],
  ["header attached", `curl -H'X-Api-Key: ${S}13' https://x.test`, "https://x.test"],
  ["header --header=", `curl --header="Cookie: sid=${S}14" https://x.test`, "curl"],
  ["X-Auth-Token", `http GET x.test X-Auth-Token:${S}15`, "http GET"],
  // Secret flags in separate, = and attached forms
  ["--token sep", `gh auth login --token ${S}16`, "gh auth login --token"],
  ["--token=", `kubectl get pods --token=${S}17`, "kubectl get pods"],
  ["--password", `docker login --password ${S}18 -u bob`, "docker login"],
  ["--secret", `vault write x --secret ${S}19`, "vault write x"],
  ["--api-key", `tool sync --api-key=${S}20`, "tool sync"],
  ["mysql -p attached", `mysql -u root -p${S}21 app`, "mysql -u root -p"],
  ["curl -u", `curl -u alice:${S}22 https://x.test`, "curl -u alice:"],
  ["curl --user=", `curl --user=alice:${S}23 https://x.test`, "curl --user=alice:"],
  ["--user sep", `wget --user alice:${S}24 https://x.test`, "wget --user alice:"],
  ["--data form", `curl --data 'password=${S}25&user=bob' https://x.test`, "user=bob"],
  ["--data json", `curl -d '{"user":"bob","password":"${S}26"}' https://x.test`, '"user":"bob"'],
  ["kubectl from-literal", `kubectl create secret generic db --from-literal=password=${S}27`, "kubectl create secret generic db"],
  ["docker -e", `docker run -e API_KEY=${S}28 nginx`, "docker run -e API_KEY="],
  ["docker --env=", `docker run --env=TOKEN=${S}29 nginx`, "docker run"],
  ["openssl -pass", `openssl enc -aes-256-cbc -pass pass:${S}30 -in a`, "openssl enc"],
  ["openssl -k", `openssl enc -aes-256-cbc -k ${S}31 -in a`, "openssl enc"],
  ["sshpass -p", `sshpass -p ${S}32 ssh bob@host`, "ssh bob@host"],
  ["sshpass attached", `sshpass -p${S}33 ssh bob@host`, "ssh bob@host"],
  // PowerShell parameters
  ["-Credential", `Connect-AzAccount -Credential ${S}34`, "Connect-AzAccount"],
  ["-Token", `Invoke-Thing -Token ${S}35`, "Invoke-Thing"],
  ["-ClientSecret", `New-AzADServicePrincipal -ClientSecret ${S}36`, "New-AzADServicePrincipal"],
  ["-Password", `Set-LocalUser bob -Password ${S}37`, "Set-LocalUser bob"],
  ["-PASSWORD case", `Set-LocalUser bob -PASSWORD ${S}38`, "Set-LocalUser bob"],
  [
    "ConvertTo-SecureString",
    `$pw = ConvertTo-SecureString '${S}39' -AsPlainText -Force`,
    "ConvertTo-SecureString",
  ],
  // Windows
  ["cmdkey /pass:", `cmdkey /generic:srv /user:bob /pass:${S}40`, "/user:bob"],
  ["net use password", `net use Z: \\\\srv\\share ${S}41 /user:DOM\\bob`, "\\\\srv\\share"],
  ["net use password last", `net use Z: \\\\srv\\share /user:DOM\\bob ${S}42`, "/user:DOM\\bob"],
  ["sqlcmd -P", `sqlcmd -S srv -U bob -P ${S}43`, "sqlcmd -S srv -U bob -P"],
  // Piped secrets
  ["docker --password-stdin", `echo ${S}44 | docker login -u bob --password-stdin`, "docker login"],
  ["gh --with-token", `echo ${S}45 | gh auth login --with-token`, "gh auth login"],
  ["gh secret set stdin", `printf '${S}46' | gh secret set API_KEY`, "gh secret set API_KEY"],
  ["gh secret --body", `gh secret set API_KEY --body ${S}47`, "gh secret set API_KEY"],
  // Registry tokens
  ["npm config set", `npm config set //registry.npmjs.org/:_authToken ${S}48`, "npm config set"],
  ["npm config key=value", `npm config set //registry.npmjs.org/:_authToken=${S}49`, "npm config set"],
  [".npmrc append", `echo '//registry.npmjs.org/:_authToken=${S}50' >> ~/.npmrc`, ">> ~/.npmrc"],
  // URLs and connection strings
  ["URL credentials", `git clone https://bob:${S}51@github.com/o/r.git`, "github.com/o/r.git"],
  ["postgres URL", `psql 'postgres://bob:${S}52@db.test:5432/app'`, "db.test:5432/app"],
  ["connection string", `dotnet run --Db='Server=x;User Id=bob;Password=${S}53;'`, "User Id=bob"],
  // Name heuristic
  ["cred flag", `tool --client-credential ${S}54`, "tool --client-credential"],
  ["cookie flag", `tool --session-cookie ${S}55`, "tool --session-cookie"],
  ["bearer flag", `tool --bearer ${S}56`, "tool --bearer"],
  ["otp flag", `npm publish --otp ${S}65`, "npm publish --otp"],
  ["pwd key=value", `tool DB_PWD=${S}57 run`, "run"],
  ["auth key=value", `tool auth_header=${S}58`, "tool auth_header="],
  // Config set and friends
  ["git config", `git config --global user.password ${S}59`, "git config --global user.password"],
  ["aws configure set", `aws configure set aws_secret_access_key ${S}60`, "aws configure set"],
  ["htpasswd -b", `htpasswd -b .htpasswd bob ${S}61`, "htpasswd -b .htpasswd bob"],
  ["az -p", `az login --service-principal -u app -p ${S}62 --tenant t`, "az login"],
  // Here-strings and heredocs
  ["here-string", `grep foo <<< '${S}63'`, "grep foo <<<"],
  ["heredoc", `cat <<EOF > .env\nAPI_KEY=${S}64\nEOF`, "cat <<EOF > .env"],
];

const JWT =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
const PRIVATE_KEY =
  "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----";

/** Opaque values that must be found without a key name. */
const OPAQUE: Array<[string, string, string]> = [
  ["JWT", `curl https://x.test/?t=${JWT}`, JWT],
  ["JWT in header-less arg", `tool ${JWT}`, JWT],
  ["private key block", `echo '${PRIVATE_KEY}' > id`, "b3BlbnNzaC1rZXktdjEAAAAA"],
  ["GitHub token", "git remote set-url origin https://ghp_aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY3z5A@github.com/o/r", "ghp_aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY3z5A"],
  ["AWS key id", "tool AKIAIOSFODNN7EXAMPLE", "AKIAIOSFODNN7EXAMPLE"],
  ["high entropy", "deploy --tag wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"],
  ["random token", "tool run abcDEF123ghiJKL456mnoPQR", "abcDEF123ghiJKL456mnoPQR"],
  ["long hex", "tool 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "9f86d081884c7d659a2feaa0c55ad015"],
];

/** Commands without secrets stay exactly as typed. */
const UNCHANGED = [
  "git commit -m 'fix: token refresh'",
  "git checkout -b feat/observation-containment",
  "git show 922d2a3d1b2c3d4e5f60718293a4b5c6d7e8f901",
  "npm run build -- --base=/viewer/",
  "ls -la /Users/thomas/src/zam2026/Build/Output",
  "zam monitor start --session 01K7ABCDEFGHJKMNPQRSTVWXYZ",
  "mkdir -p build/out && cp -p a b",
  "docker run -p 8080:80 nginx",
  "kubectl get pods -n kube-system",
  "ssh -i ~/.ssh/id_ed25519 bob@host",
  "git push -u origin main",
  "sort -k2 file.txt",
  "mysql -u root -p app",
  "cd /tmp/550e8400-e29b-41d4-a716-446655440000",
  "gh api -H 'Accept: application/json' /user --jq .login",
  "aws s3 cp s3://bucket/2026/10/08/report.csv .",
];

describe("redactCommand", () => {
  it.each(CORPUS)("redacts %s", (_position, command, keep) => {
    const redacted = redactCommand(command);
    expect(redacted).not.toContain(S);
    expect(redacted).toContain(REDACTED);
    expect(redacted).toContain(keep);
  });

  it.each(OPAQUE)("redacts %s without a key name", (_kind, command, secret) => {
    const redacted = redactCommand(command);
    expect(redacted).not.toContain(secret);
    expect(redacted).toContain(REDACTED);
  });

  it.each(UNCHANGED)("leaves %s alone", (command) => {
    expect(redactCommand(command)).toBe(command);
  });

  it("is idempotent", () => {
    for (const [, command] of [...CORPUS, ...OPAQUE]) {
      const once = redactCommand(command);
      expect(redactCommand(once)).toBe(once);
    }
  });

  it("keeps quotes balanced when it redacts part of a quoted value", () => {
    expect(redactCommand(`docker run -e "API_KEY=${S}" nginx`)).toBe(
      `docker run -e "API_KEY=${REDACTED}" nginx`,
    );
    expect(redactCommand(`curl -u 'alice:${S}' https://x.test`)).toBe(
      `curl -u 'alice:${REDACTED}' https://x.test`,
    );
  });

  it("tells generated secrets from words, paths and ids", () => {
    expect(looksLikeSecret("abcDEF123ghiJKL456mnoPQR")).toBe(true);
    expect(looksLikeSecret("screen-observation-switch")).toBe(false);
    expect(looksLikeSecret("01K7ABCDEFGHJKMNPQRSTVWXYZ")).toBe(false);
    expect(looksLikeSecret("922d2a3d1b2c3d4e5f60718293a4b5c6d7e8f901")).toBe(
      false,
    );
  });
});

describe("monitor patterns after redaction", () => {
  function record(command: string, seq: number): CommandRecord {
    const at = new Date(Date.UTC(2026, 9, 8, 10, 0, seq)).toISOString();
    return {
      seq,
      pid: 1,
      command,
      cwd: "/repo",
      startedAt: at,
      endedAt: at,
      durationMs: 100,
      exitCode: 0,
    };
  }

  it("still match on the redacted text", () => {
    const commands = [
      `export NPM_TOKEN=${S}`,
      `npm config set //registry.npmjs.org/:_authToken ${S}`,
      "npm publish --access public",
      `docker login -u bob --password ${S}`,
      "docker push registry.test/app:1.0",
    ].map((command, index) => record(redactCommand(command), index + 1));

    const result = analyzeObservation(commands, [
      { slug: "npm-publish", patterns: ["npm publish", "npm config set"] },
      { slug: "docker-push", patterns: ["docker login", "docker push"] },
    ]);
    const bySlug = new Map(result.ratings.map((r) => [r.tokenSlug, r]));
    expect(bySlug.get("npm-publish")?.evidence.matchedCommands).toBe(2);
    expect(bySlug.get("docker-push")?.evidence.matchedCommands).toBe(2);
    expect(JSON.stringify(result)).not.toContain(S);
  });
});

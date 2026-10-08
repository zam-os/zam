/**
 * Shell command redaction — ADR 2026-10-08 R5.
 *
 * The shell hooks append command lines to the monitor log themselves, so
 * ZAM is never in their write path. It redacts on the way out instead: every
 * read of a monitor log goes through {@link redactCommand}, and the log is
 * rewritten in redacted form when monitoring stops or the session ends.
 *
 * The redactor keeps a command's structure — the command name, subcommands
 * and flag names — because that is what skill patterns match on, and
 * replaces values with {@link REDACTED} in the positions it knows:
 *
 * - environment assignments, in every shell's syntax;
 * - values of flags whose name says secret (pass, pwd, secret, token, key,
 *   auth, cred, cookie, bearer, otp), in separate, `=` and Windows `/name:`
 *   forms;
 * - sensitive HTTP headers, credentials in URLs, `key=value` pairs and JSON
 *   fields with a secret-sounding key (connection strings, form data);
 * - per-command positions: mysql `-pVALUE`, sshpass `-p`, curl `-u user:pass`,
 *   docker `-e KEY=value`, `net use` passwords, `htpasswd -b`, `openssl -k`,
 *   `az -p`, `config set KEY VALUE`, `secret set`, `ConvertTo-SecureString`;
 * - values piped into a command that reads a secret from stdin, here-strings
 *   and heredoc bodies;
 * - JWTs, private key blocks, well-known token prefixes and high-entropy
 *   strings.
 *
 * Limits, stated rather than hidden: a secret in a position the redactor does
 * not know, such as a bare positional argument with low entropy, survives.
 * Redaction is idempotent, so redacting a redacted command changes nothing.
 */

export const REDACTED = "[redacted]";

/**
 * A flag, header or key whose name says it carries a secret. One-time
 * passwords (`--otp`, `--totp`) count as a whole word only.
 */
const SENSITIVE_NAME =
  /pass|pwd|secret|token|key|auth|cred|cookie|bearer|(?:^|[-_])t?otp(?:$|[-_])/i;

/** Sensitive-looking names that carry no secret themselves. */
const BENIGN_NAME =
  /^(?:no-.*|.*(?:stdin|file|path|dir|type|ring|chain|size|length|alg|algorithm|helper|store|id|server|url|host|mode)|authors?)$/i;

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

const WRAPPERS = new Set([
  "sudo",
  "doas",
  "env",
  "command",
  "exec",
  "time",
  "nohup",
  "nice",
  "builtin",
]);

const ASSIGNMENT_COMMANDS = new Set([
  "export",
  "declare",
  "typeset",
  "local",
  "readonly",
  "set",
]);

const MYSQL_FAMILY = new Set([
  "mysql",
  "mysqldump",
  "mysqladmin",
  "mysqlimport",
  "mysqlshow",
  "mariadb",
  "mariadb-dump",
  "mariadb-admin",
]);

const CONTAINER_TOOLS = new Set(["docker", "podman", "nerdctl", "kubectl"]);

const HTTP_TOOLS = new Set(["curl", "wget", "http", "https", "httpie"]);

const ECHO_COMMANDS = new Set([
  "echo",
  "printf",
  "write-output",
  "write-host",
  "print",
  "cat",
  "type",
]);

/** Flags that make a command read a secret from stdin. */
const STDIN_SECRET_FLAGS =
  /^--?(?:password-stdin|with-token|token-stdin|passphrase-fd|password-fd|stdin-password)$/i;

// ── Tokenizer ────────────────────────────────────────────────────────────────

interface Token {
  start: number;
  end: number;
  /** Raw text, quotes included. */
  raw: string;
  /** Text with quotes removed, for matching. */
  value: string;
  op: boolean;
}

const OPERATORS = ["<<<", "&&", "||", "|", ";", "&", "\n", "\r"];

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    const op = OPERATORS.find((candidate) => input.startsWith(candidate, i));
    if (op) {
      tokens.push({
        start: i,
        end: i + op.length,
        raw: op,
        value: op,
        op: true,
      });
      i += op.length;
      continue;
    }
    const start = i;
    let value = "";
    while (i < input.length) {
      const c = input[i];
      if (c === " " || c === "\t") break;
      if (OPERATORS.some((candidate) => input.startsWith(candidate, i))) break;
      if (c === "'") {
        const close = input.indexOf("'", i + 1);
        const end = close === -1 ? input.length : close;
        value += input.slice(i + 1, end);
        i = close === -1 ? input.length : close + 1;
        continue;
      }
      if (c === '"') {
        let j = i + 1;
        while (j < input.length && input[j] !== '"') {
          if ((input[j] === "\\" || input[j] === "`") && j + 1 < input.length) {
            value += input[j + 1];
            j += 2;
            continue;
          }
          value += input[j];
          j++;
        }
        i = Math.min(j + 1, input.length);
        continue;
      }
      if (c === "\\" && i + 1 < input.length) {
        value += input[i + 1];
        i += 2;
        continue;
      }
      value += c;
      i++;
    }
    tokens.push({
      start,
      end: i,
      raw: input.slice(start, i),
      value,
      op: false,
    });
  }
  return tokens;
}

interface Segment {
  words: Token[];
  /** Index of the command word in `words`, or -1. */
  commandIndex: number;
  /** Lower-cased base name of the command, without extension. */
  command: string;
  /** Index of the pipeline this segment belongs to. */
  pipeline: number;
  /** Tokens following `<<<` inside this segment. */
  hereStrings: Token[];
}

function commandName(value: string): string {
  const base = value.split(/[\\/]/).pop() ?? value;
  return base.toLowerCase().replace(/\.(exe|cmd|bat|ps1|sh)$/, "");
}

function splitSegments(tokens: Token[]): Segment[] {
  const segments: Segment[] = [];
  let pipeline = 0;
  let words: Token[] = [];
  const hereStrings: Token[] = [];
  let afterHereString = false;

  const flush = () => {
    if (words.length === 0 && hereStrings.length === 0) return;
    let index = 0;
    while (index < words.length) {
      const value = words[index].value;
      if (ENV_ASSIGNMENT.test(value)) {
        index++;
        continue;
      }
      // PowerShell: `$pw = ConvertTo-SecureString …`.
      if (/^\$[\w:]+$/.test(value) && words[index + 1]?.value === "=") {
        index += 2;
        continue;
      }
      const name = commandName(value);
      if (WRAPPERS.has(name)) {
        index++;
        while (index < words.length && words[index].value.startsWith("-")) {
          const flag = words[index].value;
          index++;
          if ((flag === "-u" || flag === "-g") && index < words.length) index++;
        }
        continue;
      }
      break;
    }
    segments.push({
      words,
      commandIndex: index < words.length ? index : -1,
      command: index < words.length ? commandName(words[index].value) : "",
      pipeline,
      hereStrings: [...hereStrings],
    });
    words = [];
    hereStrings.length = 0;
  };

  for (const token of tokens) {
    if (token.op) {
      if (token.value === "<<<") {
        afterHereString = true;
        continue;
      }
      flush();
      if (token.value !== "|") pipeline++;
      continue;
    }
    if (afterHereString) {
      hereStrings.push(token);
      afterHereString = false;
      continue;
    }
    words.push(token);
  }
  flush();
  return segments;
}

// ── Token rules ──────────────────────────────────────────────────────────────

type Span = [number, number];

function isFlag(token: Token): boolean {
  return /^-{1,2}[A-Za-z]/.test(token.value);
}

/**
 * A flag's name, or null when the token is no plain `--name`, `--name=value`
 * or PowerShell `-Name:value` flag (an attached short option such as
 * `-H'X-Api-Key: …'` is none of them).
 */
function flagName(token: Token): string | null {
  const bound = POWERSHELL_COLON_BINDING.exec(token.value);
  if (bound) return bound[1];
  const match = /^-{1,2}([A-Za-z][A-Za-z0-9_.-]*)(?:=|$)/.exec(token.value);
  return match ? match[1] : null;
}

/** PowerShell binds a parameter value with a colon: `-Password:value`. */
const POWERSHELL_COLON_BINDING = /^-([A-Za-z][A-Za-z0-9]*):/;

/**
 * The offset in a flag's raw text where its attached value starts: after
 * `=`, or after the colon of a PowerShell binding. -1 when the value is the
 * next token.
 */
function attachedValueOffset(token: Token): number {
  if (POWERSHELL_COLON_BINDING.test(token.value)) {
    return token.raw.indexOf(":") + 1;
  }
  const equals = token.raw.indexOf("=");
  return equals === -1 ? -1 : equals + 1;
}

/**
 * PowerShell parameters that carry a secret. A cmdlet accepts any unique
 * prefix of a parameter name (`-Pa`, `-Tok`, `-ClientSec`), so inside a
 * cmdlet or script a flag counts when it is a prefix of one of these.
 */
const POWERSHELL_SECRET_PARAMETERS = [
  "password",
  "passphrase",
  "token",
  "accesstoken",
  "apikey",
  "clientsecret",
  "secret",
  "credential",
  "certificatepassword",
];

/** `Verb-Noun` with an approved PowerShell verb, or a `.ps1` script. */
const POWERSHELL_COMMAND =
  /^(?:add|approve|assert|backup|block|build|checkpoint|clear|close|compare|complete|compress|confirm|connect|convert|convertfrom|convertto|copy|debug|deny|deploy|disable|disconnect|dismount|edit|enable|enter|exit|expand|export|find|format|get|grant|group|hide|import|initialize|install|invoke|join|limit|lock|measure|merge|mount|move|new|open|optimize|out|ping|pop|protect|publish|push|read|receive|redo|register|remove|rename|repair|request|reset|resize|resolve|restart|restore|resume|revoke|save|search|select|send|set|show|skip|split|start|step|stop|submit|suspend|switch|sync|test|trace|unblock|undo|uninstall|unlock|unprotect|unpublish|unregister|update|use|wait|watch|write)-[a-z0-9]+$/i;

function isPowerShellAbbreviation(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.length >= 2 &&
    /^[a-z]+$/.test(lower) &&
    POWERSHELL_SECRET_PARAMETERS.some((parameter) =>
      parameter.startsWith(lower),
    )
  );
}

function isSensitiveName(name: string): boolean {
  return SENSITIVE_NAME.test(name) && !BENIGN_NAME.test(name);
}

/**
 * The span of a token's raw text from `offset` to its end. A token that is
 * quoted as a whole keeps its closing quote, so the output stays balanced.
 */
function tailSpan(token: Token, offset: number): Span | null {
  let end = token.end;
  const first = token.raw[0];
  if (
    (first === '"' || first === "'") &&
    token.raw.length > 1 &&
    token.raw.endsWith(first)
  ) {
    end -= 1;
  }
  const start = token.start + offset;
  return end > start ? [start, end] : null;
}

/** The span of a token's text after its first `=`. */
function afterEquals(token: Token): Span | null {
  const offset = token.raw.indexOf("=");
  if (offset === -1) return null;
  return tailSpan(token, offset + 1);
}

/** A flag value: everything after its own `=` when it is `KEY=value`. */
function valueSpan(token: Token): Span {
  return afterEquals(token) ?? [token.start, token.end];
}

/**
 * The value token after a flag that takes one. A following token that looks
 * like a flag is taken as the value only when its text, without the leading
 * hyphens, looks like a generated secret (`--token -AbC…`).
 */
function nextValue(words: Token[], index: number): Token | null {
  const next = words[index + 1];
  if (!next) return null;
  if (isFlag(next) && !looksLikeSecret(next.value.replace(/^-+/, ""))) {
    return null;
  }
  return next;
}

function collectSpans(segment: Segment, all: Segment[], spans: Span[]): void {
  const { words, commandIndex, command } = segment;
  const add = (span: Span | null) => {
    if (span) spans.push(span);
  };

  // Leading assignments: `TOKEN=x cmd`, and everything assigned by
  // export/declare/set/env and friends.
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const assigning =
      i < commandIndex ||
      commandIndex === -1 ||
      ASSIGNMENT_COMMANDS.has(command);
    if (assigning && ENV_ASSIGNMENT.test(word.value)) add(afterEquals(word));
  }
  if (command === "setx") {
    // `setx [/s host [/u user [/p password]]] NAME value [/m]`: switches may
    // come first, so the value is the second positional, not a fixed index.
    // `/p` carries a password itself; `/k` and `/f` name a source instead
    // of a value.
    const positionalsAfterSwitches: Token[] = [];
    let fromSource = false;
    for (let i = commandIndex + 1; i < words.length; i++) {
      const value = words[i].value;
      if (/^[/-][A-Za-z]$/.test(value)) {
        const switchName = value.slice(1).toLowerCase();
        if (
          ["s", "u", "p", "k", "f", "a", "r", "x", "d"].includes(switchName)
        ) {
          if (switchName === "p") add(spanOf(words[i + 1]));
          if (["k", "f", "a", "r", "x"].includes(switchName)) fromSource = true;
          i++;
        }
        continue;
      }
      positionalsAfterSwitches.push(words[i]);
    }
    if (!fromSource) add(spanOf(positionalsAfterSwitches[1]));
  }

  const commandWord = commandIndex >= 0 ? words[commandIndex].value : "";
  const powerShellCommand =
    POWERSHELL_COMMAND.test(command) || /\.ps1$/i.test(commandWord);
  for (let i = commandIndex + 1; commandIndex >= 0 && i < words.length; i++) {
    const word = words[i];
    if (!isFlag(word)) continue;
    const name = flagName(word);
    if (!name) continue;
    const sensitive =
      isSensitiveName(name) ||
      (powerShellCommand && isPowerShellAbbreviation(name));
    if (!sensitive) continue;
    const offset = attachedValueOffset(word);
    if (offset !== -1) add(tailSpan(word, offset));
    else add(spanOf(nextValue(words, i)));
  }

  const args = commandIndex >= 0 ? words.slice(commandIndex + 1) : [];
  const positionals = args.filter((word) => !isFlag(word));

  if (MYSQL_FAMILY.has(command)) {
    for (const word of args) {
      if (/^-p.+/.test(word.value)) add(tailSpan(word, 2));
    }
  }
  if (command === "sshpass") {
    for (let i = commandIndex + 1; i < words.length; i++) {
      const value = words[i].value;
      if (/^-p.+/.test(value)) add(tailSpan(words[i], 2));
      if (value === "-p") add(spanOf(words[i + 1]));
    }
  }
  if (command === "az") {
    for (let i = commandIndex + 1; i < words.length; i++) {
      if (words[i].value === "-p") add(spanOf(words[i + 1]));
    }
  }
  if (command === "sqlcmd" || command === "bcp" || command === "osql") {
    for (let i = commandIndex + 1; i < words.length; i++) {
      if (words[i].value === "-P") add(spanOf(words[i + 1]));
    }
  }
  if (command === "openssl") {
    for (let i = commandIndex + 1; i < words.length; i++) {
      if (words[i].value === "-k" || words[i].value === "-K") {
        add(spanOf(words[i + 1]));
      }
    }
  }
  if (HTTP_TOOLS.has(command)) {
    // `-u user:pass`: the user stays, the password goes.
    for (let i = commandIndex + 1; i < words.length; i++) {
      const value = words[i].value;
      let target: Token | undefined;
      let from = 0;
      if (/^(?:-u|-U|--user|--proxy-user)$/.test(value)) {
        target = words[i + 1];
      } else if (/^--(?:proxy-)?user=/.test(value)) {
        target = words[i];
        from = words[i].raw.indexOf("=") + 1;
      } else if (/^-[uU].+/.test(value)) {
        target = words[i];
        from = 2;
      }
      if (!target || target.op) continue;
      const colon = target.raw.indexOf(":", from);
      if (colon !== -1) add(tailSpan(target, colon + 1));
    }
  }
  if (
    (command === "docker" || command === "podman" || command === "nerdctl") &&
    words.some((word) => word.value === "login")
  ) {
    // `docker login -u bob -p secret` and `-psecret`.
    for (let i = commandIndex + 1; i < words.length; i++) {
      const value = words[i].value;
      if (value === "-p") add(spanOf(words[i + 1]));
      else if (/^-p.+/.test(value)) add(tailSpan(words[i], 2));
    }
  }
  if (CONTAINER_TOOLS.has(command)) {
    for (let i = commandIndex + 1; i < words.length; i++) {
      const value = words[i].value;
      if (/^(?:-e|--env|--build-arg)$/.test(value)) {
        const next = words[i + 1];
        if (next?.value.includes("=")) add(afterEquals(next));
      } else if (/^(?:--env|--build-arg)=.*=/.test(value)) {
        const first = words[i].raw.indexOf("=");
        const second = words[i].raw.indexOf("=", first + 1);
        add(tailSpan(words[i], second + 1));
      } else if (/^-e[A-Za-z_][A-Za-z0-9_]*=/.test(value)) {
        add(afterEquals(words[i]));
      }
    }
  }
  if (command === "net" && positionals[0]?.value.toLowerCase() === "use") {
    // cmd does not escape with backslashes, so UNC paths are read raw.
    for (const word of positionals.slice(1)) {
      const raw = word.raw;
      if (raw.startsWith("/") || raw.startsWith("\\\\")) continue;
      if (/^[A-Za-z]:$/.test(raw) || raw === "*") continue;
      add(spanOf(word));
    }
  }
  if (
    command === "htpasswd" &&
    args.some((word) => /^-\w*b/.test(word.value))
  ) {
    add(spanOf(positionals[positionals.length - 1]));
  }
  if (command === "convertto-securestring") {
    add(spanOf(positionals[0]));
    for (let i = commandIndex + 1; i < words.length; i++) {
      if (/^-s(?:t(?:r(?:i(?:n(?:g)?)?)?)?)?$/i.test(words[i].value)) {
        add(spanOf(words[i + 1]));
      } else if (/^-s[a-z]*:/i.test(words[i].value)) {
        add(tailSpan(words[i], words[i].raw.indexOf(":") + 1));
      }
    }
  }

  // `config set KEY VALUE`, `configure set`, `git config KEY VALUE`.
  const lower = args.map((word) => word.value.toLowerCase());
  const configAt = lower.findIndex(
    (value) => value === "config" || value === "configure",
  );
  if (configAt !== -1) {
    let k = configAt + 1;
    if (lower[k] === "set") k++;
    while (k < args.length && isFlag(args[k])) k++;
    const key = args[k];
    const value = args[k + 1];
    if (
      key &&
      value &&
      isSensitiveName(key.value) &&
      !key.value.includes("=")
    ) {
      add(spanOf(value));
    }
  }

  // Secret managers: `gh secret set`, `kubectl create secret`,
  // `fly secrets set`, `docker secret create`.
  if (lower.some((value) => value === "secret" || value === "secrets")) {
    for (let i = 0; i < args.length; i++) {
      const word = args[i];
      if (isFlag(word)) {
        if (/^-{1,2}(?:body|b|value|data|from-literal)$/i.test(word.value)) {
          const next = args[i + 1];
          if (next) add(valueSpan(next));
        } else if (/^--(?:body|value|data|from-literal)=/i.test(word.value)) {
          const first = word.raw.indexOf("=");
          const inner = word.raw.indexOf("=", first + 1);
          add(tailSpan(word, (inner === -1 ? first : inner) + 1));
        }
      } else if (/^[^=\s]+=./.test(word.value)) {
        add(afterEquals(word));
      }
    }
  }

  // Values piped into a command that reads a secret from stdin.
  const readsSecretFromStdin = (candidate: Segment) => {
    const values = candidate.words.map((word) => word.value.toLowerCase());
    // `sudo -S` reads the password from stdin; its flags sit before the
    // wrapped command.
    const wrapper = candidate.words.slice(
      0,
      candidate.commandIndex === -1
        ? candidate.words.length
        : candidate.commandIndex,
    );
    const sudoReadsStdin =
      wrapper.some((word) => commandName(word.value) === "sudo") &&
      wrapper.some((word) => /^-[A-Za-z]*S[A-Za-z]*$/.test(word.value));
    return (
      sudoReadsStdin ||
      candidate.command === "chpasswd" ||
      values.some((value) => STDIN_SECRET_FLAGS.test(value)) ||
      (candidate.command === "passwd" && values.includes("--stdin")) ||
      (values.some((value) => value === "secret" || value === "secrets") &&
        values.some((value) => ["set", "create", "add"].includes(value)))
    );
  };
  if (ECHO_COMMANDS.has(command)) {
    const later = all.filter(
      (candidate) =>
        candidate.pipeline === segment.pipeline &&
        all.indexOf(candidate) > all.indexOf(segment),
    );
    if (later.some(readsSecretFromStdin)) {
      for (const word of args) add(spanOf(word));
    }
  }

  for (const token of segment.hereStrings) add(spanOf(token));
}

function spanOf(token: Token | null | undefined): Span | null {
  if (!token || token.op) return null;
  return [token.start, token.end];
}

function applySpans(input: string, spans: Span[]): string {
  const sorted = spans
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);
  const merged: Span[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push([span[0], span[1]]);
  }
  let output = "";
  let cursor = 0;
  for (const [start, end] of merged) {
    output += input.slice(cursor, start) + REDACTED;
    cursor = end;
  }
  return output + input.slice(cursor);
}

// ── Pattern rules ────────────────────────────────────────────────────────────

const PATTERN_RULES: Array<[RegExp, string]> = [
  // Private key blocks, also when the end marker was cut off.
  [
    /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z0-9 ]*PRIVATE KEY-----|$)/g,
    REDACTED,
  ],
  // Heredoc bodies: the header line stays, the body goes.
  [
    /((?<!<)<<(?!<)-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2[^\n]*\n)[\s\S]*?(\n[ \t]*\3[ \t]*(?=\n|$)|$)/g,
    `$1${REDACTED}$4`,
  ],
  // JWTs: three base64url parts; the dots defeat naive entropy checks.
  [/\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*/g, REDACTED],
  // Well-known token formats.
  [
    /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{20,}|[rs]k_(?:live|test)_[A-Za-z0-9]{10,}|A[KS]IA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|npm_[A-Za-z0-9]{36})\b/g,
    REDACTED,
  ],
  // Credentials inside URLs: keep the user, drop the password.
  [
    /\b([a-z][a-z0-9+.-]*:\/\/[^\s/?#@:'"]*):([^\s/?#@'"]+)@/gi,
    `$1:${REDACTED}@`,
  ],
  // Sensitive HTTP headers, wherever they appear.
  [
    /\b((?:proxy-)?authorization|cookie|set-cookie|x-api-key|api-key|apikey|x-auth-token|x-access-token|private-token|x-[a-z0-9-]*(?:token|key|secret|auth)[a-z0-9-]*)(\s*:\s*)([^'"\r\n]+)/gi,
    `$1$2${REDACTED}`,
  ],
  // JSON fields with a secret-sounding key.
  [
    /("[^"\n]*(?:pass|pwd|secret|token|key|auth|cred|cookie|bearer)[^"\n]*"\s*:\s*)"(?:[^"\\\n]|\\.)*"/gi,
    `$1"${REDACTED}"`,
  ],
  // The same inside a double-quoted shell argument, where every quote is
  // escaped: `curl -d "{\"password\": \"…\"}"`.
  [
    /(\\"[^"\\\n]*(?:pass|pwd|secret|token|key|auth|cred|cookie|bearer)[^"\\\n]*\\"\s*:\s*)\\"(?:[^"\\\n]|\\(?!"))*\\"/gi,
    `$1\\"${REDACTED}\\"`,
  ],
  // PowerShell environment and SetEnvironmentVariable.
  [/(\$env:[A-Za-z0-9_]+\s*=\s*)("[^"]*"|'[^']*'|[^\s;|]+)/gi, `$1${REDACTED}`],
  [
    /(SetEnvironmentVariable\(\s*(?:"[^"]*"|'[^']*'|[^,()]+)\s*,\s*)("[^"]*"|'[^']*'|[^,()]+)/gi,
    `$1${REDACTED}`,
  ],
  // Windows switches: `/pass:x`, `/password:x`.
  [
    /((?:^|\s)\/[A-Za-z-]*(?:pass|pwd|secret|token|key|cred)[A-Za-z-]*:)("[^"]*"|'[^']*'|[^\s;|]+)/gi,
    `$1${REDACTED}`,
  ],
  // `key=value` with a secret-sounding key: form data, connection strings,
  // .npmrc lines, attached flags.
  [
    /([^\s=;&'"`,{}()]*(?:pass|pwd|secret|token|key|auth|cred|cookie|bearer)[^\s=;&'"`,{}()]*\s*=\s*)("[^"]*"|'[^']*'|[^\s;&'"`,)]+)/gi,
    `$1${REDACTED}`,
  ],
];

// ── High-entropy strings ─────────────────────────────────────────────────────

const ULID = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

function shannonEntropy(value: string): number {
  const counts = new Map<string, number>();
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Whether a run of token characters looks like a generated secret rather
 * than a word, a path or an identifier. Hex runs of 32 or more characters
 * count, except the 40-character git object id. Other runs need letters and
 * digits and an entropy close to that of a random string of their length.
 */
export function looksLikeSecret(run: string): boolean {
  // One leading hyphen may belong to the secret (`-AbC…`); a run that starts
  // with two is a long option name.
  if (/^-[^-]/.test(run)) return looksLikeSecret(run.slice(1));
  if (run.length < 20 || run.startsWith("-") || ULID.test(run)) return false;
  if (/^[0-9a-f]+$/i.test(run)) return run.length >= 32 && run.length !== 40;
  if (!/[0-9]/.test(run) || !/[A-Za-z]/.test(run)) return false;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[+/_=-]/].filter((pattern) =>
    pattern.test(run),
  ).length;
  const threshold = 0.82 * Math.log2(Math.min(run.length, 64));
  const entropy = shannonEntropy(run);
  return (
    (classes >= 3 && entropy >= threshold) ||
    (classes >= 2 && entropy >= threshold + 0.35)
  );
}

/** A path segment that reads like a name: `src`, `Users`, `zam2026`. */
const WORDY_SEGMENT =
  /^(?:[a-z][a-z0-9_.-]*|[A-Z][a-z0-9_.-]+|[A-Z0-9_]{1,8})$/;

function redactHighEntropy(input: string): string {
  return input.replace(/[A-Za-z0-9+/_=-]{20,}/g, (run) => {
    if (!run.includes("/")) return looksLikeSecret(run) ? REDACTED : run;
    // A path is judged segment by segment, a base64 string as a whole: in a
    // path most segments read like names, in base64 almost none do.
    const segments = run.split("/").filter(Boolean);
    const wordy = segments.filter((segment) => WORDY_SEGMENT.test(segment));
    if (segments.length >= 2 && wordy.length * 2 >= segments.length) {
      return run
        .split("/")
        .map((segment) => (looksLikeSecret(segment) ? REDACTED : segment))
        .join("/");
    }
    return looksLikeSecret(run) ? REDACTED : run;
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Redact the values of one command line, keeping its structure. */
export function redactCommand(command: string): string {
  if (!command) return command;
  const segments = splitSegments(tokenize(command));
  const spans: Span[] = [];
  for (const segment of segments) collectSpans(segment, segments, spans);
  let output = applySpans(command, spans);
  for (const [pattern, replacement] of PATTERN_RULES) {
    output = output.replace(pattern, replacement);
  }
  return redactHighEntropy(output);
}

import { type ReactNode, useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

const features = [
  {
    title: "Typed method helpers",
    description:
      "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, and custom requests all return typed RequestResult values.",
  },
  {
    title: "Reusable clients",
    description:
      "Share base URLs, headers, timeouts, redirect policy, response parsing, and logging across a test suite.",
  },
  {
    title: "Params and JSON bodies",
    description:
      "Append primitive and repeated query params, then send JSON request bodies with sensible default headers.",
  },
  {
    title: "Normalized responses",
    description:
      "Read status, ok, headers, parsed data, and the original fetch Response from one consistent result shape.",
  },
  {
    title: "Assertion helpers",
    description:
      "Assert status codes, headers, redirects, JSON/text bodies, and common image payloads without test boilerplate.",
  },
  {
    title: "Errors with context",
    description:
      "HTTP and invalid JSON errors keep status, headers, URL, and parsed or raw body details for debugging.",
  },
  {
    title: "Fetch-native controls",
    description:
      "Use AbortSignal, redirect modes, HeadersInit, Response, and runtime fetch behavior directly where it matters.",
  },
  {
    title: "Redacted logging",
    description:
      "Built-in and custom logger hooks redact sensitive headers, params, and body keys before events are emitted.",
  },
  {
    title: "Parser overrides",
    description:
      "Let lighty infer JSON, text, and binary responses, or force json, text, arrayBuffer, blob, stream, or none.",
  },
];

const installCommands = [
  "pnpm add @azeljkovic/lighty",
  "npm install @azeljkovic/lighty",
  "yarn add @azeljkovic/lighty",
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const logoUrl = useBaseUrl("/img/logo.svg");
  const [installCopied, setInstallCopied] = useState(false);
  const [installCommandIndex, setInstallCommandIndex] = useState(0);
  const installCommand = installCommands[installCommandIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setInstallCommandIndex((index) => (index + 1) % installCommands.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  async function copyInstallCommand() {
    try {
      await navigator.clipboard.writeText(installCommand);
      setInstallCopied(true);
      window.setTimeout(() => setInstallCopied(false), 1600);
    } catch {
      setInstallCopied(false);
    }
  }

  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <Heading as="h1" className={styles.title}>
              ⚡️lighty
            </Heading>
            <p className={styles.subtitle}>{siteConfig.tagline}</p>

            <div className={styles.installCommand} aria-label="Install lighty">
              <span>$</span>
              <code
                aria-live="polite"
                className={styles.installCommandText}
                key={installCommand}
              >
                {installCommand}
              </code>
              <button
                aria-label={
                  installCopied
                    ? "Copied install command"
                    : "Copy install command"
                }
                className={`${styles.copyInstallButton} ${
                  installCopied ? styles.copyInstallButtonCopied : ""
                }`}
                onClick={copyInstallCommand}
                title={installCopied ? "Copied" : "Copy"}
                type="button"
              >
                {installCopied ? (
                  <svg
                    aria-hidden="true"
                    className={styles.copyInstallIcon}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="m5 12 4 4L19 6"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.25"
                    />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className={styles.copyInstallIcon}
                    viewBox="0 0 24 24"
                  >
                    <rect
                      fill="none"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="11"
                      x="8"
                      y="8"
                    />
                    <path
                      d="M5 15V7a2 2 0 0 1 2-2h8"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className={styles.buttons}>
              <Link className={styles.primaryButton} to="/docs/getting-started">
                Get Started
              </Link>
              <Link
                className={styles.secondaryButton}
                to="/docs/request-api/configuration"
              >
                Request API
              </Link>
              <Link
                className={styles.secondaryButton}
                to="/docs/assertions/overview"
              >
                Assertions
              </Link>
            </div>
          </div>

          <div
            className={styles.heroPreview}
            aria-label="lighty request example"
          >
            <div className={styles.previewHeader}>
              <img src={logoUrl} alt="" className={styles.previewLogo} />
              <div>
                <strong>lighty</strong>
                <span>RequestResult&lt;User&gt;</span>
              </div>
            </div>
            <pre className={styles.codeCard}>
              <code>{`const client = createClient({
  baseUrl: "https://api.example.test",
  timeoutMs: 5_000,
});

const result = await client.postRequest<User>("/users", {
  params: { source: "test" },
  body: { name: "Ada", active: true },
});

lightyAssert.statusCodeIs(result, 201);`}</code>
            </pre>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Why lighty?</Heading>
          <p>
            Raw fetch stays close by, while repeat test setup moves into small
            typed helpers.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CodeSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Create, request, assert</Heading>
          <p>
            Configure shared defaults once, then keep each test focused on the
            behavior it verifies.
          </p>
        </div>
        <div className={styles.codeGrid}>
          <div className={styles.codePanel}>
            <div className={styles.panelLabel}>Client defaults</div>
            <pre>
              <code>{`import {createClient} from "@azeljkovic/lighty";

const client = createClient({
  baseUrl: "https://api.example.test/v1",
  headers: {
    Authorization: "Bearer test-token",
  },
  timeoutMs: 5_000,
  responseType: "json",
  logger: "basic",
});`}</code>
            </pre>
          </div>
          <div className={styles.codePanel}>
            <div className={styles.panelLabel}>Typed result</div>
            <pre>
              <code>{`type User = {
  id: string;
  name: string;
  active: boolean;
};

const result = await client.getRequest<User>("/users/ada", {
  params: { includeAudit: true },
});

console.log(result.status);
console.log(result.data.name);`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className={styles.cta}>
      <div className="container">
        <Heading as="h2">Start building clearer tests</Heading>
        <p>
          Learn the request lifecycle, then move from typed clients and response
          parsing to focused assertions for the behavior your test cares about.
        </p>
        <div className={styles.buttons}>
          <Link className={styles.primaryButton} to="/docs/intro">
            Read Docs
          </Link>
          <Link
            className={styles.secondaryButton}
            to="/docs/request-api/configuration"
          >
            Request Configuration
          </Link>
          <Link
            className={styles.secondaryButton}
            to="/docs/assertions/overview"
          >
            Assertions
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} documentation`}
      description="Documentation for lighty request helpers and TypeScript request types."
    >
      <HomepageHeader />
      <main>
        <FeatureSection />
        <CodeSection />
        <CommunitySection />
      </main>
    </Layout>
  );
}

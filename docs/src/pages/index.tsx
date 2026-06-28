import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const features = [
  {
    title: 'Typed method helpers',
    description:
      'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, and custom requests all return typed RequestResult values.',
  },
  {
    title: 'Reusable clients',
    description:
      'Share base URLs, headers, timeouts, redirect policy, response parsing, and logging across a test suite.',
  },
  {
    title: 'Params and JSON bodies',
    description:
      'Append primitive and repeated query params, then send JSON request bodies with sensible default headers.',
  },
  {
    title: 'Normalized responses',
    description:
      'Read status, ok, headers, parsed data, and the original fetch Response from one consistent result shape.',
  },
  {
    title: 'Assertion helpers',
    description:
      'Assert status codes, headers, redirects, JSON/text bodies, and common image payloads without test boilerplate.',
  },
  {
    title: 'Errors with context',
    description:
      'HTTP and invalid JSON errors keep status, headers, URL, and parsed or raw body details for debugging.',
  },
  {
    title: 'Fetch-native controls',
    description:
      'Use AbortSignal, redirect modes, HeadersInit, Response, and runtime fetch behavior directly where it matters.',
  },
  {
    title: 'Redacted logging',
    description:
      'Built-in and custom logger hooks redact sensitive headers, params, and body keys before events are emitted.',
  },
  {
    title: 'Parser overrides',
    description:
      'Let lighty infer JSON, text, and binary responses, or force json, text, arrayBuffer, blob, stream, or none.',
  },
];

const runtimes = [
  'Node.js 24+',
  'ESM',
  'node:test',
  'Vitest',
  'Jest',
  'TypeScript',
  'Fetch API',
  'JSON',
  'Text',
  'ArrayBuffer',
  'Blob',
  'Streams',
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const logoUrl = useBaseUrl('/img/logo.svg');

  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Node.js HTTP testing</p>
            <Heading as="h1" className={styles.title}>
              Typed requests for integration tests
            </Heading>
            <p className={styles.subtitle}>{siteConfig.tagline}</p>

            <div className={styles.installCommand} aria-label="Install lighty">
              <span>$</span>
              <code>pnpm add lighty</code>
            </div>

            <div className={styles.buttons}>
              <Link className={styles.primaryButton} to="/docs/getting-started">
                Get Started
              </Link>
              <Link className={styles.secondaryButton} to="/docs/request-api/type-reference">
                Type Reference
              </Link>
              <Link className={styles.ghostButton} to="https://github.com/aleksandar/lighty">
                GitHub
              </Link>
            </div>
          </div>

          <div className={styles.heroPreview} aria-label="lighty request example">
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
  throwOnHttpError: false,
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
          <p>Raw fetch stays close by, while repeat test setup moves into small typed helpers.</p>
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

function RuntimeSection() {
  return (
    <section className={styles.band}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Built around platform primitives</Heading>
          <p>Use it with modern Node.js, ESM tests, and any runner that can execute them.</p>
        </div>
        <div className={styles.runtimeGrid}>
          {runtimes.map((runtime) => (
            <span className={styles.runtimePill} key={runtime}>
              {runtime}
            </span>
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
          <p>Configure shared defaults once, then keep each test focused on the behavior it verifies.</p>
        </div>
        <div className={styles.codeGrid}>
          <div className={styles.codePanel}>
            <div className={styles.panelLabel}>Client defaults</div>
            <pre>
              <code>{`import {createClient} from "lighty";

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
        <Heading as="h2">Start with the request API</Heading>
        <p>
          Read the lifecycle, then jump into typed clients, params, response parsing, errors,
          and logging.
        </p>
        <div className={styles.buttons}>
          <Link className={styles.primaryButton} to="/docs/intro">
            Read Docs
          </Link>
          <Link className={styles.secondaryButton} to="/docs/request-api/configuration">
            Request Configuration
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} documentation`}
      description="Documentation for lighty request helpers and TypeScript request types.">
      <HomepageHeader />
      <main>
        <FeatureSection />
        <RuntimeSection />
        <CodeSection />
        <CommunitySection />
      </main>
    </Layout>
  );
}

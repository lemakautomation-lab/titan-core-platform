import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home(): React.ReactElement {
  return (
    <Layout title="TITAN Knowledge Base" description="Controlled knowledge for the TITAN Enterprise Platform">
      <main style={{padding: '5rem 1.5rem'}}>
        <div style={{maxWidth: '900px', margin: '0 auto'}}>
          <p style={{letterSpacing: '0.12em', fontWeight: 700}}>TITAN TECHNOLOGIES</p>
          <h1>Controlled Knowledge Base</h1>
          <p>
            Authoritative engineering, governance, architecture, quality,
            security, operations, and mission knowledge for the TITAN Enterprise Platform.
          </p>
          <Link className="button button--primary button--lg" to="/docs">
            Enter Knowledge Base
          </Link>
        </div>
      </main>
    </Layout>
  );
}

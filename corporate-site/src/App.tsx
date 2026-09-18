import "./App.css";

const Arrow = () => <span aria-hidden="true">↗</span>;

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="TitanTech home">
          <span className="brand-mark">T</span>
          <span className="brand-name">
            TITAN<span>TECH</span>
          </span>
        </a>

        <nav className="nav" aria-label="Primary navigation">
          <a href="#enterprise">Enterprise</a>
          <a href="#health">TITAN Health</a>
          <a href="#engineering">Engineering</a>
          <a href="#company">Company</a>
        </nav>

        <a className="nav-cta" href="#enterprise">
          Explore TITAN <Arrow />
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <img
            className="hero-art"
            src="/visuals/titantech-hero.png"
            alt=""
            aria-hidden="true"
          />
          <div className="hero-shade" />
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-content">
            <div className="eyebrow">
              <span />
              TITAN ENTERPRISE
            </div>

            <h1>
              Engineering
              <strong>the intelligent future.</strong>
            </h1>

            <p>
              TitanTech creates secure, connected technology designed to turn
              complex information into intelligent digital experiences.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#enterprise">
                Explore TITAN Enterprise <Arrow />
              </a>
              <a className="button button-ghost" href="#company">
                Discover TitanTech
              </a>
            </div>
          </div>

          <div className="hero-rail" aria-hidden="true">
            <span>01</span>
            <span>INTELLIGENCE</span>
            <span>CONNECTED SYSTEMS</span>
            <span>PERFORMANCE</span>
          </div>
        </section>

        <section className="company section" id="company">
          <div className="section-label">TITANTECH / 001</div>

          <div className="company-grid">
            <h2>
              Technology engineered
              <span> for performance.</span>
            </h2>

            <div className="company-copy">
              <p>
                TitanTech is the technology company behind TITAN Enterprise,
                an extensible platform foundation for intelligent digital
                products and connected experiences.
              </p>
              <p>
                We focus on disciplined engineering, secure architecture and
                technology designed to evolve.
              </p>
            </div>
          </div>
        </section>

        <section className="product-section enterprise" id="enterprise">
          <div className="product-art-wrap">
            <img
              className="product-art"
              src="/visuals/titan-enterprise.png"
              alt="Futuristic digital infrastructure representing TITAN Enterprise"
            />
            <div className="art-overlay" />

            <div className="visual-caption">
              <span>PLATFORM / 01</span>
              <strong>TITAN ENTERPRISE</strong>
            </div>
          </div>

          <div className="product-copy">
            <div className="section-label">THE PLATFORM</div>

            <h2>
              One intelligent
              <span> foundation.</span>
            </h2>

            <p className="lead">
              TITAN Enterprise provides the architectural foundation for the
              TITAN ecosystem — connecting identity, information, products and
              digital workflows through deliberate platform boundaries.
            </p>

            <div className="feature-list">
              <div>
                <span>01</span>
                <strong>Connected architecture</strong>
              </div>
              <div>
                <span>02</span>
                <strong>Secure platform boundaries</strong>
              </div>
              <div>
                <span>03</span>
                <strong>Extensible product ecosystem</strong>
              </div>
              <div>
                <span>04</span>
                <strong>Evidence-led engineering</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="product-section health" id="health">
          <div className="product-copy">
            <div className="section-label">TITAN PRODUCT / 01</div>

            <div className="health-name">TITAN HEALTH</div>

            <h2>
              Human performance,
              <span> intelligently connected.</span>
            </h2>

            <p className="lead">
              TITAN Health is being engineered on TITAN Enterprise as an
              integrated environment for athletes, trainers and
              performance-focused users.
            </p>

            <div className="performance-tags">
              <span>ATHLETE</span>
              <span>TRAINER</span>
              <span>PERFORMANCE</span>
              <span>CONNECTED DATA</span>
            </div>
          </div>

          <div className="product-art-wrap">
            <img
              className="product-art"
              src="/visuals/titan-health.png"
              alt="Athlete represented through futuristic human-performance technology"
            />
            <div className="art-overlay health-overlay" />

            <div className="visual-caption">
              <span>PRODUCT / 01</span>
              <strong>TITAN HEALTH</strong>
            </div>
          </div>
        </section>

        <section className="engineering section" id="engineering">
          <div className="engineering-heading">
            <div>
              <div className="section-label">ENGINEERING / 003</div>
              <h2>
                Built with
                <span> discipline.</span>
              </h2>
            </div>

            <p>
              Technology earns trust through the way it is designed, secured,
              verified and operated.
            </p>
          </div>

          <div className="principles">
            <article>
              <div className="principle-code">SEC / 01</div>
              <div className="principle-icon">◈</div>
              <h3>Security by design</h3>
              <p>
                Authentication, authorization, isolation and safe system
                boundaries are architectural concerns from the beginning.
              </p>
            </article>

            <article>
              <div className="principle-code">ENG / 02</div>
              <div className="principle-icon">⌁</div>
              <h3>Evidence-led engineering</h3>
              <p>
                Controlled delivery, automated verification and documented
                evidence support engineering release boundaries.
              </p>
            </article>

            <article>
              <div className="principle-code">GOV / 03</div>
              <div className="principle-icon">◇</div>
              <h3>Governed delivery</h3>
              <p>
                Defined scope, traceability and quality controls support
                disciplined technology development.
              </p>
            </article>
          </div>
        </section>

        <section className="future">
          <div className="future-grid" aria-hidden="true" />
          <div className="future-glow" aria-hidden="true" />

          <div>
            <div className="section-label">TITANTECH</div>
            <h2>
              Building what
              <span> comes next.</span>
            </h2>
          </div>

          <p>
            TITAN Enterprise provides the foundation. TitanTech continues
            building the products, systems and experiences that extend it.
          </p>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">T</span>
          <span className="brand-name">
            TITAN<span>TECH</span>
          </span>
        </div>

        <p>Technology engineered for performance.</p>
        <p>© 2026 TitanTech</p>
      </footer>
    </div>
  );
}

export default App;
// Components for BreakingRanksBooks landing page
const { useState, useEffect, useRef } = React;

// === Icons ===
const Icon = {
  Arrow: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>,
  Mail: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="1"/><path d="M2 6l10 7 10-7"/></svg>,
  Star: ({ filled = true }) => <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>,
  Amazon: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.7 14.5c-2.4 1.8-5.9 2.7-8.9 2.7-4.2 0-8-1.6-10.9-4.2-.2-.2 0-.5.3-.4 3.1 1.8 7 2.9 11 2.9 2.7 0 5.6-.6 8.3-1.7.4-.2.7.3.2.7zm1-1.2c-.3-.4-2.1-.2-2.8-.1-.2 0-.3-.2-.1-.3 1.4-1 3.6-.7 3.9-.4.2.3-.1 2.5-1.4 3.5-.2.2-.4.1-.3-.1.3-.7 1-2.2.7-2.6z"/><path d="M13.5 8.8c0 .9 0 1.6-.4 2.4-.4.6-.9 1-1.6 1-.9 0-1.4-.7-1.4-1.7 0-2 1.8-2.4 3.4-2.4v.7zm2.3 5.5c-.2.1-.4.1-.5 0-.7-.6-.8-.8-1.2-1.4-1.1 1.2-1.9 1.5-3.4 1.5-1.7 0-3.1-1.1-3.1-3.2 0-1.7 1-2.8 2.3-3.4 1.2-.5 2.8-.6 4-.7v-.3c0-.5 0-1.1-.3-1.5-.2-.4-.7-.5-1.1-.5-.8 0-1.4.4-1.6 1.2 0 .2-.2.4-.3.4l-2-.2c-.2 0-.3-.2-.3-.4.5-2.4 2.6-3.1 4.5-3.1 1 0 2.3.3 3 1 1 .9.9 2.1.9 3.4v3.1c0 .9.4 1.3.7 1.8.1.2.1.4 0 .5-.4.3-1.1 1-1.5 1.3z"/></svg>,
};

const Stars = ({ count = 5 }) => (
  <span className="stars" aria-label={`${count} stars`}>
    {Array.from({length: 5}).map((_,i) => <span key={i}>{i < count ? "★" : "☆"}</span>)}
  </span>
);

// === Cover Renderers ===
// Generative cover for books without an uploaded image
function CoverArt({ style }) {
  if (style === "march") {
    return (
      <svg className="cover-art" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="march-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a85a" stopOpacity="0.6"/>
            <stop offset="60%" stopColor="#d4a85a" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        <rect width="200" height="300" fill="url(#march-sky)"/>
        {/* horizon line */}
        <line x1="0" y1="200" x2="200" y2="200" stroke="#d4a85a" strokeWidth="0.5" opacity="0.4"/>
        {/* silhouettes of marching figures */}
        {[40, 70, 100, 130, 160].map((x, i) => (
          <g key={i} transform={`translate(${x}, ${198 - i*0.5})`} opacity={0.85 - i*0.08}>
            <rect x="-3" y="-22" width="6" height="22" fill="#1a1208"/>
            <circle cx="0" cy="-25" r="3" fill="#1a1208"/>
            <line x1="-3" y1="-15" x2="-7" y2="-5" stroke="#1a1208" strokeWidth="2"/>
            <line x1="3" y1="-15" x2="6" y2="-5" stroke="#1a1208" strokeWidth="2"/>
          </g>
        ))}
        {/* sun */}
        <circle cx="140" cy="160" r="22" fill="#e8c078" opacity="0.5"/>
      </svg>
    );
  }
  if (style === "dust") {
    return (
      <svg className="cover-art" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dust-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0884a" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#3a1f14" stopOpacity="0.2"/>
          </linearGradient>
          <radialGradient id="dust-sun" cx="0.7" cy="0.4">
            <stop offset="0%" stopColor="#f0d8a8" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#f0d8a8" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="200" height="300" fill="url(#dust-sky)"/>
        <rect width="200" height="300" fill="url(#dust-sun)"/>
        {/* desert ground */}
        <path d="M0 220 Q 50 210 100 215 T 200 220 L 200 300 L 0 300 Z" fill="#1a0f08" opacity="0.6"/>
        {/* lone telegraph pole */}
        <line x1="60" y1="160" x2="60" y2="220" stroke="#1a0f08" strokeWidth="1.5"/>
        <line x1="52" y1="170" x2="68" y2="170" stroke="#1a0f08" strokeWidth="1"/>
        {/* distant ridge */}
        <path d="M0 200 L 30 195 L 70 198 L 110 192 L 160 196 L 200 194 L 200 220 L 0 220 Z" fill="#1a0f08" opacity="0.4"/>
      </svg>
    );
  }
  return null;
}

function GeneratedCover({ book, large = false }) {
  const c = book.color || {};
  return (
    <div
      className={`cover ${large ? "lg" : ""}`}
      style={{ "--cv-bg": c.bg, "--cv-fg": c.fg, "--cv-accent": c.accent }}
    >
      <CoverArt style={book.artStyle} />
      <div>
        <div className="cover-author">Wayne A. Ince</div>
        <div className="cover-rule" style={{ marginTop: 10 }} />
      </div>
      <div>
        <div className="cover-title">{book.title}</div>
        {book.subtitle && (
          <div className="cover-sub" style={{ marginTop: large ? 14 : 8 }}>{book.subtitle}</div>
        )}
      </div>
      <div className="cover-rule" style={{ alignSelf: "flex-end" }} />
    </div>
  );
}

function BookCover({ book, large = false }) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={book.title}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return <GeneratedCover book={book} large={large} />;
}

// === NAV ===
function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#" className="brand">
          <div className="brand-mark">B</div>
          <div className="brand-text">
            <span>BreakingRanks</span>
            <small>Books by Wayne A. Ince</small>
          </div>
        </a>
        <div className="nav-links">
          {window.NAV.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
        </div>
        <a href="#newsletter" className="nav-cta">Join the List</a>
      </div>
    </nav>
  );
}

// === HERO ===
function Hero({ book }) {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="wrap hero-grid">
        <div className="hero-left">
          <div className="hero-tag">
            <span className="hero-tag-pill">{book.badge || "Featured"}</span>
            <span className="hero-tag-text">{book.series} · {book.year} · {book.pages} pages</span>
          </div>
          <h1 className="display">
            Plainspoken.<br/>
            <em>Hard-earned.</em><br/>
            Unflinching.
          </h1>
          <p className="hero-lead lead">
            Memoir, essays, and fiction from a 23-year U.S. Air Force veteran writing the truth most men in uniform never say out loud.
          </p>
          <div className="hero-actions">
            <a href="#newsletter" className="btn btn-primary">
              Join the Newsletter
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </a>
            {book.buyUrl && (
              <a href={book.buyUrl} target="_blank" rel="noopener" className="btn btn-ghost">
                Buy on Amazon
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:14,height:14}}><path d="M7 17L17 7M9 7h8v8"/></svg>
              </a>
            )}
          </div>
          <div className="hero-meta">
            <div className="meta-item">
              <div className="meta-num">4.9<span style={{fontSize:18, color:"var(--ink-3)"}}>/5</span></div>
              <div className="meta-label">Reader Rating</div>
            </div>
            <div className="meta-item">
              <div className="meta-num">12K+</div>
              <div className="meta-label">Readers Reached</div>
            </div>
            <div className="meta-item">
              <div className="meta-num">23<span style={{fontSize:18, color:"var(--ink-3)"}}>yrs</span></div>
              <div className="meta-label">In Uniform</div>
            </div>
          </div>
        </div>

        <div className="featured">
          <div className="featured-glow" />
          <div className="featured-stage">
            <BookCover book={book} large={true} />
          </div>
          <div className="featured-stack">
            <div className="featured-stage" style={{ width: "100%", transform: "none" }}>
              <BookCover book={book} large={true} />
            </div>
          </div>
          <div className="featured-badges">
            <div className="badge-stamp">
              <span>
                <em>4.9 / 5</em>
                <strong>★★★★★</strong>
                from 1,200+ readers
              </span>
            </div>
            <div className="badge-tag">A Must-Read</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === MARQUEE ===
function Marquee() {
  const items = [
    "“A must-read thriller.”",
    "Veterans Today",
    "“Plainspoken and unflinching.”",
    "Stars & Stripes",
    "“Required reading.”",
    "Military.com",
    "“Practical. Honest. Necessary.”",
    "PTSD Journal",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {doubled.map((t, i) => <span key={i} className="marquee-item">{t}</span>)}
      </div>
    </div>
  );
}

// === BOOKS GRID ===
function BooksGrid({ onSelect }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Memoir", "Non-fiction", "Thriller"];
  const filtered = filter === "All" ? window.BOOKS : window.BOOKS.filter(b => b.genre === filter);

  return (
    <section className="books" id="books">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">The Library · 2022 — 2024</span>
            <h2 className="section-title" style={{ marginTop: 18 }}>
              Three books.<br/>
              One <em>unblinking</em> voice.
            </h2>
          </div>
          <p className="section-aside">
            Wayne writes from inside the experience — not from research. Pick up any one of these and you'll know within a page why readers keep coming back.
          </p>
        </div>

        <div className="books-filter">
          {filters.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>

        <div className="book-grid" style={{ gridTemplateColumns: `repeat(${Math.min(filtered.length, 3)}, 1fr)` }}>
          {filtered.map(book => (
            <article
              key={book.id}
              className="book-card"
              id={`book-${book.id}`}
              onClick={() => onSelect && onSelect(book)}
            >
              <div className="book-cover-wrap">
                <span className="book-rank">{book.rank}</span>
                <BookCover book={book} />
              </div>
              <div className="book-meta-row">
                <span>{book.genre}</span>
                <span className="dot">·</span>
                <span>{book.year}</span>
                <span className="dot">·</span>
                <span>{book.pages} pp</span>
              </div>
              <h3 className="book-title">{book.title}</h3>
              <p className="book-sub">{book.blurb}</p>
              <div className="book-rating">
                <Stars count={5} />
                <span>{book.rating} · {book.reviews.toLocaleString()} ratings</span>
              </div>
              {book.buyUrl && (
                <a
                  href={book.buyUrl}
                  target="_blank"
                  rel="noopener"
                  className="book-buy"
                  onClick={(e) => e.stopPropagation()}
                >
                  Buy on Amazon
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// === VIDEO SECTION ===
function VideoSection() {
  const [playing, setPlaying] = useState(false);
  return (
    <section style={{
      padding: "120px 0",
      background: "var(--bg-2)",
      borderTop: "1px solid var(--rule)",
      borderBottom: "1px solid var(--rule)",
      position: "relative",
    }} id="watch">
      <div className="wrap">
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span className="eyebrow" style={{ display: "inline-flex", justifyContent: "center" }}>30-Second Introduction</span>
          <h2 className="section-title" style={{ marginTop: 18, textAlign: "center" }}>
            Meet the work in <em>thirty seconds.</em>
          </h2>
          <p style={{
            maxWidth: 560, margin: "20px auto 0",
            color: "var(--ink-2)", fontSize: 16, lineHeight: 1.55,
          }}>
            Wayne, the books, where to find them. Watch it, then send it to someone who needs it.
          </p>
        </div>
        <div style={{
          position: "relative",
          maxWidth: 1100,
          margin: "0 auto",
          aspectRatio: "16/9",
          border: "1px solid var(--brass-3)",
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)",
          background: "#0a0604",
          overflow: "hidden",
        }}>
          <iframe
            src="video.html"
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            title="BreakingRanksBooks 30-second video"
            allow="autoplay"
          />
        </div>
        <div style={{
          textAlign: "center",
          marginTop: 28,
          fontFamily: "var(--mono)",
          fontSize: 11, letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}>
          Share with a friend · <a href="mailto:?subject=A 30-second introduction&body=BreakingRanksBooks — Wayne A. Ince. https://breakingranksbooks.com" style={{ color: "var(--brass)", borderBottom: "1px solid var(--brass)", paddingBottom: 1 }}>Send by email</a>
        </div>
        <div style={{
          textAlign: "center",
          marginTop: 10,
          fontFamily: "var(--sans)",
          fontSize: 12,
          color: "var(--ink-3)",
          fontStyle: "italic",
        }}>
          Tap inside the player to enable sound — browsers block audio until you click.
        </div>
      </div>
    </section>
  );
}

// === ABOUT ===
function About() {
  return (
    <section className="about" id="about">
      <div className="wrap about-grid">
        <div className="about-photo">
          <img
            src="assets/wayne-portrait.jpeg"
            alt="Wayne A. Ince"
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.05) saturate(0.95)" }}
          />
          <div className="about-photo-frame" />
          <div className="about-photo-label">Wayne A. Ince · "Big Sarge"</div>
        </div>
        <div className="about-content">
          <span className="eyebrow">About the Author</span>
          <h2 style={{ marginTop: 18 }}>
            Twenty-three years <em>in uniform.</em><br/>
            Four combat zones. One honest voice.
          </h2>
          <blockquote className="about-quote">
            "The hardest mission I ever ran wasn't overseas. It was the one where I finally let myself say I needed help. This is the book I wish someone had handed me."
            <span className="about-quote-attr">— Wayne, on Until the Well Runs Dry</span>
          </blockquote>
          <div className="about-body">
            <p>
              Wayne Ince is a retired U.S. Air Force Senior Master Sergeant with 23 years of service and combat deployments to Desert Storm, Haiti, Bosnia, and Kosovo. His own journey through delayed-onset PTSD became the foundation for his work as a mental health advocate, author, and founder of Breaking Ranks Books.
            </p>
            <p>
              Known in his community as "Big Sarge," Wayne writes and speaks with the directness of a career noncommissioned officer and the vulnerability of a man who has done the hard work of recovery. He is the voice behind Breaking Ranks Blog and is committed to ensuring veterans, first responders, and trauma survivors have access to honest, practical tools for healing.
            </p>
          </div>

          <div className="about-stats">
            {window.STATS.map(s => (
              <div key={s.label} className="about-stat">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// === REVIEWS ===
function Reviews() {
  return (
    <section className="reviews" id="reviews">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">What Readers Say</span>
            <h2 className="section-title" style={{ marginTop: 18 }}>
              The mail he <em>still answers</em> by hand.
            </h2>
          </div>
          <p className="section-aside">
            Wayne reads every letter. These are a few of the words that have come back from the people his books found.
          </p>
        </div>
        <div className="review-grid">
          {window.REVIEWS.map((r, i) => (
            <article key={i} className="review-card">
              <span className="qmark">"</span>
              <Stars count={r.stars} />
              <p className="review-text">{r.text}</p>
              <div className="review-meta">
                <div className="review-avatar">{r.initial}</div>
                <div>
                  <div className="review-name">{r.name}</div>
                  <div className="review-source">{r.source}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// === PRESS ===
function Press() {
  return (
    <section style={{ padding: "80px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", background: "var(--bg-2)" }} id="press">
      <div className="wrap">
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span className="eyebrow" style={{ justifyContent: "center", display: "inline-flex" }}>In the Press</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="press-grid">
          {window.PRESS.map((p, i) => (
            <div key={i} style={{ borderLeft: i === 0 ? "none" : "1px solid var(--rule)", paddingLeft: i === 0 ? 0 : 24, paddingRight: 8 }}>
              <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, lineHeight: 1.4, color: "var(--ink)", marginBottom: 14 }}>"{p.quote}"</p>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brass)" }}>— {p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === NEWSLETTER ===
//
// MAILCHIMP CONFIG — fill these two values in to wire up real signups.
// 1. In Mailchimp: Audience → Signup forms → Embedded forms → "Naked" or "Classic"
// 2. From the embed code, copy:
//    a) the <form action="..."> URL into MAILCHIMP_ACTION
//    b) the hidden honeypot input's name (looks like "b_abc123_def456") into MAILCHIMP_HONEYPOT
// Until both are filled in, the form falls back to the local welcome.html flow.
//
const MAILCHIMP_ACTION = "https://breakingranksbooks.us17.list-manage.com/subscribe/post?u=8a1952203bcdfbe258d7930f0&id=00d3800fb2&f_id=001bdde3f0";
const MAILCHIMP_HONEYPOT = "b_8a1952203bcdfbe258d7930f0_00d3800fb2";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const wired = MAILCHIMP_ACTION && MAILCHIMP_HONEYPOT;

  const submit = (e) => {
    e.preventDefault();
    if (!email) return;

    if (wired) {
      // Submit to Mailchimp silently in a hidden iframe, then navigate the
      // main tab to welcome.html. Avoids popup-blocker issues entirely.
      // Mailchimp still sends the double-opt-in confirmation email.
      const form = e.currentTarget;
      form.submit();
      setDone(true);
      setTimeout(() => { window.location.href = "welcome.html"; }, 1200);
      return;
    }
    // No Mailchimp wired — local fallback
    setDone(true);
    setTimeout(() => { window.location.href = "welcome.html"; }, 800);
  };

  return (
    <section className="newsletter" id="newsletter">
      <div className="wrap newsletter-inner">
        <span className="eyebrow" style={{ display: "inline-flex", justifyContent: "center" }}>The Breaking Ranks Letter</span>
        <h2>
          Get the next chapter <em>before it ships.</em>
        </h2>
        <p>
          Once a month. New writing, free excerpts from upcoming releases, the occasional letter from Wayne about the work, the road, and getting better.
          No spam. Unsubscribe in one click.
        </p>
        {done ? (
          <div style={{
            border: "1px solid var(--brass)",
            padding: "30px 28px",
            maxWidth: 500,
            margin: "0 auto",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 18,
            color: "var(--brass)",
          }}>
            Welcome aboard. Delivering your free chapter now…
          </div>
        ) : (
          <form
            className="newsletter-form"
            action={wired ? MAILCHIMP_ACTION : undefined}
            method={wired ? "post" : undefined}
            target={wired ? "mc-embedded-subscribe" : undefined}
            noValidate
            onSubmit={submit}
          >
            <input
              type="email"
              name="EMAIL"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {/* Mailchimp anti-bot honeypot — must be hidden from real users */}
            {wired && (
              <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
                <input type="text" name={MAILCHIMP_HONEYPOT} tabIndex="-1" defaultValue="" />
              </div>
            )}
            <button type="submit">Enlist →</button>
          </form>
        )}
        <div className="newsletter-bonus">
          <strong>Bonus:</strong> First chapter of Until the Well Runs Dry — free, instantly.
        </div>
        {/* Hidden iframe target — Mailchimp posts here silently so the
            main tab can navigate to welcome.html without popup blockers. */}
        {wired && (
          <iframe
            name="mc-embedded-subscribe"
            title="Mailchimp signup"
            style={{ position: "absolute", width: 0, height: 0, border: 0, opacity: 0, pointerEvents: "none" }}
            tabIndex="-1"
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
}

// === FOOTER ===
function Footer() {
  return (
    <footer id="contact">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <div className="brand" style={{ marginBottom: 8 }}>
              <div className="brand-mark">B</div>
              <div className="brand-text">
                <span>BreakingRanksBooks</span>
                <small>Books by Wayne A. Ince</small>
              </div>
            </div>
            <p className="foot-bio">
              Independent press built on one premise: tell the truth, plainly, and the right readers will find you. Honest writing for veterans, first responders, and the people who love them.
            </p>
          </div>
          <div className="foot-col">
            <h4>Books</h4>
            <ul>
              {window.BOOKS.map(b => <li key={b.id}><a href={b.buyUrl || `#book-${b.id}`} target={b.buyUrl ? "_blank" : undefined} rel={b.buyUrl ? "noopener" : undefined}>{b.title}</a></li>)}
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="#newsletter">Newsletter</a></li>
              <li><a href="#about">About Wayne</a></li>
              <li><a href="#">Breaking Ranks Blog</a></li>
              <li><a href="#">Speaking & Events</a></li>
              <li><a href="mailto:wayne@breakingranksbooks.com">wayne@breakingranksbooks.com</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Buy</h4>
            <ul>
              <li><a href="#">Amazon</a></li>
              <li><a href="#">Audible</a></li>
              <li><a href="#">Kindle</a></li>
              <li><a href="#">Signed Editions</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 BreakingRanksBooks · Wayne A. Ince</span>
          <span>Made plainly · Brookhaven, MS</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Nav, Hero, Marquee, BooksGrid, About, Reviews, Press, Newsletter, Footer,
  VideoSection,
  BookCover, GeneratedCover, Stars, Icon,
});

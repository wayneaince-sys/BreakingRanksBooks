// 30-second video scenes for BreakingRanksBooks
// 6 scenes ≈ 5s each. 1280×720 stage.
const { useState, useEffect, useRef } = React;

// === Helpers ===
function Frame({ children, style }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      ...style,
    }}>{children}</div>
  );
}

function NoiseTexture() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 1,
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")`,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }} />
  );
}

function VignettBG({ from = "#3a2e1f", to = "#1a1208" }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 0,
      background: `radial-gradient(ellipse at center, ${from} 0%, ${to} 80%)`,
    }} />
  );
}

// === Animated tape lower-third ===
function LowerThird({ start, end, label, sub }) {
  return (
    <Sprite start={start} end={end}>
      {() => {
        const { progress } = useSprite();
        const local = useTime() - start;
        const dur = end - start;
        const enter = animate({ from: 0, to: 1, start: 0, end: 0.5, ease: Easing.easeOutCubic })(local);
        const exit = local > dur - 0.5 ? animate({ from: 1, to: 0, start: dur - 0.5, end: dur, ease: Easing.easeInQuad })(local) : 1;
        const op = enter * exit;
        const tx = (1 - enter) * -40;
        return (
          <div style={{
            position: "absolute",
            left: 60, bottom: 60,
            opacity: op,
            transform: `translateX(${tx}px)`,
          }}>
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: 13, letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#d4a85a",
              marginBottom: 10,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ width: 24, height: 1, background: "#d4a85a" }} />
              {sub}
            </div>
            <div style={{
              fontFamily: "var(--serif)",
              fontSize: 38, fontWeight: 700,
              color: "#f4e8d0",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}>{label}</div>
          </div>
        );
      }}
    </Sprite>
  );
}

// === Scene 1: 0-5s · Title open ===
function Scene1() {
  return (
    <Sprite start={0} end={5}>
      {() => {
        const t = useTime();
        const local = t;
        // brand mark scale-in
        const markScale = animate({ from: 0.6, to: 1, start: 0.2, end: 1.2, ease: Easing.easeOutBack })(local);
        const markOp = animate({ from: 0, to: 1, start: 0.2, end: 1, ease: Easing.easeOutQuad })(local);
        // title rise
        const titleY = animate({ from: 30, to: 0, start: 0.8, end: 1.8, ease: Easing.easeOutCubic })(local);
        const titleOp = animate({ from: 0, to: 1, start: 0.8, end: 1.6, ease: Easing.easeOutQuad })(local);
        // tagline
        const tagOp = animate({ from: 0, to: 1, start: 1.6, end: 2.4, ease: Easing.easeOutQuad })(local);
        const tagY = animate({ from: 20, to: 0, start: 1.6, end: 2.4, ease: Easing.easeOutCubic })(local);
        // ruleline
        const ruleW = animate({ from: 0, to: 280, start: 2.2, end: 3.4, ease: Easing.easeInOutQuart })(local);
        // exit
        const exitOp = local > 4.4 ? animate({ from: 1, to: 0, start: 4.4, end: 5, ease: Easing.easeInQuad })(local) : 1;

        return (
          <Frame style={{ background: "transparent" }}>
            <VignettBG />
            <NoiseTexture />
            {/* glowing emblem behind */}
            <div style={{
              position: "absolute",
              width: 600, height: 600, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,168,90,0.18) 0%, transparent 65%)",
              filter: "blur(20px)",
              opacity: markOp * exitOp,
            }} />
            <div style={{
              position: "relative",
              textAlign: "center",
              opacity: exitOp,
            }}>
              <div style={{
                width: 88, height: 88,
                margin: "0 auto 32px",
                border: "1.5px solid #d4a85a",
                display: "grid", placeItems: "center",
                color: "#d4a85a",
                fontFamily: "var(--serif)",
                fontStyle: "italic", fontWeight: 700,
                fontSize: 52,
                opacity: markOp,
                transform: `scale(${markScale})`,
              }}>B</div>
              <div style={{
                opacity: titleOp,
                transform: `translateY(${titleY}px)`,
              }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13, letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "#d4a85a",
                  marginBottom: 18,
                }}>BreakingRanksBooks</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 84, fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  color: "#f4e8d0",
                }}>Plainspoken.<br/>
                  <span style={{ fontStyle: "italic", color: "#d4a85a", fontWeight: 400 }}>Hard-earned.</span>
                </div>
              </div>
              <div style={{
                width: ruleW, height: 1, background: "#d4a85a",
                margin: "32px auto 24px",
                opacity: ruleW > 4 ? 1 : 0,
              }} />
              <div style={{
                opacity: tagOp,
                transform: `translateY(${tagY}px)`,
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 22,
                color: "#d8c89a",
                letterSpacing: "0.04em",
              }}>Books by Wayne A. Ince</div>
            </div>
          </Frame>
        );
      }}
    </Sprite>
  );
}

// === Scene 2: 5-10s · Author ===
function Scene2() {
  return (
    <Sprite start={5} end={10}>
      {() => {
        const t = useTime();
        const local = t - 5;
        const photoOp = animate({ from: 0, to: 1, start: 0.1, end: 0.8, ease: Easing.easeOutQuad })(local);
        const photoX = animate({ from: -40, to: 0, start: 0.1, end: 1, ease: Easing.easeOutCubic })(local);
        const textX = animate({ from: 40, to: 0, start: 0.5, end: 1.4, ease: Easing.easeOutCubic })(local);
        const textOp = animate({ from: 0, to: 1, start: 0.5, end: 1.2, ease: Easing.easeOutQuad })(local);
        const stat1 = animate({ from: 0, to: 1, start: 1.4, end: 2, ease: Easing.easeOutQuad })(local);
        const stat2 = animate({ from: 0, to: 1, start: 1.7, end: 2.3, ease: Easing.easeOutQuad })(local);
        const stat3 = animate({ from: 0, to: 1, start: 2.0, end: 2.6, ease: Easing.easeOutQuad })(local);
        const exitOp = local > 4.4 ? animate({ from: 1, to: 0, start: 4.4, end: 5, ease: Easing.easeInQuad })(local) : 1;

        return (
          <Frame>
            <VignettBG from="#1f1812" to="#0a0604" />
            <NoiseTexture />
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 80,
              alignItems: "center",
              padding: "0 80px",
              width: "100%", height: "100%",
              opacity: exitOp,
              position: "relative", zIndex: 2,
            }}>
              <div style={{
                aspectRatio: "4/5",
                position: "relative",
                opacity: photoOp,
                transform: `translateX(${photoX}px)`,
                maxHeight: 540,
                margin: "0 0 0 auto",
                width: "100%",
              }}>
                <img src="assets/wayne-portrait.jpeg"
                     style={{ width: "100%", height: "100%", objectFit: "cover" }}
                     alt="Wayne Ince" />
                <div style={{ position: "absolute", inset: 14, border: "1px solid #8c6a32" }} />
                <div style={{
                  position: "absolute", bottom: 24, left: 28,
                  fontFamily: "var(--mono)",
                  fontSize: 11, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "#d4a85a",
                }}>
                  <div style={{ width: 30, height: 1, background: "#d4a85a", marginBottom: 8 }} />
                  Wayne A. Ince · "Big Sarge"
                </div>
              </div>
              <div style={{
                opacity: textOp,
                transform: `translateX(${textX}px)`,
              }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12, letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#d4a85a",
                  marginBottom: 18,
                }}>Meet the Author</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 48, fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: "-0.015em",
                  color: "#f4e8d0",
                  marginBottom: 24,
                }}>23 years <span style={{ fontStyle: "italic", color: "#d4a85a", fontWeight: 400 }}>in uniform.</span><br/>One honest voice.</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "#d8c89a",
                  lineHeight: 1.4,
                  marginBottom: 28,
                  paddingLeft: 18,
                  borderLeft: "2px solid #d4a85a",
                }}>Retired Senior Master Sergeant. Combat veteran. Mental health advocate.</div>
                <div style={{ display: "flex", gap: 36 }}>
                  {[
                    { num: "23", label: "Years Service", op: stat1 },
                    { num: "4", label: "Combat Zones", op: stat2 },
                    { num: "3", label: "Books", op: stat3 },
                  ].map((s,i) => (
                    <div key={i} style={{
                      opacity: s.op,
                      transform: `translateY(${(1 - s.op) * 10}px)`,
                    }}>
                      <div style={{
                        fontFamily: "var(--serif)",
                        fontSize: 44, fontWeight: 700,
                        color: "#d4a85a", lineHeight: 1,
                      }}>{s.num}</div>
                      <div style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10, letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#a89878",
                        marginTop: 8,
                      }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Frame>
        );
      }}
    </Sprite>
  );
}

// === Scene 3: 10-15s · The book ===
function Scene3() {
  return (
    <Sprite start={10} end={15}>
      {() => {
        const t = useTime();
        const local = t - 10;
        const bookOp = animate({ from: 0, to: 1, start: 0.1, end: 0.8, ease: Easing.easeOutQuad })(local);
        const bookY = animate({ from: 60, to: 0, start: 0.1, end: 1, ease: Easing.easeOutCubic })(local);
        const bookRot = animate({ from: -22, to: -10, start: 0.1, end: 1.4, ease: Easing.easeOutCubic })(local);
        const titleX = animate({ from: 40, to: 0, start: 0.8, end: 1.6, ease: Easing.easeOutCubic })(local);
        const titleOp = animate({ from: 0, to: 1, start: 0.8, end: 1.5, ease: Easing.easeOutQuad })(local);
        const blurbOp = animate({ from: 0, to: 1, start: 1.6, end: 2.4, ease: Easing.easeOutQuad })(local);
        const stampScale = animate({ from: 0, to: 1, start: 2.4, end: 3.2, ease: Easing.easeOutBack })(local);
        const exitOp = local > 4.4 ? animate({ from: 1, to: 0, start: 4.4, end: 5, ease: Easing.easeInQuad })(local) : 1;

        return (
          <Frame>
            <VignettBG from="#1a2330" to="#06080d" />
            <NoiseTexture />
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 60, alignItems: "center",
              padding: "0 80px",
              width: "100%", height: "100%",
              opacity: exitOp,
              position: "relative", zIndex: 2,
            }}>
              <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
                <div style={{
                  position: "absolute",
                  width: 460, height: 460,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,168,90,0.3) 0%, transparent 70%)",
                  filter: "blur(40px)",
                  opacity: bookOp,
                }} />
                <div style={{
                  width: 320,
                  aspectRatio: "2/3",
                  position: "relative",
                  opacity: bookOp,
                  transform: `perspective(1400px) rotateY(${bookRot}deg) translateY(${bookY}px)`,
                  boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)",
                }}>
                  <img src="assets/cover-well-runs-dry.jpeg"
                       style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                       alt="Until the Well Runs Dry" />
                </div>
                {/* badge */}
                <div style={{
                  position: "absolute",
                  right: 20, top: 60,
                  width: 110, height: 110, borderRadius: "50%",
                  border: "1px solid #d4a85a",
                  background: "rgba(26,18,12,0.92)",
                  backdropFilter: "blur(6px)",
                  color: "#d4a85a",
                  display: "grid", placeItems: "center",
                  textAlign: "center",
                  transform: `scale(${stampScale}) rotate(-10deg)`,
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 12,
                  lineHeight: 1.2,
                }}>
                  <div>
                    <div style={{ fontStyle: "normal", fontWeight: 700, fontSize: 20 }}>★★★★★</div>
                    <div style={{ marginTop: 4 }}>4.9 / 5</div>
                    <div style={{ fontStyle: "normal", fontFamily: "var(--mono)", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>1,200+ readers</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{
                  opacity: titleOp,
                  transform: `translateX(${titleX}px)`,
                }}>
                  <div style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12, letterSpacing: "0.24em",
                    textTransform: "uppercase", color: "#d4a85a",
                    marginBottom: 16,
                  }}>Latest Release · Memoir</div>
                  <div style={{
                    fontFamily: "var(--serif)",
                    fontSize: 60, fontWeight: 800,
                    lineHeight: 0.98,
                    letterSpacing: "-0.02em",
                    color: "#f4e8d0",
                    marginBottom: 18,
                  }}>Until the<br/>Well Runs Dry</div>
                  <div style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 22,
                    color: "#d4a85a",
                    marginBottom: 24,
                  }}>A Veteran's Fight for Mental Health</div>
                </div>
                <div style={{
                  opacity: blurbOp,
                  fontSize: 17,
                  color: "#d8c89a",
                  lineHeight: 1.55,
                  maxWidth: 440,
                }}>
                  A retired Senior Master Sergeant breaks his own silence on delayed-onset PTSD — and writes the field manual he wishes someone had handed him.
                </div>
              </div>
            </div>
          </Frame>
        );
      }}
    </Sprite>
  );
}

// === Scene 4: 15-20s · Three books ===
function Scene4() {
  const books = [
    { title: "Until the Well Runs Dry", sub: "A Veteran's Fight for Mental Health", img: "assets/cover-well-runs-dry.jpeg" },
    { title: "The Unseen March", sub: "A Comprehensive Guide to PTSD Recovery", img: "assets/cover-unseen-march.png" },
    { title: "Sweetwater Reckoning", sub: "A Novel", img: "assets/cover-sweetwater.jpeg" },
  ];
  return (
    <Sprite start={15} end={20}>
      {() => {
        const t = useTime();
        const local = t - 15;
        const headOp = animate({ from: 0, to: 1, start: 0.1, end: 0.8, ease: Easing.easeOutQuad })(local);
        const exitOp = local > 4.4 ? animate({ from: 1, to: 0, start: 4.4, end: 5, ease: Easing.easeInQuad })(local) : 1;

        return (
          <Frame>
            <VignettBG />
            <NoiseTexture />
            <div style={{
              width: "100%", height: "100%",
              padding: "60px 80px",
              display: "flex", flexDirection: "column",
              opacity: exitOp,
              position: "relative", zIndex: 2,
            }}>
              <div style={{ textAlign: "center", marginBottom: 40, opacity: headOp }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12, letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#d4a85a", marginBottom: 14,
                }}>The Library</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 52, fontWeight: 700,
                  lineHeight: 1, letterSpacing: "-0.015em",
                  color: "#f4e8d0",
                }}>Three books. <span style={{ fontStyle: "italic", color: "#d4a85a", fontWeight: 400 }}>One voice.</span></div>
              </div>
              <div style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 40,
                alignItems: "center",
                justifyItems: "center",
              }}>
                {books.map((b, i) => {
                  const startT = 0.6 + i * 0.25;
                  const op = animate({ from: 0, to: 1, start: startT, end: startT + 0.7, ease: Easing.easeOutQuad })(local);
                  const y = animate({ from: 40, to: 0, start: startT, end: startT + 0.8, ease: Easing.easeOutCubic })(local);
                  return (
                    <div key={i} style={{
                      width: "100%", maxWidth: 220,
                      opacity: op,
                      transform: `translateY(${y}px)`,
                    }}>
                      <div style={{
                        aspectRatio: "2/3",
                        boxShadow: "0 20px 50px -10px rgba(0,0,0,0.7)",
                        border: "1px solid #5a4a32",
                        position: "relative",
                        overflow: "hidden",
                      }}>
                        {b.img ? (
                          <img src={b.img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt={b.title} />
                        ) : (
                          <div style={{
                            background: b.color.bg,
                            color: b.color.fg,
                            width: "100%", height: "100%",
                            padding: "26px 22px",
                            display: "flex", flexDirection: "column", justifyContent: "space-between",
                          }}>
                            <div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: b.color.accent, fontWeight: 600 }}>Wayne A. Ince</div>
                              <div style={{ width: "30%", height: 2, background: b.color.accent, marginTop: 10 }} />
                            </div>
                            <div>
                              <div style={{ fontFamily: "var(--serif)", fontWeight: 800, fontStyle: "italic", textTransform: "uppercase", fontSize: 26, lineHeight: 0.95, letterSpacing: "-0.01em" }}>{b.title}</div>
                              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11, marginTop: 12, opacity: 0.75 }}>{b.sub}</div>
                            </div>
                            <div style={{ width: "30%", height: 2, background: b.color.accent, alignSelf: "flex-end" }} />
                          </div>
                        )}
                      </div>
                      <div style={{
                        marginTop: 14,
                        fontFamily: "var(--serif)",
                        fontSize: 17, fontWeight: 700,
                        color: "#f4e8d0",
                        textAlign: "center",
                        lineHeight: 1.15,
                      }}>{b.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Frame>
        );
      }}
    </Sprite>
  );
}

// === Scene 5: 20-25s · Buy on Amazon + Substack ===
function Scene5() {
  return (
    <Sprite start={20} end={25}>
      {() => {
        const t = useTime();
        const local = t - 20;
        const titleOp = animate({ from: 0, to: 1, start: 0.1, end: 0.8, ease: Easing.easeOutQuad })(local);
        const titleY = animate({ from: 30, to: 0, start: 0.1, end: 1, ease: Easing.easeOutCubic })(local);
        const ctaOp = animate({ from: 0, to: 1, start: 0.9, end: 1.6, ease: Easing.easeOutQuad })(local);
        const ctaScale = animate({ from: 0.9, to: 1, start: 0.9, end: 1.6, ease: Easing.easeOutBack })(local);
        const arrowX = animate({ from: -10, to: 6, start: 1.5, end: 4.4, ease: Easing.easeInOutSine })(local);
        const subOp = animate({ from: 0, to: 1, start: 1.8, end: 2.6, ease: Easing.easeOutQuad })(local);
        const exitOp = local > 4.4 ? animate({ from: 1, to: 0, start: 4.4, end: 5, ease: Easing.easeInQuad })(local) : 1;

        return (
          <Frame>
            <VignettBG from="#3a2618" to="#0a0604" />
            <NoiseTexture />
            <div style={{
              textAlign: "center",
              padding: "0 80px",
              opacity: exitOp,
              position: "relative", zIndex: 2,
            }}>
              <div style={{
                opacity: titleOp,
                transform: `translateY(${titleY}px)`,
              }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13, letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "#d4a85a", marginBottom: 24,
                }}>Available Now</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 76, fontWeight: 700,
                  lineHeight: 0.98,
                  letterSpacing: "-0.02em",
                  color: "#f4e8d0",
                  marginBottom: 40,
                }}>All three books<br/><span style={{ fontStyle: "italic", color: "#d4a85a", fontWeight: 400 }}>on Amazon.</span></div>
              </div>

              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 18,
                background: "#d4a85a",
                color: "#2a1f14",
                padding: "22px 38px",
                fontFamily: "var(--sans)",
                fontSize: 18, fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: ctaOp,
                transform: `scale(${ctaScale})`,
                boxShadow: "0 20px 50px -10px rgba(212,168,90,0.4)",
              }}>
                Buy on Amazon
                <span style={{ display: "inline-block", transform: `translateX(${arrowX}px)` }}>→</span>
              </div>

              <div style={{
                marginTop: 50,
                opacity: subOp,
                fontFamily: "var(--mono)",
                fontSize: 13, letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#d8c89a",
              }}>
                Read more from Wayne →
                <span style={{
                  color: "#d4a85a",
                  fontFamily: "var(--mono)",
                  marginLeft: 12,
                  borderBottom: "1px solid #d4a85a",
                  paddingBottom: 2,
                }}>wayneaince.substack.com</span>
              </div>
              <div style={{
                marginTop: 18,
                opacity: subOp,
                fontFamily: "var(--mono)",
                fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#a89878",
              }}>
                breakingranksbooks.com
              </div>
            </div>
          </Frame>
        );
      }}
    </Sprite>
  );
}

// === Scene 6: 25-30s · Share + crisis disclaimer ===
function Scene6() {
  return (
    <Sprite start={25} end={30}>
      {() => {
        const t = useTime();
        const local = t - 25;
        const shareOp = animate({ from: 0, to: 1, start: 0.1, end: 0.8, ease: Easing.easeOutQuad })(local);
        const shareY = animate({ from: 20, to: 0, start: 0.1, end: 0.9, ease: Easing.easeOutCubic })(local);
        const ruleW = animate({ from: 0, to: 360, start: 1.2, end: 2.0, ease: Easing.easeInOutQuart })(local);
        const discOp = animate({ from: 0, to: 1, start: 2.0, end: 2.8, ease: Easing.easeOutQuad })(local);
        const phoneOp = animate({ from: 0, to: 1, start: 2.6, end: 3.4, ease: Easing.easeOutQuad })(local);
        const phonePulse = 1 + Math.sin(local * 4) * 0.04;
        const sigOp = animate({ from: 0, to: 1, start: 3.6, end: 4.4, ease: Easing.easeOutQuad })(local);

        return (
          <Frame>
            <VignettBG from="#1f1812" to="#06040a" />
            <NoiseTexture />
            <div style={{
              width: "100%", height: "100%",
              padding: "60px 80px",
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
              position: "relative", zIndex: 2,
            }}>
              {/* Top: share message */}
              <div style={{
                textAlign: "center",
                opacity: shareOp,
                transform: `translateY(${shareY}px)`,
              }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12, letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#d4a85a", marginBottom: 16,
                }}>One More Thing</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 56, fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.015em",
                  color: "#f4e8d0",
                }}>Send it to someone <span style={{ fontStyle: "italic", color: "#d4a85a", fontWeight: 400 }}>who needs it.</span></div>
                <div style={{
                  marginTop: 18,
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 19,
                  color: "#d8c89a",
                }}>A brother. A buddy. A son. A friend who's been quiet too long.</div>
              </div>

              {/* Middle: rule */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: ruleW, height: 1, background: "#d4a85a",
                  margin: "0 auto",
                  opacity: ruleW > 4 ? 1 : 0,
                }} />
              </div>

              {/* Bottom: disclaimer */}
              <div style={{
                opacity: discOp,
                border: "1px solid #5a4a32",
                background: "rgba(26,18,12,0.6)",
                padding: "24px 32px",
                textAlign: "center",
                maxWidth: 880,
                margin: "0 auto",
              }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10, letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#c45a2a",
                  marginBottom: 12,
                  fontWeight: 600,
                }}>Important Notice</div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: "#f4e8d0",
                }}>
                  These books are not medical advice. If you or someone you love is in crisis,
                  call or text <span style={{
                    color: "#d4a85a",
                    fontWeight: 700,
                    fontFamily: "var(--sans)",
                    fontSize: 18,
                    opacity: phoneOp,
                    display: "inline-block",
                    transform: `scale(${phonePulse})`,
                    letterSpacing: "0.06em",
                  }}>988</span> (Suicide & Crisis Lifeline) or go to your nearest emergency room.
                </div>
              </div>

              {/* Signature */}
              <div style={{
                textAlign: "center",
                opacity: sigOp,
              }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 14,
                }}>
                  <div style={{
                    width: 42, height: 42,
                    border: "1px solid #d4a85a",
                    display: "grid", placeItems: "center",
                    color: "#d4a85a",
                    fontFamily: "var(--serif)",
                    fontStyle: "italic", fontWeight: 700,
                    fontSize: 22,
                  }}>B</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{
                      fontFamily: "var(--serif)",
                      fontSize: 18, fontWeight: 700,
                      color: "#f4e8d0", letterSpacing: "0.01em",
                    }}>BreakingRanksBooks</div>
                    <div style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10, letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#a89878", marginTop: 2,
                    }}>Books by Wayne A. Ince</div>
                  </div>
                </div>
              </div>
            </div>
          </Frame>
        );
      }}
    </Sprite>
  );
}

// === Progress strip overlay ===
function ProgressStrip() {
  const t = useTime();
  const { duration } = useTimeline();
  const pct = (t / duration) * 100;
  return (
    <div style={{
      position: "absolute",
      left: 0, right: 0, bottom: 0,
      height: 3,
      background: "rgba(212,168,90,0.15)",
      zIndex: 20,
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: "#d4a85a",
        transition: "width 80ms linear",
      }} />
    </div>
  );
}

// Mini brand watermark
function Watermark() {
  const t = useTime();
  if (t < 5 || t > 29) return null;
  return (
    <div style={{
      position: "absolute",
      top: 24, right: 32,
      fontFamily: "var(--mono)",
      fontSize: 10, letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: "#d4a85a",
      opacity: 0.7,
      zIndex: 15,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 14, height: 1, background: "#d4a85a" }} />
      breakingranksbooks
    </div>
  );
}

// === Audio sync ===
// The very first time the timeline starts playing, the user has clicked
// Stage's play button — that click counts as a gesture, so we can play()
// audio in the same React tick. After that, we keep audio.paused mirrored
// to !timeline.playing and resync currentTime when drift exceeds 0.3s.
function VoiceoverAudio({ src }) {
  const { time, playing } = useTimeline();
  const ref = React.useRef(null);
  const everPlayedRef = React.useRef(false);
  const [audioBlocked, setAudioBlocked] = React.useState(false);

  // Sync paused/playing — also handles first-play unlock
  React.useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      // Match currentTime before playing to avoid sync drift on first play
      const target = Math.min(time, a.duration || time);
      if (Math.abs(a.currentTime - target) > 0.3) {
        try { a.currentTime = target; } catch {}
      }
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          everPlayedRef.current = true;
          setAudioBlocked(false);
        }).catch(() => {
          if (!everPlayedRef.current) setAudioBlocked(true);
        });
      } else {
        everPlayedRef.current = true;
      }
    } else if (!a.paused) {
      a.pause();
    }
  }, [playing]);

  // Sync currentTime when drift exceeds threshold (scrubbing, loop reset)
  React.useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const target = Math.min(time, a.duration || time);
    if (Math.abs(a.currentTime - target) > 0.3) {
      try { a.currentTime = target; } catch {}
    }
  }, [time]);

  const manualUnlock = () => {
    const a = ref.current;
    if (!a) return;
    a.muted = false;
    a.play().then(() => {
      everPlayedRef.current = true;
      setAudioBlocked(false);
    }).catch(() => {});
  };

  return (
    <>
      <audio ref={ref} src={src} preload="auto" style={{ display: "none" }} />
      {audioBlocked && (
        <button
          onClick={manualUnlock}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            zIndex: 50,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "rgba(10,6,4,0.85)",
            border: "1px solid rgba(212,168,90,0.5)",
            color: "#f4e8d0",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            borderRadius: 999,
            cursor: "pointer",
            backdropFilter: "blur(6px)",
            boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
          }}
          title="Browser blocked audio. Click to enable Wayne's narration."
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
            <path d="M19 5a9 9 0 0 1 0 14"/>
          </svg>
          Tap to enable sound
        </button>
      )}
    </>
  );
}

Object.assign(window, {
  Scene1, Scene2, Scene3, Scene4, Scene5, Scene6,
  ProgressStrip, Watermark, Frame, VoiceoverAudio,
});

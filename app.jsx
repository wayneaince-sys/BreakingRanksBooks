// App entry — BreakingRanksBooks
const { useState, useEffect } = React;

function App() {
  const defaults = JSON.parse(
    document.getElementById("tweak-defaults").textContent
      .replace(/\/\*EDITMODE-(BEGIN|END)\*\//g, "")
  );
  const [tweaks, setTweak] = useTweaks(defaults);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const featured = window.BOOKS[tweaks.featuredIndex] || window.BOOKS[0];

  return (
    <>
      <Nav />
      <Hero book={featured} />
      <Marquee />
      <VideoSection />
      <BooksGrid />
      <About />
      <Reviews />
      <Press />
      <Newsletter />
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Color theme">
          <TweakRadio
            value={tweaks.theme}
            onChange={v => setTweak("theme", v)}
            options={[
              { value: "warm", label: "Warm Tan" },
              { value: "noir", label: "Noir" },
              { value: "forest", label: "Forest" },
              { value: "cream", label: "Cream" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Featured book on hero">
          <TweakSelect
            value={tweaks.featuredIndex}
            onChange={v => setTweak("featuredIndex", parseInt(v, 10))}
            options={window.BOOKS.map((b, i) => ({ value: i, label: b.title }))}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

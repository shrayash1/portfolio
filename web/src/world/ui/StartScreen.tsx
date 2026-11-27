export function StartScreen({ onPlay, onSelect }: { onPlay: () => void; onSelect: () => void }) {
  return (
    <main className="screen start">
      <p className="label">A playable story</p>
      <h1 className="big">The Journey</h1>
      <p className="dv">यात्रा · a playable story by Shrayash Pradhan</p>
      <nav className="menu" aria-label="Main menu">
        <button type="button" className="btn primary" onClick={onPlay} autoFocus>▶ Play the story</button>
        <button type="button" className="btn" onClick={onSelect}>Chapter select</button>
        <a className="btn" href="portfolio.html#work">Jump to the games →</a>
      </nav>
    </main>
  );
}

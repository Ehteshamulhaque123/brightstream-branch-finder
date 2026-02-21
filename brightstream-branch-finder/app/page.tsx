

export default function Home() {
  return (
    <main>
      <section className="bs-hero">
        <h1>Banking Reimagined</h1>
        <p>
          Experience financial excellence crafted for the way you live, work, and dream.
          Find a Brightstream branch near you in seconds.
        </p>

        <div className="bs-actions">
          <a className="bs-btn bs-btn--primary" href="/branches">Find a Branch</a>
          <button className="bs-btn bs-btn--outline">Explore Services</button>
        </div>
      </section>
    </main>
  );
}

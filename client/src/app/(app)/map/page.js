const Dot = ({ c }) => <span className="dot" style={{ background: c }} />;

export default function MapPage() {
  return (
    <>
      <h3>Live flood map</h3>
      <p>Only authority-verified information is shown.</p>
      <p><Dot c="#e5645a" />Verified report<Dot c="#4caf7d" />Open center<Dot c="#e6b84a" />Full<Dot c="#888" />Closed</p>
    </>
  );
}

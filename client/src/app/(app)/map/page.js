const Dot = ({ c }) => <span className="dot" style={{ background: c }} />;

export default function MapPage() {
  return (
    <>
      <h3>Live flood map</h3>
      <p>Only authority-verified information is shown.</p>
      <p><Dot c="#0073CF" />Verified report<Dot c="#48C9B0" />Open center<Dot c="#F39C12" />Full<Dot c="#9AA9B2" />Closed</p>
      <p className="m">Flood zones by depth risk:<br /><Dot c="#7FB8E3" />Low<Dot c="#0073CF" />Medium<Dot c="#F39C12" />High</p>
    </>
  );
}

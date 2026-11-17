export default function Logo({ size = 1 }) {
  return (
    <span className="logo" style={{ fontSize: 22 * size }}>
      <svg width={28 * size} height={34 * size} viewBox="0 0 36 44" aria-hidden="true">
        <path d="M18 30C4 18 4 2 18 2s14 16 0 28z" fill="currentColor" />
        <circle cx="18" cy="14" r="5" fill="#fff" />
        <path d="M2 36q4-5 8 0t8 0 8 0 8 0" stroke="#0073CF" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M2 42q4-5 8 0t8 0 8 0 8 0" stroke="#48C9B0" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span>Flood<b>Safe</b></span>
    </span>
  );
}

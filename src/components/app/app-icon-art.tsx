// Abstract mark: a glass seen from above, half filled with wine.
// Rendered by next/og, so only flexbox and inline styles.
export function AppIconArt({ size }: { size: number }) {
  const ring = Math.round(size * 0.56);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#140b10",
      }}
    >
      <div
        style={{
          width: ring,
          height: ring,
          borderRadius: "50%",
          border: `${Math.max(2, Math.round(size * 0.035))}px solid #d1ad72`,
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", height: "52%", background: "#8c2547" }} />
      </div>
    </div>
  );
}

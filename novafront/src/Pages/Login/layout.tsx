import React from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, #232136 0%, #181622 100%)`,
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: 340 }}>
        {children}
      </div>
    </div>
  );
}

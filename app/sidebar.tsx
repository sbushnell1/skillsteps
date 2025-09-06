"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function Icon({ name }: { name: "learn" | "test" | "track" | "settings" }) {
  if (name === "learn")
    return (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M20 22V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5v13" />
      </svg>
    );
  if (name === "test")
    return (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  if (name === "track")
    return (
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 3v18h18" />
        <path d="M7 13l3 3 7-7" />
      </svg>
    );
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      <path d="M2 12h2m16 0h2M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" />
    </svg>
  );
}

export default function Sidebar() {
  const [min, setMin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("ss.sidebar.min") === "1";
    setMin(saved);
  }, []);

  const toggle = () => {
    const next = !min;
    setMin(next);
    localStorage.setItem("ss.sidebar.min", next ? "1" : "0");
  };

  function Item({
    href,
    label,
    icon,
  }: {
    href: string;
    label: string;
    icon: "learn" | "test" | "track" | "settings";
  }) {
    const isActive = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`nav-item ${isActive ? "ss-active" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 12,
          textDecoration: "none",
          color: "#fff",
        }}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon name={icon} />
        {!min && <span style={{ fontWeight: 700 }}>{label}</span>}
      </Link>
    );
  }

  return (
    <aside className={`sidebar ${min ? "min" : ""}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: min ? "center" : "space-between",
        }}
      >
        {!min && <div className="title">Menu</div>}
        <button className="toggle" onClick={toggle} aria-label="Toggle sidebar">
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="#fff" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="nav" style={{ marginTop: 12 }}>
        <Item href="/learn" label="Learn" icon="learn" />
        <Item href="/test" label="Test" icon="test" />
        <Item href="/track" label="Track" icon="track" />
        <Item href="/settings" label="Settings" icon="settings" />
      </nav>
    </aside>
  );
}

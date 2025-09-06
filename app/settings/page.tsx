// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AGES, DEFAULT_AGE } from "@/data/ages";

export default function SettingsPage() {
  const router = useRouter();
  const [age, setAge] = useState<number>(DEFAULT_AGE);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const mAge = document.cookie.match(/(?:^|; )ss\.age=(\d+)/);
    const mName = document.cookie.match(/(?:^|; )ss\.name=([^;]+)/);
    if (mAge) setAge(Number(mAge[1]));
    if (mName) setName(decodeURIComponent(mName[1]));
  }, []);

  function saveAll() {
    document.cookie = `ss.age=${age}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.cookie = `ss.name=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh(); // next visit to /learn will reflect immediately
  }

  return (
    <div>
      <h1 className="h1">Settings</h1>
      <p className="sub">These personalise the subjects and greeting.</p>

      <label className="sub" htmlFor="name" style={{ display: "block", marginTop: 12 }}>Name</label>
      <input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Marie"
        style={{ padding: 10, borderRadius: 10, marginTop: 6, width: 280 }}
      />

      <label className="sub" htmlFor="age" style={{ display: "block", marginTop: 16 }}>Age</label>
      <select
        id="age"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
        style={{ padding: 10, borderRadius: 10, marginTop: 6, width: 120 }}
      >
        {AGES.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      <div style={{ marginTop: 16 }}>
        <button className="toggle" onClick={saveAll}>Save</button>
      </div>
    </div>
  );
}

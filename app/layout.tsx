// app/layout.tsx
import "./globals.css";
import Sidebar from "./sidebar";

export const metadata = {
  title: "SkillSteps",
  description: "Learning MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="brandBar">SkillSteps</div>
        <div className="shell">
          <Sidebar />
          <main className="main">{children}</main> {/* <-- critical */}
        </div>
      </body>
    </html>
  );
}

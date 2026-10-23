import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "Beacon — release attestation", description: "Release attestation console" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

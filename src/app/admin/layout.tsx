export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin pages use their own layout without public Navbar/Footer
  // The root layout wraps everything, so we just pass children through
  // Admin pages handle their own navigation
  return <>{children}</>;
}

export default function Notice({ children, type = "info" }: { children: React.ReactNode; type?: "info"|"success"|"error" }) {
  return <div className={`notice notice-${type}`}>{children}</div>;
}

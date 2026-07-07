import Sidebar from "@/components/dashboard/Sidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="w-64 hidden md:block border-r-brutal border-r-3 border-brutal-black">
        <Sidebar />
      </aside>
      {/* Main content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

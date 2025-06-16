import SideBar from "@/pages/layout/Sidebar";
import Header from "@/pages/layout/Header";
import { MobileTabs } from "@/components/MobileTabs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:grid md:grid-cols-[260px_1fr] h-screen w-full">
      {/* Sidebar hidden on mobile, visible on md and up */}
      <div className="hidden md:block">
        <SideBar />
      </div>
      
      <div className="grid grid-rows-[64px_1fr] h-full w-full">
        <Header />
        <main className="p-6 overflow-auto pb-20 md:pb-6"> {/* Add padding at bottom for mobile tabs */}
          {children}
        </main>
      </div>
      
      {/* Mobile tabs - only visible on small screens */}
      <MobileTabs />  
    </div>
  );
}

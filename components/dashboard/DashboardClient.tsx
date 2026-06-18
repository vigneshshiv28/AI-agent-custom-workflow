"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from '@tanstack/react-query';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { EmptyState } from '@/components/workflow/EmptyState';
import { Sidebar } from '@/components/workflow/Sidebar';
import { WorkflowListResponse } from "@/shared/contracts/workflow.contract";
import { toast } from "sonner"
import { createWorkflow } from "@/lib/api/workflow";
import ApiError from "@/lib/errors/api-errors";
import { getDashboardSummary } from "@/lib/api/dashboard";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

type DashBoardClientProps = {
  initialWorkflows: WorkflowListResponse[];
}

export const DashboardClient = ({ initialWorkflows }: DashBoardClientProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { data: session } = authClient.useSession();

  const { data: workflows = initialWorkflows } = useQuery<WorkflowListResponse[]>({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
    initialData: initialWorkflows,
    refetchOnWindowFocus: false,
  });

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scheduled = filteredWorkflows.filter(w => w.Schedules?.some(s => s.status === 'ACTIVE'));
  const recent = filteredWorkflows.filter(w => w.Executions && w.Executions.length > 0 && !w.Schedules?.some(s => s.status === 'ACTIVE'));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateNewWorkflow = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const draft = await createWorkflow();
      router.push(`/workflow/${draft.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create workflow');
      setIsCreating(false);
    }
  };

  const handleOpenCanvas = (id: string) => {
    router.push(`/workflow/${id}`);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased flex flex-col selection:bg-[#F49ACB]/30 overflow-hidden">
      
      {/* Header - Height 56px */}
      <header className="h-[56px] bg-[#111113] border-b border-[#26262B] flex items-center justify-between px-[32px] shrink-0 z-30">
        <div className="flex flex-1 items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <input
            type="text"
            className="w-[320px] bg-[#161618] border border-[#26262B] text-[13px] font-mono text-[#FAFAFA] placeholder:text-[#71717A] px-4 py-2 rounded-[6px] focus:outline-none focus:border-[#F49ACB] transition-colors"
            placeholder="SEARCH WORKFLOWS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleCreateNewWorkflow}
            disabled={isCreating}
            className="h-[36px] px-4 bg-[#F49ACB] text-[#09090B] text-[13px] font-mono uppercase tracking-wide font-semibold rounded-[6px] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Workflow'}
          </button>
          
          <div className="relative" ref={profileMenuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`w-8 h-8 rounded-full bg-[#161618] border overflow-hidden cursor-pointer focus:outline-none transition-colors ${isProfileMenuOpen ? 'border-[#F49ACB]' : 'border-[#26262B] hover:border-[#404046]'}`}
            >
              {session?.user?.image ? (
                <img className="w-full h-full object-cover" src={session.user.image} alt={session.user.name || "Profile"} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#161618] text-[#FAFAFA] text-xs font-medium">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#161618] border border-[#26262B] py-1 z-50">
                <div className="px-4 py-2 border-b border-[#26262B] mb-1">
                  <p className="text-[13px] font-medium text-[#FAFAFA] truncate">{session?.user?.name || "User"}</p>
                  <p className="text-[11px] text-[#A1A1AA] truncate">{session?.user?.email || ""}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[13px] font-mono uppercase tracking-wide text-[#F87171] hover:bg-[#1C1C1F] transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Collapsible Sidebar */}
        <div 
          className={`shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-[220px]' : 'w-0'}`}
        >
          <div className="w-[220px] h-full">
            <Sidebar />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] w-full mx-auto px-[32px] py-[32px] flex flex-col gap-[32px]">
            
            {filteredWorkflows.length === 0 ? (
              <EmptyState onCreate={handleCreateNewWorkflow} />
            ) : (
              <div className="flex flex-col gap-[32px]">
                
                {/* Recent Section */}
                {recent.length > 0 && (
                  <section className="flex flex-col gap-[24px]">
                    <h2 className="text-[18px] font-mono uppercase tracking-widest font-semibold text-[#FAFAFA]">Recent</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[16px]">
                      {recent.map((workflow) => (
                        <WorkflowCard key={workflow.id} workflow={workflow} onRun={() => {}} onEdit={handleOpenCanvas} onDelete={() => {}} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Scheduled Workflows Section */}
                {scheduled.length > 0 && (
                  <section className="flex flex-col gap-[24px]">
                    <h2 className="text-[18px] font-mono uppercase tracking-widest font-semibold text-[#FAFAFA]">Scheduled</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[16px]">
                      {scheduled.map((workflow) => (
                        <WorkflowCard key={workflow.id} workflow={workflow} onRun={() => {}} onEdit={handleOpenCanvas} onDelete={() => {}} />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Workflows Section */}
                <section className="flex flex-col gap-[24px]">
                  <h2 className="text-[18px] font-mono uppercase tracking-widest font-semibold text-[#FAFAFA]">All Workflows</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[16px]">
                    {filteredWorkflows.map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} onRun={() => {}} onEdit={handleOpenCanvas} onDelete={() => {}} />
                    ))}
                  </div>
                </section>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

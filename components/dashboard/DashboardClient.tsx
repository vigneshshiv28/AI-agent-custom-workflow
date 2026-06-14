"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Bell,
  LayoutGrid,
  Plus,
  Sparkles,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/workflow/Button';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { EmptyState } from '@/components/workflow/EmptyState';
import { CreateWorkflowModal } from '@/components/workflow/CreateWorkflowModal';
import { Sidebar } from '@/components/workflow/Sidebar';
import { WorkflowListResponse, DashboardMetricsResponse } from "@/shared/contracts/workflow.contract";
import { toast } from "sonner"
import { Metric } from '@/types/components';
import { MetricsStrip } from "./MetricsStrip";
import { createWorkflow } from "@/lib/api/workflow";
import ApiError from "@/lib/errors/api-errors";
import { getDashboardMetrics, getDashboardSummary } from "@/lib/api/dashboard";



type DashBoardClientProps = {
  initialWorkflows: WorkflowListResponse[];
  initialMetrics: DashboardMetricsResponse;
}

export const DashboardClient = ({ initialWorkflows, initialMetrics }: DashBoardClientProps) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();


  const { data: metrics = initialMetrics } = useQuery<DashboardMetricsResponse>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: getDashboardMetrics,
    initialData: initialMetrics,
    refetchOnWindowFocus: false,
  });

  const { data: workflows = initialWorkflows } = useQuery<WorkflowListResponse[]>({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
    initialData: initialWorkflows,
    refetchOnWindowFocus: false,
  });

  const MOCK_METRICS: Metric[] = [
    { label: 'Runs Today', value: metrics.recentExecutionsCount.toString(), status: 'neutral', icon: <Activity /> },
    { label: 'Success Rate', value: `${metrics.successRate}%`, status: 'positive', icon: <CheckCircle /> },
    { label: 'Active Workflows', value: metrics.totalWorkflows.toString(), status: 'neutral', icon: <LayoutGrid /> },
    { label: 'Needs Attention', value: metrics.failedExecutionsCount.toString(), status: 'warning', icon: <AlertTriangle /> },
  ];

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const handleWorkflowDelete = () => console.log("delete");
  const handleAction = (id: string) => console.log('Action on:', id);

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

  const handleOpenCanvas = (workflow: WorkflowListResponse) => {
    router.push(`/workflow/${workflow.id}`);
  };

  const renderRecentExecutions = () => {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-6 flex items-center justify-between tracking-tight text-foreground">
          Recent Executions
        </h3>
        <div className="space-y-4">
          {metrics.recentExecutionsFeed.map(exec => (
            <div key={exec.id} className="flex justify-between items-start pt-4 border-t border-border/50 first:border-0 first:pt-0">
              <div>
                <div className="font-medium text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-xs">{exec.workflow.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 opacity-80">
                  <Clock className="w-3 h-3" />
                  {(() => { const d = new Date(exec.startedAt); return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString()}`; })()}
                </div>
              </div>
              <div className={`text-[10px] px-2 py-1 rounded-md font-semibold border uppercase tracking-wider ${exec.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                exec.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                {exec.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20">

      <nav className="sticky top-0 z-30 bg-card border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/20">
                AI
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">Workflow Studio</span>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-12">
              <div className="max-w-md w-full relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-2 bg-secondary border border-transparent rounded-full leading-5 placeholder-muted-foreground focus:outline-none focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm transition-all"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>


            <div className="flex items-center gap-5">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
              </button>

              <div className="h-6 w-px bg-border mx-1"></div>

              <Button onClick={() => setIsModalOpen(true)} className="hidden sm:flex shadow-none" variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </Button>

              <Button
                onClick={handleCreateNewWorkflow}
                className="hidden sm:flex shadow-none"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </>
                )}
              </Button>

              <div className="ml-2 cursor-pointer">
                <img
                  className="h-9 w-9 rounded-full border border-border hover:border-primary transition-colors"
                  src="https://picsum.photos/100/100"
                  alt="User"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex max-w-[90rem] mx-auto relative">

        <div className={`
          fixed lg:sticky top-20 z-40 h-[calc(100vh-5rem)] transition-transform duration-300 w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-background lg:bg-transparent
        `}>
          <Sidebar />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}


        <main className="flex-1 px-6 lg:px-12 py-12 min-w-0">

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Your Workflows</h1>
            <p className="mt-3 text-lg text-muted-foreground">Manage and track your active automations.</p>
          </div>

          <MetricsStrip metrics={MOCK_METRICS} />

          <div className="flex flex-col lg:flex-row gap-12">

            <div className="flex-1 min-w-0">

              <div className="mb-6 flex justify-between items-end border-b border-border pb-4">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">All Workflows</h2>
                <span className="text-sm font-medium text-muted-foreground">{filteredWorkflows.length} active</span>
              </div>

              {filteredWorkflows.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {filteredWorkflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      onRun={handleAction}
                      onEdit={() => handleOpenCanvas(workflow)}
                      onDelete={handleWorkflowDelete}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState onCreate={() => setIsModalOpen(true)} />
              )}
            </div>
            <div className="w-full lg:w-80 shrink-0">
              {renderRecentExecutions()}
            </div>

          </div>
        </main>
      </div>

      <CreateWorkflowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => { }}
      />
    </div>
  );
};

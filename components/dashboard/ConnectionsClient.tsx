"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/workflow/Sidebar';
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { IntegrationResponse } from '@/shared/contracts/integration.contract';
import { getIntegrations, connectIntegration, disconnectIntegration } from '@/lib/api/integrations';
import { IntegrationIcon } from '@/components/icons/integration-icons';


export const ConnectionsClient = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [integrationToDisconnect, setIntegrationToDisconnect] = useState<IntegrationResponse | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { data: session } = authClient.useSession();

  const { data: integrations = [], isLoading } = useQuery<IntegrationResponse[]>({
    queryKey: ['dashboard', 'integrations'],
    queryFn: getIntegrations,
    refetchOnWindowFocus: false,
  });

  const filteredIntegrations = integrations.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const connectedParam = searchParams.get('connected');

    if (errorParam) {
      toast.error(`Connection failed: ${errorParam.replace(/_/g, ' ')}`);
      router.replace('/dashboard/connections');
    } else if (connectedParam) {
      toast.success(`${connectedParam.charAt(0).toUpperCase() + connectedParam.slice(1)} connected successfully!`);
      router.replace('/dashboard/connections');
    }
  }, [searchParams, router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  const handleConnect = async (provider: string, oauthProvider: string) => {
    try {
      setConnecting(provider);
      const { url } = await connectIntegration(oauthProvider, provider);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to connect", error);
      setConnecting(null);
    }
  };

  const handleDisconnectClick = (integration: IntegrationResponse) => {
    setIntegrationToDisconnect(integration);
  };

  const confirmDisconnect = async () => {
    if (!integrationToDisconnect) return;
    const provider = integrationToDisconnect.provider;

    try {
      setDisconnecting(provider);
      await disconnectIntegration(provider);
      toast.success("Integration disconnected successfully");
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'integrations'] });
    } catch (error) {
      console.error("Failed to disconnect", error);
      toast.error("Failed to disconnect integration");
    } finally {
      setDisconnecting(null);
      setIntegrationToDisconnect(null);
    }
  };

  return (
    <div className="h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased flex flex-col selection:bg-[#F49ACB]/30 overflow-hidden">

      {/* Header */}
      <header className="h-[56px] bg-[#111113] border-b border-[#26262B] flex items-center justify-between px-[32px] shrink-0 z-30">
        <div className="flex flex-1 items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex items-center gap-6">
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
              <div className="absolute right-0 mt-2 w-48 bg-[#161618] border border-[#26262B] py-1 z-50 animate-in fade-in zoom-in-[0.97] duration-150 ease-out origin-top-right">
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
        <div className={`shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-[220px]' : 'w-0'}`}>
          <div className="w-[220px] h-full">
            <Sidebar />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto relative flex animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
          <div className="flex-1 max-w-[1440px] w-full mx-auto px-[32px] py-[32px] flex flex-col gap-[28px]">

            {/* Page Header */}
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[22px] font-medium text-[#FAFAFA] tracking-tight">Apps</h1>
              <p className="text-[#71717A] text-[13px]">Connect services used by your workflows.</p>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-[280px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="w-full bg-[#161618] border border-[#26262B] text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] pl-9 pr-4 py-[7px] rounded-none focus:outline-none focus:border-[#404046] transition-colors"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[#161618] border border-[#26262B] rounded-none p-4 h-[140px] animate-pulse" />
                ))}
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <div className="text-[#71717A] text-[13px]">No connections found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredIntegrations.map((integration, idx) => (
                  <div
                    key={integration.provider}
                    className="bg-[#161618] border border-[#26262B] rounded-none p-4 hover:border-[#404046] transition-colors flex flex-col gap-3 group"
                    style={{
                      animationDelay: `${idx * 40}ms`,
                      animationFillMode: 'backwards',
                    }}
                  >
                    {/* Card header: icon + name + badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-none bg-[#111113] border border-[#26262B] flex items-center justify-center shrink-0">
                          <IntegrationIcon provider={integration.provider} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-[#FAFAFA] leading-snug">{integration.name}</span>
                          <span className="text-[11px] font-mono text-white/80 bg-white/10 px-1.5 py-0.5 rounded-none w-fit mt-0.5">
                            {integration.authType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description / account email */}
                    <p className="text-[12px] text-[#71717A] leading-relaxed line-clamp-2">
                      {integration.status === 'CONNECTED' && integration.accountEmail
                        ? <>Email: <span className="text-[#A1A1AA]">{integration.accountEmail}</span></>
                        : integration.description
                      }
                    </p>

                    {/* Action button */}
                    <div className="mt-auto pt-1">
                      {integration.status === 'CONNECTED' ? (
                        <button
                          onClick={e => { e.stopPropagation(); handleDisconnectClick(integration); }}
                          disabled={disconnecting === integration.provider}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] border border-[#26262B] rounded-none text-[12px] font-mono text-[#F87171] hover:border-[#F87171]/30 hover:bg-[#1C1C1F] active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                        >
                          {disconnecting === integration.provider ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      ) : (
                        <button
                          onClick={e => { handleConnect(integration.provider, integration.oauthProvider); }}
                          disabled={connecting === integration.provider}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F49ACB] rounded-none text-[12px] font-mono font-semibold text-[#09090B] hover:bg-[#e879b0] active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
                        >
                          {connecting === integration.provider ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Disconnect Confirmation Modal */}
      {integrationToDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[400px] bg-[#111113] border border-[#26262B] rounded-none flex flex-col overflow-hidden animate-in zoom-in-[0.97] duration-200 ease-out"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-[#161618] border border-[#26262B] flex items-center justify-center text-[#F87171]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[16px] font-medium text-[#FAFAFA]">Disconnect Integration</h3>
                  <p className="text-[13px] text-[#A1A1AA] mt-0.5">
                    Revoke access to <span className="text-[#FAFAFA] font-medium">{integrationToDisconnect.name}</span>
                  </p>
                </div>
              </div>
              <p className="text-[13px] text-[#A1A1AA] leading-relaxed mt-2">
                Are you sure you want to disconnect this service? Your workflows that depend on this integration may stop working until it is reconnected.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-[#26262B] bg-[#161618] flex items-center justify-end gap-3">
              <button
                onClick={() => setIntegrationToDisconnect(null)}
                disabled={!!disconnecting}
                className="px-4 py-2 text-[13px] font-mono text-[#FAFAFA] bg-transparent hover:bg-[#26262B] border border-[#26262B] rounded-none transition-all duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisconnect}
                disabled={!!disconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-mono font-medium text-[#09090B] bg-[#F87171] hover:bg-[#fca5a5] border border-transparent rounded-none transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
              >
                {disconnecting === integrationToDisconnect.provider ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

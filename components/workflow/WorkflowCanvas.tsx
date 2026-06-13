"use client"
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  reconnectEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { NodeConfigSidebar } from './NodeConfigSidebar';
import { Button } from './Button';
import { ArrowLeft, Save, Plus, Play, ChevronUp, Zap, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workflow } from '@/schema/workflow';
import { useWorkflowEditorStore } from '@/store/workflow-editor';
import { NodePickerPopover } from './NodePickerPopover';
import { updateWorkflow } from '@/lib/api/workflow';
import { toast } from 'sonner';


interface WorkflowCanvasProps {
  onBack: () => void;
  workflowId: string;
  workflowName?: string;
  workflow?: Workflow | null;
  executions?: any[];
}

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error';
}

export const WorkflowCanvas = ({
  onBack,
  workflowId,
  workflowName = 'Untitled Workflow',
  workflow,
  executions = [],
}: WorkflowCanvasProps) => {

  const {
    nodes,
    edges,
    isDirty,
    onNodesChange,
    onEdgesChange,
    onConnect: storeOnConnect,
    addNode: storeAddNode,
    updateNodeData,
    setWorkflow,
    setSelectedNode,
    selectedNode,
    setEdges,
    markClean,
  } = useWorkflowEditorStore();

  useEffect(() => {
    if (workflow) {
      setWorkflow({
        id: workflowId,
        name: workflowName,
        nodes: workflow?.graph.nodes,
        edges: workflow?.graph.edges,
      });
    }
  }, []);

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [showLogsBar, setShowLogsBar] = useState(false);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(), timestamp: new Date(), message, type }]);
  }, []);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode?.data?.type === 'Trigger') {
        const hasOutgoing = edges.some(e => e.source === params.source);
        if (hasOutgoing) {
          addLog('Trigger nodes can only have one outgoing connection.', 'error');
          return;
        }
      }
      storeOnConnect(params);
    },
    [nodes, edges, storeOnConnect, addLog],
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const store = useWorkflowEditorStore.getState();
      store.setEdges?.((els: Edge[]) => reconnectEdge(oldEdge, newConnection, els));
    },
    [],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleNodeUpdate = useCallback((id: string, data: any) => {
    updateNodeData(id, data);
  }, [updateNodeData]);

  // Add a node at the end of the canvas (from header button)
  const addNode = useCallback((nodeType: string) => {
    const currentNodes = useWorkflowEditorStore.getState().nodes;
    const lastNode = currentNodes[currentNodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 400 : 50;
    const newY = lastNode ? lastNode.position.y : 250;

    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'custom',
      position: { x: newX, y: newY },
      data: {
        label: `New ${nodeType}`,
        type: nodeType,
        description: 'Configure this step',
        endpoint: 'https://api.example.com/new',
      },
    };

    storeAddNode(newNode);
  }, [storeAddNode]);

  // Add a node inline, connected to a source node
  const handleAddNodeInline = useCallback((sourceNodeId: string, nodeType: string) => {
    const store = useWorkflowEditorStore.getState();
    const sourceNode = store.nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    const newX = sourceNode.position.x + 400;
    const newY = sourceNode.position.y;
    const newNodeId = Math.random().toString(36).substr(2, 9);

    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: { x: newX, y: newY },
      data: {
        label: `New ${nodeType}`,
        type: nodeType,
        description: 'Configure this step',
        endpoint: 'https://api.example.com/new',
      },
    };

    storeAddNode(newNode);

    // Add connecting edge from source to new node
    store.setEdges((eds: Edge[]) => [
      ...eds,
      {
        id: `e-${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        type: 'custom',
        animated: true,
      },
    ]);
  }, [storeAddNode]);

  const handleTest = useCallback(async () => {
    if (isTesting) return;

    // Trigger check before run
    const store = useWorkflowEditorStore.getState();
    const hasTrigger = store.nodes.some(n => n.data?.type === 'Trigger');
    if (!hasTrigger) {
      toast.error('Add a Trigger node before running.');
      return;
    }

    // Save before run (flush pending debounce)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveToServer();

    setIsTesting(true);
    setShowLogsBar(true);
    setLogs([]);
    addLog('Started workflow execution', 'info');

    const currentNodes = useWorkflowEditorStore.getState().nodes;
    const currentEdges = useWorkflowEditorStore.getState().edges;

    // Reset run states using fresh store reference
    const freshStore = useWorkflowEditorStore.getState();
    freshStore.nodes.forEach(n => freshStore.updateNodeData(n.id, { ...n.data, runState: 'idle' }));
    freshStore.setEdges((eds: Edge[]) => eds.map(e => ({ ...e, data: { ...e.data, runState: 'idle' } })));

    const incomingCount = new Map<string, number>();
    currentNodes.forEach(n => incomingCount.set(n.id, 0));
    currentEdges.forEach(e => incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1));
    const rootNodes = currentNodes.filter(n => incomingCount.get(n.id) === 0).map(n => n.id);

    if (!rootNodes.length) { setIsTesting(false); return; }

    let activeBranches = rootNodes.length;

    const checkEnd = () => {
      if (activeBranches === 0) {
        setTimeout(() => {
          const s = useWorkflowEditorStore.getState();
          s.nodes.forEach(n =>
            s.updateNodeData(n.id, { ...n.data, runState: 'idle' })
          );
          s.setEdges((eds: Edge[]) => eds.map(e => ({ ...e, data: { ...e.data, runState: 'idle' } })));
          setIsTesting(false);
          addLog('Workflow execution finished', 'info');
        }, 2000);
      }
    };

    const runNode = (nodeId: string) => {
      const s = useWorkflowEditorStore.getState();
      const currentNode = s.nodes.find(n => n.id === nodeId);
      const nodeName = currentNode?.data?.label || nodeId;
      addLog(`Running node: ${nodeName}...`, 'info');
      s.updateNodeData(nodeId, { ...currentNode?.data, runState: 'running' });

      setTimeout(() => {
        const s2 = useWorkflowEditorStore.getState();
        const node2 = s2.nodes.find(n => n.id === nodeId);
        const isError = Math.random() > 0.9;
        s2.updateNodeData(nodeId, { ...node2?.data, runState: isError ? 'error' : 'success' });

        if (isError) {
          addLog(`Node failed: ${nodeName}`, 'error');
          activeBranches--;
          checkEnd();
        } else {
          addLog(`Node completed: ${nodeName}`, 'success');
          const outgoing = s2.edges.filter(e => e.source === nodeId);
          if (!outgoing.length) { activeBranches--; checkEnd(); return; }

          const isDecision = node2?.data?.type === 'Decision';
          const edgesToRun = isDecision
            ? [outgoing[Math.floor(Math.random() * outgoing.length)]]
            : outgoing;

          activeBranches += edgesToRun.length - 1;

          // Animate edges: set running
          s2.setEdges((eds: Edge[]) => eds.map(e =>
            edgesToRun.some(oe => oe.id === e.id)
              ? { ...e, data: { ...e.data, runState: 'running' } }
              : e
          ));

          setTimeout(() => {
            // Animate edges: set success
            const s3 = useWorkflowEditorStore.getState();
            s3.setEdges((eds: Edge[]) => eds.map(e =>
              edgesToRun.some(oe => oe.id === e.id)
                ? { ...e, data: { ...e.data, runState: 'success' } }
                : e
            ));
            edgesToRun.forEach(e => runNode(e.target));
          }, 1000);
        }
      }, 1500);
    };

    rootNodes.forEach(rootId => runNode(rootId));
  }, [isTesting, addLog]);

  // ─── Core save function (no trigger check — used for autosave) ───────────
  const saveToServer = useCallback(async (): Promise<boolean> => {
    const store = useWorkflowEditorStore.getState();
    if (!store.isDirty) return true; // nothing to save

    const { nodes: n, edges: e } = store;
    setIsSaving(true);
    try {
      await updateWorkflow(workflowId, {
        workflow: {
          graph: {
            nodes: n.map(({ id, type, data, position }) => ({ id, type: type ?? 'custom', data, position })),
            edges: e.map(({ id, source, target, sourceHandle, targetHandle, data }) => ({
              id,
              source,
              target,
              sourceHandle: sourceHandle ?? undefined,
              targetHandle: targetHandle ?? undefined,
              data
            })),
          },
        },
      });
      markClean();
      setLastSaved(new Date());
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, markClean]);

  // ─── Debounced autosave: fires 1.5s after last node/edge change ──────────
  useEffect(() => {
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveToServer(); }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, isDirty, saveToServer]);

  // ─── Save on unmount (client-side route change) ──────────────────────────
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (useWorkflowEditorStore.getState().isDirty) {
        // fire-and-forget; we can't await in a cleanup
        saveToServer();
      }
    };
  }, [saveToServer]);

  // ─── Save on browser close / refresh ────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useWorkflowEditorStore.getState().isDirty) {
        // Attempt best-effort sync save via sendBeacon is unreliable for JSON;
        // trigger browser's native "unsaved changes" dialog as a fallback.
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ─── Manual Save: trigger check first, then saveToServer ────────────────
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const currentNodes = useWorkflowEditorStore.getState().nodes;
    const hasTrigger = currentNodes.some(n => n.data?.type === 'Trigger');
    if (!hasTrigger) {
      toast.error('Add a Trigger node before saving your workflow.');
      return;
    }
    const ok = await saveToServer();
    if (ok) toast.success('Workflow saved!');
    else toast.error('Failed to save workflow.');
  }, [isSaving, saveToServer]);

  // Inject the inline-add callback into every node's data for CustomNode to use
  const reactFlowNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: { ...n.data, onAddNodeInline: handleAddNodeInline }
  })), [nodes, handleAddNodeInline]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 border-b border-border bg-card flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground rounded-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-border mx-2" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono-data mb-1">Project / Workflow</div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{workflowName}</h2>
          </div>

          {/* Save status pill */}
          <div className="flex items-center gap-1.5 ml-4 min-w-[130px]">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono-data">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving…
              </span>
            ) : lastSaved && !isDirty ? (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-mono-data">
                <CheckCircle2 className="w-3 h-3" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-500 font-mono-data">
                <Circle className="w-2.5 h-2.5 fill-amber-500" />
                Unsaved changes
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NodePickerPopover onSelect={addNode} side="bottom" align="center">
            <Button variant="outline" size="md" className="border-border hover:border-primary/50">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </NodePickerPopover>
          <Button
            variant="outline"
            size="md"
            className="border-border hover:border-primary/50"
            onClick={handleTest}
            disabled={isTesting}
          >
            <Play className="w-4 h-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button
            size="md"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Workflow
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <div className="absolute top-0 left-1/4 w-px h-full bg-border" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-border" />
          <div className="absolute top-1/4 left-0 w-full h-px bg-border" />
          <div className="absolute bottom-1/4 left-0 w-full h-px bg-border" />
        </div>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-card/80 backdrop-blur-sm border border-border p-8 rounded-2xl shadow-premium flex flex-col items-center max-w-md text-center pointer-events-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Build Your Workflow</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">Every automation begins with a trigger. What event should start this workflow?</p>
              <Button size="lg" onClick={() => addNode('Trigger')} className="w-full shadow-md font-semibold tracking-wide">
                <Plus className="w-5 h-5 mr-2" />
                Start with Trigger Node
              </Button>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={reactFlowNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeUpdate={onEdgeUpdate}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 1.5, minZoom: 0.1 }}
          minZoom={0.1}
          className="bg-background dark:bg-[#1f1f1f]"
        >
          <Background color="rgba(150,150,150,0.3)" gap={20} size={1.5} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-card !border-border !fill-foreground !rounded-none !shadow-premium" />
          <MiniMap
            className="!bg-card !border-border !rounded-none"
            nodeColor="oklch(0.75 0.18 330)"
            maskColor="rgba(0, 0, 0, 0.7)"
          />

          <Panel position="bottom-right" className="bg-card border border-border p-6 shadow-premium m-8 rounded-none min-w-[200px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 font-mono-data">System Status</div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-[10px] text-muted-foreground uppercase font-mono-data">Nodes</div>
                <div className="text-2xl font-bold text-foreground leading-none">{nodes.length}</div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[10px] text-muted-foreground uppercase font-mono-data">Edges</div>
                <div className="text-2xl font-bold text-foreground leading-none">{edges.length}</div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-primary uppercase font-mono-data tracking-wider">Live Sync Active</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Logs panel */}
        <AnimatePresence>
          {showLogsBar && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="absolute bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
            >
              <motion.div
                className="bg-card border-t border-l border-r border-border rounded-t-lg shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col overflow-hidden"
                animate={{ height: isLogsExpanded ? 300 : 40, width: isLogsExpanded ? '80%' : 250 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <button
                  onClick={() => setIsLogsExpanded(v => !v)}
                  className={`h-10 px-4 flex items-center justify-between bg-black/40 hover:bg-black/60 transition-colors cursor-pointer w-full shrink-0 ${isLogsExpanded ? 'border-b border-border' : ''}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono-data">
                    Workflow Logs {logs.length > 0 && `(${logs.length})`}
                  </span>
                  <motion.div animate={{ rotate: isLogsExpanded ? 180 : 0 }}>
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isLogsExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 overflow-y-auto p-4 space-y-2 bg-background/95 font-mono-data text-xs"
                    >
                      {logs.map(log => (
                        <div key={log.id} className="flex gap-4">
                          <span className="text-muted-foreground opacity-50 shrink-0">
                            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className={
                            log.type === 'error' ? 'text-red-400' :
                              log.type === 'success' ? 'text-emerald-400' :
                                'text-foreground'
                          }>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedNode && (
            <NodeConfigSidebar
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleNodeUpdate}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
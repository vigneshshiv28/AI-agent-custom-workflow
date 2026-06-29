"use client"
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  reconnectEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { NodeConfigSidebar } from './NodeConfigSidebar';
import { ArrowLeft, Play, ChevronUp, Loader2, CheckCircle2, Circle, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workflow } from '@/schema/workflow';
import { useWorkflowEditorStore } from '@/store/workflow-editor';
import { AgentLibraryPanel, AgentLibraryPopover } from './AgentLibrary';
import { updateWorkflow, runWorkflow, deleteWorkflow } from '@/lib/api/workflow';
import { toast } from 'sonner';
import { sseManager } from '@/lib/events/sse';
import type { NodeStartEvent, NodeSuccessEvent, NodeErrorEvent, WorkflowStartEvent, WorkflowCompleteEvent, WorkflowFailedEvent, AgentToolStartEvent, AgentToolResultEvent } from '@/lib/events/sse-events';


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
    setWorkflowName,
  } = useWorkflowEditorStore();

  const [editableName, setEditableName] = useState(workflowName || 'Untitled Workflow');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (workflow) {
      setWorkflow({
        id: workflowId,
        name: workflowName,
        nodes: workflow?.graph.nodes?.map(n => ({
          ...n,
          deletable: n.data?.type !== 'Trigger',
        })),
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

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      sseManager.addListener<WorkflowStartEvent>('workflow:start', (e) => {
        if (e.workflowId !== workflowId) return;
        setShowLogsBar(true);
        setIsLogsExpanded(true);
        setLogs([]);
        addLog(`Execution started (id: ${e.executionId})`, 'info');
        const s = useWorkflowEditorStore.getState();
        s.setEdges(eds => eds.map(ed => ({ ...ed, data: { ...ed.data, runState: 'idle' } })));
      })
    );

    unsubs.push(
      sseManager.addListener<NodeStartEvent>('node:start', (e) => {
        if (e.workflowId !== workflowId) return;
        const s = useWorkflowEditorStore.getState();
        
        const incomingEdges = s.edges.filter(edge => edge.target === e.nodeId);
        incomingEdges.forEach(edge => {
          s.setEdges(eds => eds.map(ed =>
            ed.id === edge.id ? { ...ed, data: { ...ed.data, runState: 'success' } } : ed
          ));
        });

        const node = s.nodes.find(n => n.id === e.nodeId);
        s.updateNodeData(e.nodeId, { ...node?.data, runState: 'running' });
        addLog(`Running: ${node?.data?.label ?? e.nodeId} [${e.nodeType}]`, 'info');
      })
    );

    unsubs.push(
      sseManager.addListener<NodeSuccessEvent>('node:success', (e) => {
        if (e.workflowId !== workflowId) return;
        const s = useWorkflowEditorStore.getState();
        const node = s.nodes.find(n => n.id === e.nodeId);
        s.updateNodeData(e.nodeId, { ...node?.data, runState: 'success' });
        addLog(`Completed: ${node?.data?.label ?? e.nodeId}`, 'success');
      })
    );

    unsubs.push(
      sseManager.addListener<NodeErrorEvent>('node:error', (e) => {
        if (e.workflowId !== workflowId) return;
        const s = useWorkflowEditorStore.getState();
        const node = s.nodes.find(n => n.id === e.nodeId);
        s.updateNodeData(e.nodeId, { ...node?.data, runState: 'error' });
        addLog(`Failed: ${node?.data?.label ?? e.nodeId} — ${e.error}`, 'error');
      })
    );

    unsubs.push(
      sseManager.addListener<AgentToolStartEvent>('agent:tool:start', (e) => {
        if (e.workflowId !== workflowId) return;
        addLog(`Tool called: ${e.toolName}`, 'info');
      })
    );

    unsubs.push(
      sseManager.addListener<AgentToolResultEvent>('agent:tool:result', (e) => {
        if (e.workflowId !== workflowId) return;
        const isError = (e.toolOutput as any)?.error !== undefined;
        if (isError) {
          addLog(`Tool failed: ${e.toolName} — ${(e.toolOutput as any).error}`, 'error');
        } else {
          addLog(`Tool finished: ${e.toolName}`, 'success');
        }
      })
    );

    unsubs.push(
      sseManager.addListener<WorkflowCompleteEvent>('workflow:complete', (e) => {
        if (e.workflowId !== workflowId) return;
        setIsTesting(false);
        addLog('Workflow completed successfully', 'success');
      })
    );

    unsubs.push(
      sseManager.addListener<WorkflowFailedEvent>('workflow:failed', (e) => {
        if (e.workflowId !== workflowId) return;
        setIsTesting(false);
        addLog(`Workflow failed: ${e.error}`, 'error');
      })
    );

    return () => unsubs.forEach(fn => fn());
  }, [workflowId, addLog]);

  const nodeTypes = useMemo(() => ({
    Trigger: CustomNode,
    Decision: CustomNode,
    notion: CustomNode,
    gmail: CustomNode,
    "google-calendar": CustomNode,
    "google-drive": CustomNode,
  }), []);
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
      const isDecisionSource = sourceNode?.data?.type === 'Decision';
      const branchPath = isDecisionSource && (params.sourceHandle === 'true' || params.sourceHandle === 'false')
        ? params.sourceHandle
        : null;
      storeOnConnect({ ...params, data: branchPath ? { branchPath } : undefined } as any);
    },
    [nodes, edges, storeOnConnect, addLog],
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const store = useWorkflowEditorStore.getState();
      const newBranchPath =
        newConnection.sourceHandle === 'true' || newConnection.sourceHandle === 'false'
          ? newConnection.sourceHandle
          : undefined;
      store.setEdges?.((els: Edge[]) => {
        const reconnected = reconnectEdge(oldEdge, newConnection, els);
        return reconnected.map(ed =>
          ed.id === oldEdge.id
            ? { ...ed, data: { ...(ed.data ?? {}), branchPath: newBranchPath } }
            : ed
        );
      });
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

  const addNode = useCallback((nodeType: string) => {
    const store = useWorkflowEditorStore.getState();
    const currentNodes = store.nodes;
    const hasTrigger = currentNodes.some(n => n.data?.type === 'Trigger');

    if (!hasTrigger && nodeType !== 'Trigger') {
      const triggerId = Math.random().toString(36).substr(2, 9);
      const triggerNode: Node = {
        id: triggerId,
        type: 'Trigger',
        position: { x: 50, y: 250 },
        deletable: false,
        data: { label: 'New Trigger', type: 'Trigger', description: 'Configure this step', Prompt: '' },
      };
      store.addNode(triggerNode);

      const newNodeId = Math.random().toString(36).substr(2, 9);
      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position: { x: 450, y: 250 },
        deletable: true,
        data: { label: `New ${nodeType}`, type: nodeType, description: 'Configure this step', Prompt: '' },
      };
      store.addNode(newNode);

      store.setEdges((eds: Edge[]) => [
        ...eds,
        { id: `e-${triggerId}-${newNodeId}`, source: triggerId, target: newNodeId, type: 'custom' },
      ]);
      store.setSelectedNode(newNode);
      return;
    }

    const lastNode = currentNodes[currentNodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 400 : 50;
    const newY = lastNode ? lastNode.position.y : 250;

    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: nodeType,
      position: { x: newX, y: newY },
      deletable: nodeType !== 'Trigger',
      data: {
        label: `New ${nodeType}`,
        type: nodeType,
        description: 'Configure this step',
        Prompt: '',
      },
    };
    store.addNode(newNode);
    store.setSelectedNode(newNode);
  }, []);

  const handleAddNodeInline = useCallback((sourceNodeId: string, nodeType: string) => {
    const store = useWorkflowEditorStore.getState();
    const sourceNode = store.nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    const newX = sourceNode.position.x + 400;
    const newY = sourceNode.position.y;
    const newNodeId = Math.random().toString(36).substr(2, 9);

    const newNode: Node = {
      id: newNodeId,
      type: nodeType,
      position: { x: newX, y: newY },
      deletable: nodeType !== 'Trigger',
      data: {
        label: `New ${nodeType}`,
        type: nodeType,
        description: 'Configure this step',
        Prompt: '',
      },
    };
    storeAddNode(newNode);

    store.setEdges((eds: Edge[]) => [
      ...eds,
      {
        id: `e-${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        type: 'custom',
      },
    ]);
    store.setSelectedNode(newNode);
  }, [storeAddNode]);

  const handleRun = useCallback(async () => {
    if (isTesting) return;
    const store = useWorkflowEditorStore.getState();
    const hasTrigger = store.nodes.some(n => n.data?.type === 'Trigger');
    if (!hasTrigger) {
      toast.error('Add a Trigger node before running.');
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveToServer();

    setIsTesting(true);
    setShowLogsBar(true);
    setLogs([]);
    addLog('Queueing workflow execution...', 'info');

    const freshStore = useWorkflowEditorStore.getState();
    freshStore.nodes.forEach(n => freshStore.updateNodeData(n.id, { ...n.data, runState: 'idle' }));
    freshStore.setEdges((eds: Edge[]) => eds.map(e => ({ ...e, data: { ...e.data, runState: 'idle' } })));

    try {
      await runWorkflow(workflowId);
      addLog('Workflow queued — waiting for execution events...', 'info');
    } catch (err: any) {
      addLog(`Failed to queue workflow: ${err?.message ?? 'Unknown error'}`, 'error');
      setIsTesting(false);
    }
  }, [isTesting, addLog, workflowId]);

  const saveToServer = useCallback(async (): Promise<boolean> => {
    const store = useWorkflowEditorStore.getState();
    if (!store.isDirty) return true;

    const { nodes: n, edges: e } = store;
    setIsSaving(true);
    try {
      await updateWorkflow(workflowId, {
        name: store.workflowName || undefined,
        workflow: {
          graph: {
            nodes: n.map(({ id, type, data, position }) => {
              const { prompt: _prompt, ...nodeData } = data ?? {};
              return { id, type: type ?? nodeData?.type ?? 'Action', data: nodeData, position };
            }),
            edges: e.map(({ id, source, target, sourceHandle, targetHandle, data }) => {
              const branchPath: 'true' | 'false' | undefined =
                data?.branchPath ??
                (sourceHandle === 'true' || sourceHandle === 'false' ? sourceHandle : undefined);
              return {
                id,
                source,
                target,
                sourceHandle: sourceHandle ?? undefined,
                targetHandle: targetHandle ?? undefined,
                data: branchPath ? { branchPath } : undefined,
              };
            }),
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


  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkflow(workflowId);
      toast.success("Workflow deleted");
      onBack();
    } catch (err) {
      toast.error("Failed to delete workflow");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveToServer(); }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, isDirty, saveToServer]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (useWorkflowEditorStore.getState().isDirty) {
        saveToServer();
      }
    };
  }, [saveToServer]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useWorkflowEditorStore.getState().isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handlePublish = useCallback(async () => {
    if (isSaving) return;
    const currentNodes = useWorkflowEditorStore.getState().nodes;
    const hasTrigger = currentNodes.some(n => n.data?.type === 'Trigger');
    if (!hasTrigger) {
      toast.error('Add a Trigger node before publishing.');
      return;
    }
    const ok = await saveToServer();
    if (ok) toast.success('Workflow published!');
    else toast.error('Failed to publish workflow.');
  }, [isSaving, saveToServer]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const triggerNodes = nodes.filter(n => n.data?.type === 'Trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow has no start node');
      errors.push('At least one trigger is required');
    }

    const reachableNodes = new Set<string>(triggerNodes.map(n => n.id));
    let changed = true;
    while (changed) {
      changed = false;
      edges.forEach(e => {
        if (reachableNodes.has(e.source) && !reachableNodes.has(e.target)) {
          reachableNodes.add(e.target);
          changed = true;
        }
      });
    }

    const hasUnreachable = nodes.some(n => n.data?.type !== 'Trigger' && !reachableNodes.has(n.id));
    if (hasUnreachable) {
      errors.push('This workflow has unreachable agents');
    }

    const hasDisconnected = nodes.some(n => n.data?.type !== 'Trigger' && !edges.some(e => e.target === n.id));
    if (hasDisconnected) {
      errors.push('This workflow contains disconnected agents');
    }

    return errors;
  }, [nodes, edges]);

  const reactFlowNodes = useMemo(() => nodes.map(n => {
    const isDisconnected = n.data?.type !== 'Trigger' && !edges.some(e => e.target === n.id);
    return {
      ...n,
      data: { ...n.data, onAddNodeInline: handleAddNodeInline, isDisconnected }
    };
  }), [nodes, edges, handleAddNodeInline]);

  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = React.useState<any>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/agentflow-type');
      if (!nodeType || !rfInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const store = useWorkflowEditorStore.getState();
      const hasTrigger = store.nodes.some(n => n.data?.type === 'Trigger');

      if (!hasTrigger && nodeType !== 'Trigger') {
        const triggerId = Math.random().toString(36).substr(2, 9);
        store.addNode({
          id: triggerId,
          type: 'Trigger',
          position: { x: position.x - 420, y: position.y },
          deletable: false,
          data: { label: 'New Trigger', type: 'Trigger', description: 'Configure this step', Prompt: '' },
        });
        const newId = Math.random().toString(36).substr(2, 9);
        const newNode: Node = {
          id: newId,
          type: nodeType,
          position,
          deletable: true,
          data: { label: `New ${nodeType}`, type: nodeType, description: 'Configure this step', Prompt: '' },
        };
        store.addNode(newNode);
        store.setEdges((eds: Edge[]) => [
          ...eds,
          { id: `e-${triggerId}-${newId}`, source: triggerId, target: newId, type: 'custom' },
        ]);
        store.setSelectedNode(newNode);
      } else {
        const newId = Math.random().toString(36).substr(2, 9);
        const newNode: Node = {
          id: newId,
          type: nodeType,
          position,
          deletable: nodeType !== 'Trigger',
          data: { label: `New ${nodeType}`, type: nodeType, description: 'Configure this step', Prompt: '' },
        };
        store.addNode(newNode);
        store.setSelectedNode(newNode);
      }
    },
    [rfInstance]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--color-onyx)' }}>

      {/* Top Navigation — 56px */}
      <header
        className="h-14 flex items-center justify-between px-5 flex-shrink-0 z-10"
        style={{ background: 'var(--color-charcoal)', borderBottom: '1px solid var(--color-graphite)' }}
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#52525B] hover:text-[#A1A1AA] transition-all duration-150 ease-ui-out active:scale-[0.97] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--color-graphite)' }} />

          <input
            type="text"
            value={editableName}
            onChange={(e) => {
              setEditableName(e.target.value);
              setWorkflowName(e.target.value);
            }}
            className="text-[13px] font-medium text-[#FAFAFA] bg-transparent border-none outline-none hover:text-white focus:text-white transition-colors cursor-text"
            style={{ width: `${Math.max(editableName.length, 8)}ch`, minWidth: '80px', maxWidth: '280px' }}
            placeholder="Untitled Workflow"
            aria-label="Workflow name"
          />

          {/* Save status */}
          <div className="flex items-center">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving
              </span>
            ) : lastSaved && !isDirty ? (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                Saved
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                <Circle className="w-2 h-2 fill-amber-400" />
                Unsaved
              </span>
            ) : null}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="relative group/validation flex items-center h-full px-2 cursor-pointer">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div className="absolute top-full right-0 mt-2 w-64 bg-obsidian border border-graphite shadow-2xl p-3 z-50 opacity-0 group-hover/validation:opacity-100 pointer-events-none transition-opacity" style={{ background: 'var(--color-obsidian)', borderColor: 'var(--color-graphite)' }}>
                <h4 className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-2">Validation Issues</h4>
                <ul className="space-y-1.5">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="text-[12px] text-snow flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="leading-tight">{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Run */}
          <button
            onClick={handleRun}
            disabled={isTesting}
            className="h-8 px-3 flex items-center justify-center text-[12px] font-medium text-fog border border-graphite hover:border-iron hover:text-snow transition-all duration-150 ease-ui-out active:scale-[0.97] disabled:opacity-40 cursor-pointer"
            style={{ borderRadius: 0, minWidth: '100px' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isTesting ? (
                <motion.div
                  key="running"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1.5"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Running...
                </motion.div>
              ) : (
                <motion.div
                  key="run"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  Run
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Publish — primary pink */}
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="h-8 px-3 flex items-center justify-center text-[12px] font-semibold transition-all duration-150 ease-out active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            style={{ background: '#F49ACB', color: '#09090B', borderRadius: 0, minWidth: '100px' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSaving ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1.5"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </motion.div>
              ) : (
                <motion.div
                  key="publish"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1.5"
                >
                  Publish
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* Canvas — Library panel + ReactFlow */}
      <div className="flex-1 relative overflow-hidden flex">

        {/* Library panel */}
        <AgentLibraryPanel onSelect={addNode} />

        {/* ReactFlow area */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center text-center pointer-events-auto">
                <h2 className="text-[15px] font-medium text-snow mb-2 tracking-tight">
                  Create your first workflow
                </h2>
                <p className="text-[13px] text-fog mb-6 max-w-[320px] leading-relaxed">
                  Connect agents together to automate decisions and actions.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addNode('Trigger')}
                    className="h-8 px-4 text-[12px] font-medium text-[#09090B] transition-all duration-150 ease-ui-out hover:opacity-80 active:scale-[0.97] cursor-pointer"
                    style={{ background: '#FAFAFA', borderRadius: 0 }}
                  >
                    Create agent
                  </button>
                </div>
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
            edgesUpdatable
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={setRfInstance}
            fitView
            fitViewOptions={{ padding: 1.5, minZoom: 0.1 }}
            minZoom={0.1}
            style={{ background: 'var(--color-onyx)' }}
            defaultEdgeOptions={{ type: 'custom' }}
          >
            <Background
              color="var(--color-iron)"
              gap={24}
              size={3}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              style={{
                background: 'var(--color-charcoal)',
                border: '1px solid var(--color-graphite)',
                borderRadius: 0,
                boxShadow: 'none',
              }}
            />
          </ReactFlow>
        </div>

        {/* Logs drawer — only visible after Run */}
        <AnimatePresence>
          {showLogsBar && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute bottom-0 left-0 right-0 z-40 flex flex-col overflow-hidden"
              style={{
                background: 'var(--color-charcoal)',
                borderTop: '1px solid var(--color-graphite)',
                height: isLogsExpanded ? 280 : 40,
                transition: 'height 0.2s ease',
              }}
            >
              <button
                onClick={() => setIsLogsExpanded(v => !v)}
                className="h-10 px-5 flex items-center justify-between shrink-0 w-full hover:bg-[#F49ACB]/[0.05] transition-colors duration-150 ease-out active:bg-[#F49ACB]/[0.1] cursor-pointer"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-fog">
                  Logs {logs.length > 0 && `(${logs.length})`}
                </span>
                <ChevronUp
                  className="w-3.5 h-3.5 text-fog transition-transform duration-150"
                  style={{ transform: isLogsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatePresence>
                {isLogsExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 font-mono text-[11px]"
                  >
                    {logs.map(log => {
                      const msgColor =
                        log.type === 'error' ? 'text-red-300' :
                          log.type === 'success' ? 'text-emerald-300' :
                            'text-mist';
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="flex items-start gap-3"
                        >
                          <span className="text-slate shrink-0 tabular-nums pt-px select-none">
                            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className={`${msgColor} leading-relaxed`}>
                            {log.message}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inspector sidebar */}
        <AnimatePresence>
          {selectedNode && (
            <NodeConfigSidebar
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleNodeUpdate}
              onDelete={(id) => useWorkflowEditorStore.getState().removeNode(id)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
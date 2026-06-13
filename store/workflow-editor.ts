import { create } from "zustand";

import {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

interface WorkflowEditor {
  // workflow metadata
  workflowId: string | null;
  workflowName: string;

  // reactflow state
  nodes: Node[];
  edges: Edge[];

  // ui state
  selectedNode: Node | null;

  // save state
  isDirty: boolean;
  isSaving: boolean;

  // initialize workflow
  setWorkflow: (workflow: {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
  }) => void;

  // reactflow handlers
  onNodesChange: (
    changes: NodeChange[]
  ) => void;

  onEdgesChange: (
    changes: EdgeChange[]
  ) => void;

  onConnect: (
    connection: Connection
  ) => void;

  // node actions
  addNode: (node: Node) => void;

  removeNode: (id: string) => void;

  updateNodeData: (
    id: string,
    data: Record<string, any>
  ) => void;

  // ui actions
  setSelectedNode: (
    node: Node | null
  ) => void;

  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;

  // saving state
  setSaving: (saving: boolean) => void;

  // mark the workflow as clean (saved)
  markClean: () => void;

  // reset editor
  reset: () => void;
}

const initialState = {
  workflowId: null,
  workflowName: "",
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,
  isSaving: false,
};

export const useWorkflowEditorStore =
  create<WorkflowEditor>((set) => ({
    ...initialState,

    // initialize workflow
    setWorkflow: (workflow) =>
      set({
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        isDirty: false,
      }),

    // reactflow node updates
    onNodesChange: (changes) =>
      set((state) => ({
        nodes: applyNodeChanges(
          changes,
          state.nodes
        ),
        isDirty: true,
      })),

    // reactflow edge updates
    onEdgesChange: (changes) =>
      set((state) => ({
        edges: applyEdgeChanges(
          changes,
          state.edges
        ),
        isDirty: true,
      })),

    // connect nodes
    onConnect: (connection) =>
      set((state) => ({
        edges: addEdge(
          {
            ...connection,
            type: "custom",
            animated: true,
          },
          state.edges
        ),
        isDirty: true,
      })),

    // add new node
    addNode: (node) =>
      set((state) => ({
        nodes: [...state.nodes, node],
        isDirty: true,
      })),

    // remove node + connected edges
    removeNode: (id) =>
      set((state) => ({
        nodes: state.nodes.filter(
          (node) => node.id !== id
        ),

        edges: state.edges.filter(
          (edge) =>
            edge.source !== id &&
            edge.target !== id
        ),

        selectedNode:
          state.selectedNode?.id === id
            ? null
            : state.selectedNode,

        isDirty: true,
      })),

    // update node config/data
    updateNodeData: (id, data) =>
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === id
            ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
            : node
        ),

        isDirty: true,
      })),

    // selected node for sidebar
    setSelectedNode: (node) =>
      set({
        selectedNode: node,
      }),

    setEdges: (updater) =>
      set((state) => ({
        edges: updater(state.edges),
        isDirty: true,
      })),

    // saving state
    setSaving: (saving) =>
      set({
        isSaving: saving,
      }),

    // mark workflow as clean after save
    markClean: () =>
      set({
        isDirty: false,
      }),

    // clear workflow editor
    reset: () =>
      set(initialState),
  }));
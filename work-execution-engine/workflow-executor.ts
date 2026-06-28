import { emitter } from "./event-emitter";
import { Workflow, Node } from "@/schema/workflow";
import { AgentNodeOutput, ConditionNodeOutput, WorkflowExecutorEvent, ExecutionContext, NodeError, toNodeError } from "./type";
import { ExecutionService } from "@/lib/services";
import { createExecutionContext } from "./execution-context";
import { retry } from "./retry";
import { measureExecutionTimeSync } from "./profiler";
import { IntegrationRegistry } from "./integrations";
export class WorkflowExecutor {
  private workflowId: string;
  private userId: string;
  private workflow: Workflow;
  private graph: Map<Node, { node: Node; branchPath: "true" | "false" | null }[]>;
  private executionId: string;
  private startNode: Node | null = null;
  private emit: (event: WorkflowExecutorEvent) => Promise<void>;

  constructor(
    workflowId: string,
    workflow: Workflow,
    userId: string,
    executionId: string,
    emit: (event: WorkflowExecutorEvent) => Promise<void>
  ) {
    this.workflowId = workflowId
    this.userId = userId
    this.workflow = workflow
    this.executionId = executionId
    this.graph = new Map<Node, { node: Node; branchPath: "true" | "false" | null }[]>()
    this.startNode = measureExecutionTimeSync("findStartNode", () => this.findStartNode());
    this.emit = emit

    measureExecutionTimeSync("constructGraph", () => this.constructGraph());
  }

  private constructGraph() {

    const idToNode = new Map<string, Node>();

    for (const node of this.workflow.graph.nodes) {
      idToNode.set(node.id, node);
      this.graph.set(node, []);
    }
    for (const edge of this.workflow.graph.edges) {
      const sourceNode = idToNode.get(edge.source);
      const targetNode = idToNode.get(edge.target);

      if (sourceNode && targetNode) {
        // branchPath may live in data.branchPath OR fall back to sourceHandle
        // (the frontend sometimes only persists sourceHandle for Decision edges)
        const branchPath: "true" | "false" | null =
          edge?.data?.branchPath ??
          (edge.sourceHandle === "true" || edge.sourceHandle === "false"
            ? edge.sourceHandle
            : null);
        this.graph.get(sourceNode)?.push({ node: targetNode, branchPath });
      }
    }
  }


  private findStartNode() {
    const startNode = this.workflow.graph.nodes.find((n) => n.type === "Trigger")
    return startNode || null
  }

  private getParentOutput(
    nodeId: string,
    context: ExecutionContext
  ) {
    const parentEdge =
      this.workflow.graph.edges.find(
        edge => edge.target === nodeId
      );

    if (!parentEdge) {
      return undefined;
    }

    const parentOutput = context.outputs[parentEdge.source];

    if (parentOutput && "branch" in parentOutput && "output" in parentOutput) {
      return parentOutput.output as AgentNodeOutput;
    }

    return parentOutput;
  }

  public async executeWorkflow() {
    try {
      const execution =
        await ExecutionService.createWorkflowExecution({ workflowId: this.workflowId });

      const context = createExecutionContext(
        execution.id,
        this.userId,
        this.workflowId,
        this.emit,
      );

      let queue: Node[] = [];
      if (!this.startNode) {
        throw new Error("Workflow is invalid no starting node found");
      }

      await this.emit({
        type: "workflow:start",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        timestamp: Date.now(),
      });
      queue.push(this.startNode);

      while (queue.length > 0) {
        const currentBatch = queue;
        queue = [];

        const results = await Promise.all(
          currentBatch.map(async (node) => {

            try {
              context.outputs[node.id] = await retry(() => this.processNode(node, context), 3, 1000);
            } catch (error: unknown) {
              const nodeError = toNodeError(error, node.id, node.type);
              console.log("Error processing node", nodeError);
              context.errors[node.id] = nodeError.message;

              await this.emit({
                type: "node:error",
                executionId: this.executionId,
                workflowId: this.workflowId,
                userId: this.userId,
                nodeId: node.id,
                nodeType: node.type,
                error: nodeError.message,
                timestamp: Date.now(),
              });

              return { node, error: nodeError };
            }
            
            return { node, output: context.outputs[node.id] };
          })
        );

        for (const { node, output, error } of results) {
          if (error) {
            continue;
          }

          const children = this.graph.get(node) ?? [];

          if (node.type === "Decision") {
            console.log("Decision Node", node);
            console.log("Decision Node Output", output);
            const branch = (output as ConditionNodeOutput).branch;
            console.log("branch", branch);
            console.log("children", children);
            const nextChild = children.find((c) => c.branchPath === branch);

            if (nextChild) {
              //nextChild.node.data = { ...(nextChild.node.data ?? {}), previousInput: output };
              queue.push(nextChild.node);
            }
          } else {
            for (const { node: child } of children) {
              //child.data = { ...(child.data ?? {}), previousInput: output };
              queue.push(child);
            }
          }
        }
      }

      await emitter.emit({
        type: "workflow:complete",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        timestamp: Date.now(),
      });
    } catch (error: unknown) {
      if (error instanceof NodeError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      await this.emit({
        type: "workflow:failed",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        timestamp: Date.now(),
        error: message,
      });

      throw error;
    }
  }

  async processNode(node: Node, context: ExecutionContext) {
    const nodeId = node.id;
    const nodeType = node.type;
    const input: AgentNodeOutput =
      this.getParentOutput(
        node.id,
        context
      );

    await this.emit({
      type: "node:start",
      executionId: this.executionId,
      workflowId: this.workflowId,
      userId: this.userId,
      nodeId,
      nodeType,
      input,
      timestamp: Date.now(),
    });

    try {
      let result: AgentNodeOutput | ConditionNodeOutput;

      if (nodeType === "Trigger") {
        result = { text: "Workflow triggered", data: {} };
      } else if (nodeType === "Decision") {
        result = { branch: "true", output: input } as ConditionNodeOutput;
      } else {
        const integration = IntegrationRegistry.get(node.type);
        if (!integration) {
          throw new NodeError(
            `No integration registered for node type: "${node.type}". ` +
            `Registered types: [${IntegrationRegistry.registeredTypes().join(", ")}]`,
            nodeId,
            nodeType
          );
        }

        result = await integration.execute(node, input, context);
      }

      await this.emit({
        type: "node:success",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        nodeId,
        nodeType,
        result,
        timestamp: Date.now(),
      });

      return result;

    } catch (err: unknown) {
      const nodeError = toNodeError(err, nodeId, nodeType);

      await this.emit({
        type: "node:error",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        nodeId,
        nodeType,
        error: nodeError.message,
        timestamp: Date.now(),
      });

      throw nodeError;
    }
  }

}








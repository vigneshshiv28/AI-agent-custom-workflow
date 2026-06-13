import { emitter } from "./event-emitter";
import { Workflow, Node } from "@/schema/workflow";
import { runWeatherAgent, runSummarizer } from "./agents";
import { AgentNodeOutput, ConditionNodeOutput, WorkflowExecutorEvent, ExecutionContext } from "./type";
import { ExecutionService } from "@/lib/services";
import { createExecutionContext } from "./execution-context";
import { retry } from "./retry";



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
    this.startNode = this.findStartNode()
    this.emit = emit

    if (!this.startNode) {
      throw new Error("Workflow is invalid no starting node found")
    }

    this.constructGraph()
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
        this.graph.get(sourceNode)?.push({ node: targetNode, branchPath: edge?.data?.branchPath ?? null });
      }
    }
  }


  private findStartNode() {
    const startNode = this.workflow.graph.nodes.find((n) => n.type === "start")
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

    return context.outputs[
      parentEdge.source
    ];
  }

  public async executeWorkflow() {

    const execution =
      await ExecutionService.createWorkflowExecution({ workflowId: this.workflowId });

    const context = createExecutionContext(
      execution.id,
    );

    let queue: Node[] = [];
    if (!this.startNode) {
      await this.emit({
        type: "workflow:failed",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        timestamp: Date.now(),
        error: "Workflow is invalid no starting node found"
      })
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
          const output = await retry(() => this.processNode(node, context), 3, 1000);
          context.outputs[node.id] = output;
          return { node, output };
        })
      );



      for (const { node, output } of results) {
        const children = this.graph.get(node) ?? [];

        if (node.type === "condition") {
          const branch = (output as ConditionNodeOutput).branch;
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

      switch (node.type) {
        case "start":
          result = { text: "", data: {} };
          break;

        case "weather_agent":
          result = await runWeatherAgent(node.data?.userPrompt ?? "", input);
          break;

        case "summarizer_agent":
          result = await runSummarizer(node.data?.userPrompt ?? "", input);
          break;

        case "condition":
          const { variable, operator, value } = node.data
          const actual = input?.data?.[variable]

          let branch: "true" | "false" = "false";
          if (actual !== undefined) {
            switch (operator) {
              case "==": branch = actual == value ? "true" : "false"; break;
              case "!=": branch = actual != value ? "true" : "false"; break;
              case ">": branch = actual > value ? "true" : "false"; break;
              case "<": branch = actual < value ? "true" : "false"; break;
              case ">=": branch = actual >= value ? "true" : "false"; break;
              case "<=": branch = actual <= value ? "true" : "false"; break;
              case "contains":
                branch = (typeof actual === "string" || Array.isArray(actual)) && actual.includes(value)
                  ? "true"
                  : "false";
                break;
              default:
                throw new Error(`Unknown operator ${operator}`);
            }
          }

          result = { branch, output: input };
          break;

        default:
          result = {
            text: "",
            data: {}
          }
          throw new Error("Unsupported node type: " + node.type);
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

    } catch (err: any) {
      await this.emit({
        type: "node:error",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        nodeId,
        nodeType,
        error: err.message,
        timestamp: Date.now(),
      });

      await this.emit({
        type: "workflow:failed",
        executionId: this.executionId,
        workflowId: this.workflowId,
        userId: this.userId,
        error: err.message,
        timestamp: Date.now(),
      });

      throw err;
    }
  }

}








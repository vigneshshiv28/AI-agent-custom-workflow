import { emitter } from "./event-emitter";
import { Workflow, Node } from "@/schema/workflow";
import { runWeatherAgent, runSummarizer } from "./agents";
import { AgentNodeOutput, ConditionNodeOutput, WorkflowExecutorEvent, ExecutionContext } from "./type";
import { ExecutionService } from "@/lib/services";
import { createExecutionContext } from "./execution-context";
import { retry } from "./retry";
import { measureExecutionTime, measureExecutionTimeSync } from "./profiler";



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
      });
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
          } catch (error: any) {
            console.log("Error processing node", error);
            context.errors[node.id] = error?.message;


            await this.emit({
              type: "node:error",
              executionId: this.executionId,
              workflowId: this.workflowId,
              userId: this.userId,
              nodeId: node.id,
              nodeType: node.type,
              error: error.message,
              timestamp: Date.now(),
            });

            await this.emit({
              type: "workflow:failed",
              executionId: this.executionId,
              workflowId: this.workflowId,
              userId: this.userId,
              timestamp: Date.now(),
              error: error.message
            });

          }
          return { node, output: context.outputs[node.id] };
        })
      );



      for (const { node, output } of results) {
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
        case "Trigger":
          result = { text: "", data: {} };
          break;

        case "Action":
          result = await runWeatherAgent(node.data?.Prompt ?? "", input);
          break;

        case "Monitor":
          result = await runSummarizer(node.data?.Prompt ?? "", input);
          break;

        case "Decision":
          const { variable, operator, value } = node.data
          console.log("variable:", variable);
          console.log("operator:", operator);

          console.log("value:", value);
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








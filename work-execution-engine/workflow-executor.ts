
import { Workflow,Node } from "@/app/api/workflow/route";
import { runWeatherAgent, runSummarizer } from "./agents";
import { AgentNodeOutput, ConditionNodeOutput, WorkflowExecutorEvent } from "./type";


 
export class WorkflowExecutor{
    private workflowId:string;
    private userId:string;
    private workflow:Workflow;
    private graph:Map<Node,{ node: Node; branchPath: "true" | "false" | null }[]>;
    private executionId:string;
    private startNode: Node | null = null;
    private emit: (event: WorkflowExecutorEvent) => Promise<void>;
    
    constructor(
        workflowId:string,
        workflow: Workflow,
        userId: string,
        executionId: string,
        emit: (event: WorkflowExecutorEvent) => Promise<void>
      ){
        this.workflowId = workflowId
        this.userId = userId
        this.workflow = workflow
        this.executionId = executionId
        this.graph = new Map<Node,{ node: Node; branchPath: "true" | "false" | null }[]>()
        this.startNode = this.findStartNode()
        this.emit = emit

        if(!this.startNode){
            throw new Error("Workflow is invalid no starting node found")
        }
                
        this.constructGraph()
    }

    private constructGraph(){

      const idToNode = new Map<string, Node>();

      for(const node of this.workflow.graph.nodes){
        idToNode.set(node.id, node);
        this.graph.set(node,[]);
      }
      for(const edge of this.workflow.graph.edges){
        const sourceNode = idToNode.get(edge.source);
        const targetNode = idToNode.get(edge.target);
    
        if (sourceNode && targetNode) {
          this.graph.get(sourceNode)?.push({node: targetNode,branchPath: edge?.data?.branchPath ?? null});
        }
      }
    }


    private findStartNode(){
        const startNode = this.workflow.graph.nodes.find((n) => n.type === "start")
        return startNode || null
    }

    public async executeWorkflow(){
        const queue: Node[] = []
        if(!this.startNode){
            throw new Error("Workflow is invalid no starting node found")
        } 
        queue.push(this.startNode)

        while(queue.length > 0){ 
          const node = queue.shift()
          if(!node){
              throw new Error("Invalid node")
          }
          const result = await this.processNode(node)

          const children = this.graph.get(node) ?? [];

          if (node.type === "condition") {
            const conditionResult = result as ConditionNodeOutput;
            const resultBranch = conditionResult.branch
      
            for (const { node: child, branchPath } of children) {
              if (branchPath === resultBranch) {
                child.data = { ...(child.data ?? {}), previousInput: result };
                queue.push(child);
              }
            }
            continue;
          }
      
          for (const { node: child } of children) {
            child.data = { ...(child.data ?? {}), previousInput: result };
            queue.push(child);
          }
        }
    }

    async processNode(node:Node){
        const nodeId = node.id;
        const nodeType = node.type;
        const input:AgentNodeOutput = node.data?.previousInput ?? null;

        this.emit({
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
                result  = { text: "", data: {} };
                break;
        
              case "weather_agent":
                result = await runWeatherAgent(node.data?.userPrompt ?? "", input);
                break;
        
              case "summarizer_agent":
                result = await runSummarizer(node.data?.userPrompt ?? "", input);
                break;

              case "condition":
                const {variable, operator, value} = node.data
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
                  data:{}
                }
                throw new Error("Unsupported node type: " + node.type);
            }
        
            this.emit({
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
            this.emit({
              type: "node:error",
              executionId: this.executionId,
              workflowId: this.workflowId,
              userId: this.userId,
              nodeId,
              nodeType,
              error: err.message,
              timestamp: Date.now(),
            });
        
            throw err;
        }
    }

}


import { Workflow,Node } from "@/app/api/workflow/route";
import { runWeatherAgent, runSummarizer } from "./agents";


export type WorkflowExecutorEvent =
  | {
      type: "node:start";
      executionId: string;
      userId: string;
      workflowId: string;
      nodeId: string;
      nodeType: string;
      input?: any;
      timestamp: number;
    }
  | {
      type: "node:success";
      executionId: string;
      userId: string;
      workflowId: string;
      nodeId: string;
      nodeType: string;
      output: any;
      timestamp: number;
    }
  | {
      type: "node:error";
      executionId: string;
      userId: string;
      workflowId: string;
      nodeId: string;
      nodeType: string;
      error: string;
      timestamp: number;
    }
  | {
      type: "workflow:complete";
      executionId: string;
      userId: string;
      workflowId: string;
      timestamp: number;
    }
  | {
      type: "workflow:failed";
      executionId: string;
      userId: string;
      workflowId: string;
      error: string;
      timestamp: number;
    };

export class WorkflowExecutor{
    private workflowId:string;
    private userId:string;
    private workflow:Workflow;
    private graph:Map<Node,Node[]>;
    private eventChannel:string;
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
        this.graph = new Map<Node,Node[]>()
        this.eventChannel = process.env.WORKFLOW_EVENT_CHANNEL || ""
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
              this.graph.get(sourceNode)?.push(targetNode);
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
            const res = await this.processNode(node)

			const children = this.graph.get(node) ?? []
			for(const child of children){
                if(child.data){
                    child.data["previousInput"] = res
                    queue.push(child)
                }
			}
        }
    }

    async processNode(node:Node){
        const nodeId = node.id;
        const nodeType = node.type;
        const input = node.data?.previousInput ?? null;

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
            let output;
        
            switch (node.type) {
              case "start":
                output = "";
                break;
        
              case "weather_agent":
                output = await runWeatherAgent(node.data?.userPrompt ?? "", input);
                break;
        
              case "summarizer_agent":
                output = await runSummarizer(node.data?.userPrompt ?? "", input);
                break;
        
              default:
                throw new Error("Unsupported node type: " + node.type);
            }
        
            this.emit({
              type: "node:success",
              executionId: this.executionId,
              workflowId: this.workflowId,
              userId: this.userId,
              nodeId,
              nodeType,
              output,
              timestamp: Date.now(),
            });
        
            return output;
        
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

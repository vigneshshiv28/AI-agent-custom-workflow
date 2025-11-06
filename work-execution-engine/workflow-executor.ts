
import { Workflow,Node } from "@/app/api/workflow/route";
import { runWeatherAgent, runSummarizer } from "./agents";

export class WorkflowExecutor{
    private workflow:Workflow;
    private redis: any; 
    private graph:Map<Node,Node[]>;
    private startNode: Node | null = null;
    
    constructor(workflow: Workflow, redis:any){
        this.workflow = workflow
        this.redis = redis
        this.graph = new Map<Node,Node[]>()

        this.startNode = this.findStartNode()

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

        switch(node.type){
            case "start":
                console.log("executing start node")
                return ""
                
            case "weather_agent":
                console.log("executing weather agent node")
                
                const weatherResult = await runWeatherAgent(
                    node.data?.userPrompt ?? "",
                    node.data?.previousInput ?? ""
                  );

                console.log("weather result",weatherResult)
                return weatherResult
                
            case "summarizer_agent":
                console.log("executing summarizer agent node")
                const summarizerResult  = await runSummarizer(
                    node.data?.userPrompt ?? "",
                    node.data?.previousInput ?? ""
                )
                console.log("summary result",summarizerResult)
                return summarizerResult
                
            case "Conditional":
                console.log("executing conditional node")
                break
            default:
                throw new Error("Invalid Node type")
        }
    }
}


import { Workflow,Node } from "@/app/api/workflow/route";

class WorkflowExecutor{
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
        const startNode = this.workflow.graph.nodes.find((n) => n.type === "Start")
        return startNode || null
    }

    async executeWorkflow(){
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
            await this.processNode(node)

			const children = this.graph.get(node) ?? []
			for(const child of children){
				queue.push(child)
			}
        }
    }

    async processNode(node:Node){

        switch(node.type){
            case "Start":
                console.log("executing start node")
            case "Agent":
                console.log("executing agent node")
            case "Conditional":
                console.log("executing conditional node")
        }

        setTimeout(()=>{
            console.log("Processed node successfully" )
        },5000)


    }
}

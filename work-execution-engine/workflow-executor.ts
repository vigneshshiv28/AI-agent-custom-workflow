
import { Workflow,Node } from "@/app/api/workflow/route";

class WorkflowExecutor{
    private workflow:Workflow;
    private redis: any; 
    private graph:Map<Node,Node[]>;
    
    constructor(workflow: Workflow, redis:any){
        this.workflow = workflow
        this.redis = redis
        this.graph = new Map<Node,Node[]>()
    }

    private constructGraph(workflow:Workflow){
        
    }
}

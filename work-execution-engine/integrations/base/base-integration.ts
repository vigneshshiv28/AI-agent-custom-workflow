import { Node } from "@/schema/workflow";
import { AgentNodeOutput, ConditionNodeOutput, ExecutionContext } from "../../type";


export abstract class BaseIntegration {
  abstract readonly nodeType: string;

  abstract execute(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext
  ): Promise<AgentNodeOutput | ConditionNodeOutput>;
}

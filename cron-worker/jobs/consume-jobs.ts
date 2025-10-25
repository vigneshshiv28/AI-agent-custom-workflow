import redis from "@/lib/db/redis";


async function execute_workflow(workflow:any){
    setTimeout(()=>{
        console.log("executing workflow...",workflow.workflowId)
    },5000)

    console.log("worklow executed")
}


async function initializeConsumerGroup() {
    try {

      try {
        await redis.xinfo("STREAM", STREAM_KEY);
      } catch (error) {

        await redis.xadd(STREAM_KEY, "*", "init", "true");
        console.log(`Stream ${STREAM_KEY} created`);
      }
  

      try {
        await redis.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "0", "MKSTREAM");
        console.log(`Consumer group ${GROUP_NAME} created`);
      } catch (error: any) {
   
        if (error.message && error.message.includes("BUSYGROUP")) {
          console.log(`Consumer group ${GROUP_NAME} already exists`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error initializing consumer group:", error);
      throw error;
    }
  }

const STREAM_KEY = "workflow:queue"
const WORKERS_COUNT = 10
const GROUP_NAME = "workflow:consumer:group"


async function worker(workerId: number){
    const consumerName = `worker-${workerId}`
    try {
        while(true){
            const messages:Array<any> = await redis.xreadgroup(
                "GROUP",GROUP_NAME,consumerName,
                "COUNT",1,
                "BLOCK",5000,
                "STREAMS",STREAM_KEY,">"
            )

            if (messages && messages.length > 0) {
                for (const [streamId, entries] of messages) {
                  for (const [messageId, rawFields] of entries) {
 
                    const fields: any = {};
                    for (let i = 0; i < rawFields.length; i += 2) {
                      fields[rawFields[i]] = rawFields[i + 1];
                    }
                    
                  
                    const { event, data } = fields;
                    const parsedData = JSON.parse(data);
                    
                    console.log(`[Worker ${workerId}] Processing:`, {
                      messageId,
                      event,
                      userId: parsedData.userId,
                      workflowId: parsedData.workflowId,
                      scheduleId: parsedData.scheduleId
                    });
                    
                    
                    await execute_workflow(parsedData);
                    
                    
                    await redis.xack(STREAM_KEY, GROUP_NAME, messageId);
                  }
                }
              }
        }

    }catch(error){
        console.log(error)
    }

}

await initializeConsumerGroup();

const workers = Array.from(
    { length: WORKERS_COUNT },
    (_, i) => worker(i + 1)
)

await Promise.all(workers)


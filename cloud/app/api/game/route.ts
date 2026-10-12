import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { handleGameRequest } from "../../../game/cloud-api.mjs";
import { gameConfig } from "../../../game/config";
export async function GET(request:Request){return handleGameRequest(request,await getChatGPTUser(),env.DB,gameConfig);}
export async function POST(request:Request){return handleGameRequest(request,await getChatGPTUser(),env.DB,gameConfig);}

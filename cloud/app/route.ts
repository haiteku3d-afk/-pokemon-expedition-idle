import { GAME_HTML } from "../game/html";
export function GET() { return new Response(GAME_HTML, {headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}}); }

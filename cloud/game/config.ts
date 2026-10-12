import catalogData from "./catalog.json";
import moves from "./moves.json";
import chart from "./type-chart.json";
import evolutions from "./evolutions.json";
import { configureCombat, makeRoutes } from "./engine.mjs";
import { configureEvolution } from "./evolution.mjs";
const catalog=catalogData.map(p=>({...p,bst:p.stats.reduce((a,b)=>a+b,0)}));
configureCombat(catalog,moves);configureEvolution(catalog,evolutions);
export const gameConfig={catalog,byId:Object.fromEntries(catalog.map(p=>[p.id,p])),routes:makeRoutes(catalog),chart};

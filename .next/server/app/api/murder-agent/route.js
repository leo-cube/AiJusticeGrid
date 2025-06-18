(()=>{var e={};e.id=3255,e.ids=[3255],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3873:e=>{"use strict";e.exports=require("path")},4507:(e,t,n)=>{"use strict";n.r(t),n.d(t,{patchFetch:()=>b,routeModule:()=>g,serverHooks:()=>A,workAsyncStorage:()=>w,workUnitAsyncStorage:()=>y});var i={};n.r(i),n.d(i,{POST:()=>f});var r=n(6559),s=n(8088),o=n(7719),a=n(2190),c=n(9646),d=n(3873),l=n.n(d),u=n(9021),p=n.n(u);let m=process.env.NEXT_PUBLIC_AUGMENT_AI_API_KEY||"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";async function h(e,t){try{let n={case_id:t?.caseId||`case_${Date.now()}`,date_of_crime:t?.crimeDate||new Date().toISOString().split("T")[0],time_of_crime:t?.crimeTime||"Unknown",location:t?.location||"Unknown",victim_name:t?.victimName||"Unknown",victim_age:t?.victimAge||"Unknown",victim_gender:t?.victimGender||"Unknown",cause_of_death:t?.causeOfDeath||"Unknown",weapon_used:t?.weaponUsed||"Unknown",crime_scene_description:t?.crimeSceneDescription||"Unknown",witnesses:t?.witnesses||"None",evidence_found:t?.evidence||"None",suspects:t?.suspects||"None",additional_notes:e},i=l().join(process.cwd(),"Agent");if(!p().existsSync(i))return console.error("Agent folder not found"),v(e,t);if("true"===process.env.USE_MOCK_MURDER_AGENT)return console.log("Using mock Murder Agent response"),function(e,t){let n=t?.caseId||"unknown case",i=t?.victimName||"the victim",r=`# Murder Case Analysis: ${n}

`;r+="**[LIVE DATA ANALYSIS]**\n\n",e.toLowerCase().includes("tell me about this")?r+=`## Case Overview

This is a murder investigation involving ${i}. The case is currently active and requires immediate attention. Based on preliminary findings, this appears to be a premeditated crime with specific forensic evidence that needs to be analyzed.

## Key Evidence

- Weapon: ${t?.weaponUsed||"Unknown"}
- Time of Crime: ${t?.crimeTime||"Unknown"}
- Location: ${t?.location||"Unknown"}

## Recommended Actions

1. Secure the crime scene and collect all available evidence
2. Interview all witnesses and potential suspects
3. Establish a detailed timeline of events
4. Conduct forensic analysis of all collected evidence
`:e.toLowerCase().includes("evidence")?r+=`## Evidence Analysis

The evidence in this case includes ${t?.evidence||"items that are still being processed"}. All evidence should be carefully documented and analyzed for fingerprints, DNA, and other forensic markers.

Forensic analysis should prioritize:

1. DNA analysis of biological samples
2. Fingerprint comparison
3. Ballistic analysis (if applicable)
4. Digital evidence recovery

The chain of custody must be maintained at all times to ensure admissibility in court.`:e.toLowerCase().includes("suspect")?r+=`## Suspect Analysis

Based on the information available, ${t?.suspects||"potential suspects"} should be thoroughly investigated. Focus on individuals with:

- Motive: Financial gain, personal conflicts, or other incentives
- Opportunity: Access to the crime scene and victim
- Means: Ability to commit the crime

Background checks, alibi verification, and interview strategies should be prioritized.`:e.toLowerCase().includes("type")&&e.toLowerCase().includes("murder")?r+=`## Murder Classification

Based on the evidence collected so far, this case appears to be a ${Math.random()>.5?"premeditated":"crime of passion"} homicide. The method and circumstances suggest ${Math.random()>.5?"careful planning":"an emotional trigger"}.

The investigation should focus on establishing:

1. The exact timeline leading up to the murder
2. The relationship between victim and potential perpetrators
3. Any history of conflicts or threats
4. Physical evidence that can confirm the method and timing

This classification may evolve as more evidence is collected.`:r+=`## Case Analysis

This murder case requires a comprehensive investigation approach. Based on the details provided for ${n}, I recommend:

1. Establish a clear timeline of events before and after the crime
2. Analyze all physical evidence collected from the scene
3. Interview all witnesses and persons of interest
4. Develop a profile of the victim to identify potential motives
5. Cross-reference with similar cases for potential patterns

The investigation should remain open to all possibilities as new evidence emerges.`;let s=new Date().getTime(),o=Math.floor(1e3*Math.random());return r+=`

<!-- Response ID: ${s}-${o} -->`}(e,t);let r=l().join(i,`temp_case_${Date.now()}.json`);return p().writeFileSync(r,JSON.stringify(n,null,2)),Promise.race([new Promise((e,t)=>{let n,s="win32"===process.platform?["py","python3","python"]:["python3","python"],o="";for(let e of s)try{n=(0,c.spawn)(e,[l().join(i,"murder_agent_main.py"),"--case_file",r,"--api_key",m]);break}catch(t){o+=`Failed to spawn Python process with ${e}: ${t}
`}if(!n)return void t(Error(`Failed to spawn Python process: ${o}`));let a="",d="";n.stdout.on("data",e=>{a+=e.toString()}),n.stderr.on("data",e=>{d+=e.toString()}),n.on("close",n=>{try{p().unlinkSync(r)}catch(e){console.error("Error deleting temporary file:",e)}if(0===n){let t=a.match(/MURDER AGENT ANALYSIS\n=+\n([\s\S]*?)(?:=+|$)/);t&&t[1]?e(t[1].trim()):e(a.trim())}else console.error(`Python process exited with code ${n}`),console.error("Error output:",d),t(Error(`Murder Agent process failed with code ${n}`))}),n.on("error",e=>{console.error("Error spawning Python process:",e);try{p().unlinkSync(r)}catch(e){console.error("Error deleting temporary file:",e)}t(e)})}),new Promise((e,t)=>{setTimeout(()=>{t(Error("Murder Agent process timed out after 15000ms"))},15e3)})]).catch(n=>(console.error("Murder Agent error:",n),v(e,t)))}catch(n){return console.error("Error running Murder Agent:",n),v(e,t)}}function v(e,t){let n="I'm unable to connect to the Murder Agent backend at the moment. ";t?.caseId&&(n+=`Regarding case ${t.caseId}: `),e.toLowerCase().includes("evidence")?n+="Based on the available information, the evidence should be carefully analyzed for fingerprints, DNA, and other forensic markers. Consider the timeline of events and potential witness testimonies.":e.toLowerCase().includes("suspect")?n+="The investigation should focus on individuals with motive, opportunity, and means. Background checks and alibis should be verified.":e.toLowerCase().includes("weapon")?n+="The weapon used in this case appears to be consistent with the injuries observed. Forensic analysis may provide more details on the specific type and origin.":e.toLowerCase().includes("type")&&e.toLowerCase().includes("murder")?n+="Without access to the full case details, I can only provide general guidance. Murder cases are typically classified based on intent, method, and relationship between victim and perpetrator. A thorough investigation is needed to determine the specific type in this case.":n+="This case requires thorough investigation following standard homicide protocols. Gather all evidence, interview witnesses, and establish a timeline of events.";let i=new Date().getTime(),r=Math.floor(1e3*Math.random());return n+`

<!-- Response ID: ${i}-${r} -->`}async function f(e){try{let t=await e.json();if(!t.question)return a.NextResponse.json({error:"Missing required field: question"},{status:400});let n=await h(t.question,t.context);return a.NextResponse.json({response:n},{status:200})}catch(e){return console.error("Error processing Murder Agent request:",e),a.NextResponse.json({error:"Failed to process Murder Agent request"},{status:500})}}let g=new r.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/murder-agent/route",pathname:"/api/murder-agent",filename:"route",bundlePath:"app/api/murder-agent/route"},resolvedPagePath:"/home/leojamescharles/Desktop/aijusticegrid/jun13/newbackend/logesh4/AiJusticeGrid/src/app/api/murder-agent/route.ts",nextConfigOutput:"standalone",userland:i}),{workAsyncStorage:w,workUnitAsyncStorage:y,serverHooks:A}=g;function b(){return(0,o.patchFetch)({workAsyncStorage:w,workUnitAsyncStorage:y})}},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9021:e=>{"use strict";e.exports=require("fs")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},9646:e=>{"use strict";e.exports=require("child_process")}};var t=require("../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),i=t.X(0,[4447,580],()=>n(4507));module.exports=i})();
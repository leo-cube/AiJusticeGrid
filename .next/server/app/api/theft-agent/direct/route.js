(()=>{var e={};e.id=8955,e.ids=[8955],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6178:(e,t,s)=>{"use strict";s.r(t),s.d(t,{patchFetch:()=>m,routeModule:()=>d,serverHooks:()=>h,workAsyncStorage:()=>u,workUnitAsyncStorage:()=>p});var r={};s.r(r),s.d(r,{POST:()=>l});var n=s(6559),i=s(8088),o=s(7719),a=s(2190);let c="https://aijusticegrid-1.onrender.com/api/augment/theft";async function l(e){try{let t=await e.json();if(!t.question)return a.NextResponse.json({error:"Missing required field: question"},{status:400});let s=t.question,r=t.context,n={question:s,additional_notes:s};r&&(r.caseId&&(n.case_id=r.caseId),r.victimName&&(n.victim_name=r.victimName),r.suspectName&&(n.suspect_name=r.suspectName),r.crimeLocation&&(n.crime_location=r.crimeLocation),r.crimeDate&&(n.crime_date=r.crimeDate),r.stolenItems&&(n.stolen_items=r.stolenItems),r.estimatedValue&&(n.estimated_value=r.estimatedValue),r.theftMethod&&(n.theft_method=r.theftMethod),r.evidenceList&&(n.evidence_list=r.evidenceList),r.witnessStatements&&(n.witness_statements=r.witnessStatements),r.additionalNotes&&(n.additional_notes=r.additionalNotes)),console.log("Calling Theft Agent backend directly from Next.js API route:",c);let i=new AbortController,o=setTimeout(()=>i.abort(),15e3);try{let e=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n),signal:i.signal});if(clearTimeout(o),!e.ok)throw Error(`Theft Agent API error: ${e.statusText}`);let t=await e.json();return a.NextResponse.json({response:t.analysis||t.response||"No response from Theft Agent"})}catch(e){if(clearTimeout(o),console.error("Error calling Theft Agent API:",e),"AbortError"===e.name)return a.NextResponse.json({response:"The Theft Agent is taking too long to respond. Please try again later."});return a.NextResponse.json({response:function(e,t){let s=t?.caseId||"unknown case",r=t?.stolenItems||"the stolen items",n=`# Theft Case Analysis

`;return e.toLowerCase().includes("what")&&e.toLowerCase().includes("stolen")?n+=`Based on the initial investigation, the following items were reported stolen:

- ${r||"Various personal belongings"}
- Estimated value: ${t?.estimatedValue||"Under assessment"}

We are currently working on recovering these items and tracking their potential location.`:e.toLowerCase().includes("suspect")||e.toLowerCase().includes("who")?n+=`## Suspect Analysis

Based on the evidence collected so far, we have the following suspect profile:

- Likely an opportunistic thief familiar with the area
- Possibly has prior experience with similar thefts
- May have been monitoring the location before the theft

We are currently reviewing security footage and witness statements to identify potential suspects.`:e.toLowerCase().includes("evidence")?n+=`## Evidence Summary

The following evidence has been collected from the scene:

- Partial fingerprints on entry points
- Security camera footage (currently being analyzed)
- Witness statements from nearby residents

The forensic team is processing this evidence to identify the perpetrator.`:n+=`I'm analyzing case ${s} regarding the theft of ${r}.

Based on the information provided, this appears to be a ${t?.theftMethod||"standard theft"} case. We are currently investigating all leads and processing evidence from the scene.

Our team is working diligently to recover the stolen items and identify the perpetrator. Please provide any additional details that might help with the investigation.`,n}(s,r)})}}catch(e){return console.error("Error processing Theft Agent request:",e),a.NextResponse.json({response:"Sorry, there was an error processing your request. Please try again later."})}}let d=new n.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/theft-agent/direct/route",pathname:"/api/theft-agent/direct",filename:"route",bundlePath:"app/api/theft-agent/direct/route"},resolvedPagePath:"/home/leojamescharles/Desktop/aijusticegrid/jun13/newbackend/logesh4/AiJusticeGrid/src/app/api/theft-agent/direct/route.ts",nextConfigOutput:"standalone",userland:r}),{workAsyncStorage:u,workUnitAsyncStorage:p,serverHooks:h}=d;function m(){return(0,o.patchFetch)({workAsyncStorage:u,workUnitAsyncStorage:p})}},6487:()=>{},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[4447,580],()=>s(6178));module.exports=r})();
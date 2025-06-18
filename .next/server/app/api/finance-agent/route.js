(()=>{var e={};e.id=768,e.ids=[768],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2390:(e,n,t)=>{"use strict";t.r(n),t.d(n,{patchFetch:()=>w,routeModule:()=>f,serverHooks:()=>y,workAsyncStorage:()=>g,workUnitAsyncStorage:()=>v});var r={};t.r(r),t.d(r,{POST:()=>m});var s=t(6559),i=t(8088),o=t(7719),a=t(2190),c=t(9646),u=t(9021),d=t(3873);async function p(e,n){try{let t={case_id:n?.caseId||`case_${Date.now()}`,date_of_incident:n?.crimeDate||new Date().toISOString().split("T")[0],time_of_discovery:n?.crimeTime||"Unknown",financial_institution:n?.location||"Unknown",victim_name:n?.victimName||"Unknown",account_type:n?.victimAge||"Unknown",account_number:n?.victimGender||"Unknown",fraud_type:n?.causeOfDeath||"Unknown",amount_involved:n?.weaponUsed||"Unknown",method_used:n?.crimeSceneDescription||"Unknown",suspicious_activity:n?.suspects||"Unknown",evidence_collected:n?.evidenceFound||"Unknown",suspects:n?.witnesses||"Unknown",additional_notes:n?.additionalNotes||e},r=d.join(process.cwd(),"Agents","Agent","FinancialAgent"),s=process.env.AUGMENT_AI_API_KEY||"default-key";if("true"===process.env.USE_MOCK_FINANCE_AGENT)return console.log("Using mock Finance Agent response"),l(e,n);let i=d.join(r,`temp_case_${Date.now()}.json`);return u.writeFileSync(i,JSON.stringify(t,null,2)),Promise.race([new Promise((e,n)=>{let t,o="win32"===process.platform?["py","python3","python"]:["python3","python"],a="";for(let e of o)try{t=(0,c.spawn)(e,[d.join(r,"financial_fraud_agent_main.py"),"--case_file",i,"--api_key",s]);break}catch(n){a+=`Failed to spawn Python process with ${e}: ${n}
`}if(!t)return void n(Error(`Failed to spawn Python process: ${a}`));let p="",l="";t.stdout.on("data",e=>{p+=e.toString()}),t.stderr.on("data",e=>{l+=e.toString()}),t.on("close",t=>{try{u.unlinkSync(i)}catch(e){console.warn("Failed to clean up temporary file:",e)}0===t?e(p.trim()||"Finance Agent analysis completed successfully."):n(Error(`Finance Agent process exited with code ${t}. Error: ${l}`))}),t.on("error",e=>{try{u.unlinkSync(i)}catch(e){console.warn("Failed to clean up temporary file:",e)}n(Error(`Failed to start Finance Agent process: ${e.message}`))})}),new Promise((e,n)=>{setTimeout(()=>{n(Error("Finance Agent process timed out"))},15e3)})])}catch(t){return console.error("Error in getFinanceAgentResponse:",t),l(e,n)}}function l(e,n){let t=n?.caseId||"FRAUD-001",r=n?.causeOfDeath||"Credit Card Fraud",s=n?.weaponUsed||"$5,000";return`# FINANCIAL FRAUD CASE ANALYSIS

**Case ID:** ${t}
**Fraud Type:** ${r}
**Amount Involved:** ${s}

## CASE OVERVIEW
This appears to be a ${r} case involving financial losses of ${s}. Based on the information provided, this requires immediate investigation and response.

## INVESTIGATIVE RECOMMENDATIONS
1. **Immediate Actions:**
   - Secure all affected accounts
   - Preserve digital evidence
   - Contact relevant financial institutions

2. **Evidence Collection:**
   - Transaction logs and timestamps
   - IP addresses and device information
   - Communication records

3. **Recovery Strategies:**
   - Work with financial institutions for fund recovery
   - File appropriate reports with authorities
   - Implement enhanced security measures

## PREVENTION MEASURES
- Enhanced authentication protocols
- Regular account monitoring
- Employee/customer education programs
- Advanced fraud detection systems

---
*This analysis is based on the provided case details and standard financial fraud investigation protocols.*

**Question Asked:** ${e}`}async function m(e){try{let n=await e.json();if(!n.question)return a.NextResponse.json({error:"Missing required field: question"},{status:400});let t=await p(n.question,n.context);return a.NextResponse.json({response:t},{status:200})}catch(e){return console.error("Error processing Finance Agent request:",e),a.NextResponse.json({error:"Failed to process Finance Agent request"},{status:500})}}process.env.NEXT_PUBLIC_FINANCE_AGENT_API_URL;let f=new s.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/finance-agent/route",pathname:"/api/finance-agent",filename:"route",bundlePath:"app/api/finance-agent/route"},resolvedPagePath:"/home/leojamescharles/Desktop/aijusticegrid/jun13/newbackend/logesh4/AiJusticeGrid/src/app/api/finance-agent/route.ts",nextConfigOutput:"standalone",userland:r}),{workAsyncStorage:g,workUnitAsyncStorage:v,serverHooks:y}=f;function w(){return(0,o.patchFetch)({workAsyncStorage:g,workUnitAsyncStorage:v})}},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3873:e=>{"use strict";e.exports=require("path")},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9021:e=>{"use strict";e.exports=require("fs")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},9646:e=>{"use strict";e.exports=require("child_process")}};var n=require("../../../webpack-runtime.js");n.C(e);var t=e=>n(n.s=e),r=n.X(0,[4447,580],()=>t(2390));module.exports=r})();
(()=>{var e={};e.id=7690,e.ids=[7690],e.modules={185:(e,t,n)=>{"use strict";n.r(t),n.d(t,{patchFetch:()=>m,routeModule:()=>l,serverHooks:()=>f,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>p});var a={};n.r(a),n.d(a,{POST:()=>u});var i=n(6559),s=n(8088),r=n(7719),o=n(2190);let c="https://aijusticegrid-1.onrender.com/api/augment/financial-fraud";async function u(e){try{let t=await e.json();if(!t.question)return o.NextResponse.json({error:"Missing required field: question"},{status:400});let n=t.question,a=t.context,i={question:n,additional_notes:n};a&&(a.caseId&&(i.case_id=a.caseId),a.victimName&&(i.victim_name=a.victimName),a.suspectName&&(i.suspect_name=a.suspectName),a.fraudType&&(i.fraud_type=a.fraudType),a.fraudAmount&&(i.fraud_amount=a.fraudAmount),a.fraudDate&&(i.fraud_date=a.fraudDate),a.financialInstitution&&(i.financial_institution=a.financialInstitution),a.transactionDetails&&(i.transaction_details=a.transactionDetails),a.evidenceList&&(i.evidence_list=a.evidenceList),a.additionalNotes&&(i.additional_notes=a.additionalNotes)),console.log("Calling Financial Fraud Agent backend directly from Next.js API route:",c);let s=new AbortController,r=setTimeout(()=>s.abort(),15e3);try{let e=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i),signal:s.signal});if(clearTimeout(r),!e.ok)throw Error(`Financial Fraud Agent API error: ${e.statusText}`);let t=await e.json();return o.NextResponse.json({response:t.analysis||t.response||"No response from Financial Fraud Agent"})}catch(e){if(clearTimeout(r),console.error("Error calling Financial Fraud Agent API:",e),"AbortError"===e.name)return o.NextResponse.json({response:"The Financial Fraud Agent is taking too long to respond. Please try again later."});return o.NextResponse.json({response:function(e,t){let n=t?.caseId||"unknown case",a=t?.fraudType||"financial fraud",i=t?.fraudAmount||"undetermined amount",s=`# Financial Fraud Analysis

`;return e.toLowerCase().includes("transaction")||e.toLowerCase().includes("money")?s+=`## Transaction Analysis

I've analyzed the transaction patterns in this case and found the following:

- Suspicious transactions totaling ${i}
- Unusual pattern of transfers to multiple accounts
- Transactions occurred outside normal business hours

These patterns are consistent with typical ${a} schemes. I recommend freezing the suspicious accounts and initiating a full audit trail.`:e.toLowerCase().includes("suspect")||e.toLowerCase().includes("who")?s+=`## Suspect Profile

Based on the financial data analysis, the suspect likely:

- Has insider knowledge of financial systems
- Used sophisticated methods to conceal the transactions
- May be connected to other similar fraud cases

We should cross-reference this profile with known financial fraud perpetrators in our database.`:e.toLowerCase().includes("evidence")||e.toLowerCase().includes("proof")?s+=`## Evidence Summary

The following evidence has been collected for this case:

- Digital transaction records from ${t?.financialInstitution||"the financial institution"}
- IP address logs from online banking sessions
- Email communications related to the transactions

This evidence is being analyzed by our digital forensics team to establish a clear chain of events.`:s+=`I'm analyzing case ${n} regarding ${a} involving ${i}.

This appears to be a sophisticated financial fraud scheme targeting ${t?.victimName||"the victim"}. The perpetrator used several techniques to conceal their activities, including:

1. Multiple small transactions to avoid detection thresholds
2. Routing through several accounts to obscure the money trail
3. Using legitimate-looking communications to gain trust

I recommend a comprehensive financial audit and freezing any suspicious accounts while we continue our investigation.`,s}(n,a)})}}catch(e){return console.error("Error processing Financial Fraud Agent request:",e),o.NextResponse.json({response:"Sorry, there was an error processing your request. Please try again later."})}}let l=new i.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/financial-fraud-agent/direct/route",pathname:"/api/financial-fraud-agent/direct",filename:"route",bundlePath:"app/api/financial-fraud-agent/direct/route"},resolvedPagePath:"/home/leojamescharles/Desktop/aijusticegrid/jun13/newbackend/logesh4/AiJusticeGrid/src/app/api/financial-fraud-agent/direct/route.ts",nextConfigOutput:"standalone",userland:a}),{workAsyncStorage:d,workUnitAsyncStorage:p,serverHooks:f}=l;function m(){return(0,r.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:p})}},846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[4447,580],()=>n(185));module.exports=a})();
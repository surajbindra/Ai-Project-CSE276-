const VENUES = [
  {id:"AUD-01",name:"Shanti Mithal Devi Auditorium",type:"Auditorium",capacity:800,equipment:["Stage","Sound System","Projector","Lighting"],location:"LPU campus",description:"Closed-roof auditorium with stage, sound system, projector and lighting. Student power sockets are not available."},
  {id:"OT-01",name:"LPU Open Theatre",type:"Outdoor Ground",capacity:700,equipment:[],location:"LPU campus",description:"Open-air theatre with brick seating and a flat area that can be used as a stage."},
  {id:"CG-01",name:"LPU Cricket Ground",type:"Outdoor Ground",capacity:2000,equipment:[],location:"LPU campus",description:"Large open cricket ground with a flat playing area."},
  {id:"GYM-01",name:"LPU Gym",type:"Classroom",capacity:50,equipment:[],location:"LPU campus",description:"Indoor sports venue for badminton, basketball and volleyball competitions. Maximum listed capacity: 50 students."},
  {id:"POOL-01",name:"LPU Swimming Pool",type:"Outdoor Ground",capacity:null,equipment:[],location:"LPU campus",description:"Olympic-size swimming pool. Automatically assigned to swimming events."},
  {id:"LH-01",name:"LPU Lecture Hall",type:"Seminar Hall",capacity:200,equipment:["Projector","Sound System","Computers"],location:"LPU campus",description:"Closed lecture hall with projector, speakers and power sockets at each desk."},
  {id:"MLH-01",name:"LPU Mini Lecture Hall",type:"Seminar Hall",capacity:90,equipment:["Projector","Computers"],location:"LPU campus",description:"Closed mini lecture hall with projector and power sockets at each desk."},
  {id:"AUD-02",name:"LPU Auditorium (near Uni-Hospital)",type:"Auditorium",capacity:100,equipment:["Projector","Sound System"],location:"Near Uni-Hospital",description:"Closed-roof auditorium with projector and sound system."},
  {id:"UM-01",name:"Uni-Mall Basement",type:"Classroom",capacity:50,equipment:[],location:"Uni-Mall",description:"Closed-roof basement venue."},
  {id:"FG-01",name:"LPU Football Ground",type:"Outdoor Ground",capacity:null,equipment:[],location:"LPU campus",description:"Regular-size football ground. Automatically assigned to football games."},
  {id:"HG-01",name:"LPU Helipad Ground",type:"Outdoor Ground",capacity:1500,equipment:[],location:"LPU campus",description:"Open ground with a listed capacity of more than 1,500 people."},
  {id:"UP-01",name:"Uni-Polis",type:"Auditorium",capacity:1000,equipment:["Stage"],location:"LPU campus",description:"Closed-roof venue with a stage."},
  {id:"CL-01",name:"Computer Lab",type:"Computer Lab",capacity:40,equipment:["Computers","Projector"],location:"LPU campus",description:"Closed room equipped with 40 computers and a projector."}
];

const TEAM_MEMBERS = [
  {name:"Suraj Kumar Bindra",role:"Project Lead",description:"Led the overall project planning, requirement analysis, and coordination of team activities for the AI-based University Event Scheduling and Venue Allocation System.",photo:"Suraj photo.png"},
  {name:"Yashika Varshney",role:"AI & Algorithm Developer",description:"Designed and implemented AI-based search algorithms (BFS, DFS, A* and CSP) for intelligent venue selection using constraint-based filtering and penalty-based ranking.",photo:"",initials:"M2"},
  {name:"Arman Nayak",role:"Frontend Developer",description:"Designed and developed a responsive, user-friendly web interface using HTML, CSS, and JavaScript for seamless event scheduling and venue booking.",photo:"Arman photo.jpeg"},
  {name:"Poojitha",role:"Research & Documentation",description:"Prepared comprehensive project documentation, including the final project report, PowerPoint presentation (PPT), system workflow, algorithm explanations, and technical specifications.",photo:"Poojitha Photo.jpeg"}
];

const POLICY_DOCUMENTS = [
  {source:"Sample Event Policy · Section 1",text:"Event organizers should submit a venue request with the event name, date, time, expected attendance and required facilities before the event."},
  {source:"Sample Event Policy · Section 2",text:"The expected attendance must not exceed the approved capacity of the selected venue. Organizers should use a venue with sufficient seating and safe occupancy."},
  {source:"Sample Event Policy · Section 3",text:"Events requiring audio visual equipment, computers, stage facilities or other resources should mention those requirements when requesting a venue."},
  {source:"Sample Event Policy · Section 4",text:"Events that need to continue beyond the permitted campus hours may require additional approval from the relevant university authority. Confirm the applicable rule with the administration."},
  {source:"Sample Event Policy · Section 5",text:"A venue should not be allocated to more than one event during overlapping time periods. Booking confirmation should be checked against the current venue schedule."}
];

const STORAGE_KEY = "campusplan_bookings_v1";
const $ = (id) => document.getElementById(id);
let lastSearchRequest = null;

function getBookings(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");}catch(e){return [];} }
function saveBookings(items){ localStorage.setItem(STORAGE_KEY,JSON.stringify(items)); }
function timeToMinutes(value){const [h,m]=value.split(":").map(Number);return h*60+m;}
function overlaps(aStart,aEnd,bStart,bEnd){return aStart < bEnd && bStart < aEnd;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function localDateToday(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}

function initialize(){
  $("eventDate").min=localDateToday();
  $("eventDate").value=localDateToday();
  $("year").textContent=new Date().getFullYear();
  VENUES.forEach(v=>{const o=document.createElement("option");o.value=v.id;o.textContent=v.name;$("preferredVenue").appendChild(o);});
  renderTeam();
  $("eventForm").addEventListener("submit",handleSearch);
  $("menuToggle").addEventListener("click",()=>{const nav=$("mainNav");nav.classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",nav.classList.contains("open")?"true":"false");});
  document.querySelectorAll(".main-nav a").forEach(a=>a.addEventListener("click",()=>{$("mainNav").classList.remove("open");$("menuToggle").setAttribute("aria-expanded","false");}));
  $("backToPlanner").addEventListener("click",showMain);
  $("newBooking").addEventListener("click",()=>{showMain();$("eventForm").reset();$("eventDate").value=localDateToday();$("resultsSection").classList.add("hidden");window.scrollTo({top:$("planner").offsetTop-80,behavior:"smooth"});});
  $("askPolicy").addEventListener("click",answerPolicy);
  $("policyQuestion").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();answerPolicy();}});
}

function renderTeam(){
  $("teamGrid").innerHTML=TEAM_MEMBERS.map(member=>{
    const photo=member.photo?`<img src="${escapeHTML(member.photo)}" alt="${escapeHTML(member.name)}" onerror="this.remove()">`: "";
    return `<article class="team-card"><div class="team-photo">${photo||escapeHTML(member.initials||"")}</div><h3>${escapeHTML(member.name)}</h3><div class="team-role">${escapeHTML(member.role)}</div><p>${escapeHTML(member.description)}</p></article>`;
  }).join("");
}

function readRequest(){
  const form=$("eventForm");
  if(!form.reportValidity())return null;
  const req={
    eventName:$("eventName").value.trim(),
    date:$("eventDate").value,
    attendees:Number($("attendees").value),
    start:$("startTime").value,
    end:$("endTime").value,
    venueType:$("venueType").value,
    preferredVenue:$("preferredVenue").value,
    equipment:[...document.querySelectorAll('input[name="equipment"]:checked')].map(x=>x.value)
  };
  if(!req.eventName){alert("Please enter an event name.");return null;}
  if(req.end<=req.start){alert("End time must be later than start time.");return null;}
  if(req.date<localDateToday()){alert("Please select today or a future date.");return null;}
  return req;
}

// Special sports events are routed to their designated campus venue.
function getSpecialVenue(req){
  const name=req.eventName.toLowerCase();
  if(/\b(football|soccer)\b/.test(name)) return {id:"FG-01",label:"football"};
  if(/\b(swimming|swim)\b/.test(name)) return {id:"POOL-01",label:"swimming"};
  if(/\b(badminton|basket\s*ball|basketball|volleyball)\b/.test(name)) return {id:"GYM-01",label:"indoor sports"};
  return null;
}
function hasBookingConflict(venue,req,bookings){
  return bookings.some(b=>b.venueId===venue.id&&b.date===req.date&&
    overlaps(timeToMinutes(req.start),timeToMinutes(req.end),timeToMinutes(b.start),timeToMinutes(b.end)));
}
function evaluateVenueRequirements(venue,req){
  const reasons=[];
  if(Number.isFinite(venue.capacity)&&venue.capacity<req.attendees) reasons.push("capacity");
  if(req.venueType!=="Any"&&req.venueType!==venue.type) reasons.push("venue type");
  const missing=req.equipment.filter(item=>!venue.equipment.includes(item));
  if(missing.length) reasons.push("equipment");
  return {valid:reasons.length===0,reasons};
}
function evaluateVenueState(venue,req,bookings){
  const requirements=evaluateVenueRequirements(venue,req);
  if(!requirements.valid) return {valid:false,reasons:requirements.reasons,conflict:false};
  const conflict=hasBookingConflict(venue,req,bookings);
  if(conflict) return {valid:false,reasons:["time conflict"],conflict:true};
  let penalty=Number.isFinite(venue.capacity)?Math.max(0,venue.capacity-req.attendees)*0.035:0;
  if(req.preferredVenue&&venue.id!==req.preferredVenue) penalty+=12;
  return {valid:true,penalty:Number(penalty.toFixed(2)),reasons:[],conflict:false};
}
function estimateVenuePenalty(venue,req,special){
  let penalty=Number.isFinite(venue.capacity)
    ?Math.max(0,venue.capacity-req.attendees)*0.035:0;
  if(!special&&req.preferredVenue&&venue.id!==req.preferredVenue) penalty+=12;
  return penalty;
}

// Search one event-allocation variable across the available venue domain.
// BFS and DFS differ in frontier order; A* uses the estimated penalty as h(n);
// CSP uses recursive backtracking and prunes a venue as soon as a hard rule fails.
function searchVenues(req,algorithm="CSP"){
  const bookings=getBookings();
  const special=getSpecialVenue(req);
  const candidates=special?VENUES.filter(v=>v.id===special.id):[...VENUES];
  const valid=[];
  let statesExplored=0,pruned=0,requirementMatches=0,conflicts=0;
  const started=performance.now();

  function inspect(index){
    statesExplored++;
    const venue=candidates[index];
    const requirements=special
      ?{valid:!Number.isFinite(venue.capacity)||venue.capacity>=req.attendees,
        reasons:Number.isFinite(venue.capacity)&&venue.capacity<req.attendees?["capacity"]:[]}
      :evaluateVenueRequirements(venue,req);

    // Hard constraints are checked before availability and soft preferences.
    if(!requirements.valid){pruned++;return;}
    requirementMatches++;
    if(hasBookingConflict(venue,req,bookings)){conflicts++;pruned++;return;}

    valid.push({venue,penalty:Number(estimateVenuePenalty(venue,req,!!special).toFixed(2)),reasons:[]});
  }

  const mode=String(algorithm||"CSP").toUpperCase();
  if(mode==="BFS"){
    // Breadth-first traversal of the one-level venue assignment state tree.
    const queue=candidates.map((_,index)=>index);
    let head=0;
    while(head<queue.length) inspect(queue[head++]);
  }else if(mode==="DFS"){
    // Depth-first traversal; reverse push preserves the inventory's original order.
    const stack=candidates.map((_,index)=>index).reverse();
    while(stack.length) inspect(stack.pop());
  }else if(mode==="ASTAR"||mode==="A*"){
    // A* prioritizes the estimated soft penalty. g(n)=0 for this single-event task.
    const frontier=candidates.map((venue,index)=>({index,g:0,h:estimateVenuePenalty(venue,req,!!special)}));
    while(frontier.length){
      frontier.sort((a,b)=>(a.g+a.h)-(b.g+b.h));
      inspect(frontier.shift().index);
    }
  }else{
    // CSP backtracking: assign the event to one venue, prune failed constraints,
    // then backtrack to try the next venue in the domain.
    function backtrack(index){
      if(index>=candidates.length)return;
      inspect(index);
      backtrack(index+1);
    }
    backtrack(0);
  }

  // Present the best-fit options consistently, regardless of exploration order.
  valid.sort((a,b)=>a.penalty-b.penalty||((a.venue.capacity??Infinity)-(b.venue.capacity??Infinity)));
  const elapsedMs=Number((performance.now()-started).toFixed(3));
  const message=!valid.length
    ?(requirementMatches>0&&conflicts===requirementMatches
      ?"Sorry, Venue Unavailable at that Time"
      :"No Venue Satisfy Your Requirement")
    :"";
  return {valid,statesExplored,pruned,algorithm:mode,elapsedMs,message,specialEvent:!!special};
}
function compareVenueAlgorithms(req){return ["BFS","DFS","ASTAR","CSP"].map(algorithm=>searchVenues(req,algorithm));}
function handleSearch(event){
  event.preventDefault();const req=readRequest();if(!req)return;
  lastSearchRequest=req;
  // The configured engine runs automatically; users do not choose an algorithm.
  const result=searchVenues(req,"CSP");
  renderResults(req,result);
}
function renderResults(req,result){
  $("resultsSection").classList.remove("hidden");
  $("resultsTitle").textContent=result.valid.length?"Your best-fit venue options":result.message;
  $("resultsSubtitle").textContent=result.valid.length
    ?(result.specialEvent?"This event is routed to its designated sports venue.":"Valid venues are ranked from lowest to highest penalty.")
    :"Please review the event requirements or choose another date or time.";
  $("searchMetrics").innerHTML=`<div class="metric"><strong>${result.valid.length}</strong><span>SUITABLE VENUES</span></div><div class="metric"><strong>${result.statesExplored}</strong><span>OPTIONS CHECKED</span></div><div class="metric"><strong>${result.elapsedMs} ms</strong><span>SEARCH TIME</span></div>`;
  if(!result.valid.length){
    $("venueResults").innerHTML=`<div class="no-results"><h3>${escapeHTML(result.message)}</h3><p>${result.message==="Sorry, Venue Unavailable at that Time"?"The required venue already has a booking that overlaps your selected date and time. Please choose another time or date.":"No campus venue meets all the mandatory requirements you selected. Try changing the attendance, venue type or equipment requirements."}</p></div>`;
  }else{
    $("venueResults").innerHTML=result.valid.map((item,index)=>{
      const v=item.venue;
      const capacityText=Number.isFinite(v.capacity)?`Capacity: ${v.capacity}`:"Capacity: Not specified";
      return `<article class="venue-card ${index===0?"best":""}">
        <div class="venue-card-top"><span class="venue-type">${escapeHTML(v.type)}</span>${index===0?'<span class="best-label">★ BEST MATCH</span>':""}</div>
        <h3>${escapeHTML(v.name)}</h3><p class="venue-desc">${escapeHTML(v.description)}</p>
        <div class="venue-facts"><span>${capacityText}</span><span>${escapeHTML(v.location)}</span>${v.equipment.map(e=>`<span>${escapeHTML(e)}</span>`).join("")}</div>
        <div class="venue-card-bottom"><div class="penalty"><strong>${item.penalty.toFixed(2)}</strong><small>Penalty score · lower is better</small></div><button class="button button-primary book-button" data-venue="${v.id}">Book venue <span>→</span></button></div>
      </article>`;
    }).join("");
    document.querySelectorAll(".book-button").forEach(btn=>btn.addEventListener("click",()=>bookVenue(btn.dataset.venue)));
  }
  $("resultsSection").scrollIntoView({behavior:"smooth",block:"start"});
}

function bookVenue(venueId){
  if(!lastSearchRequest)return;
  const venue=VENUES.find(v=>v.id===venueId);if(!venue)return;
  // Recheck immediately before saving to catch a booking made after the search in this browser.
  const req=lastSearchRequest;
  const conflict=getBookings().some(b=>b.venueId===venue.id&&b.date===req.date&&overlaps(timeToMinutes(req.start),timeToMinutes(req.end),timeToMinutes(b.start),timeToMinutes(b.end)));
  if(conflict){alert("Sorry, Venue Unavailable at that Time");renderResults(req,searchVenues(req,"CSP"));return;}
  const booking={
    id:"CP-"+Date.now().toString(36).toUpperCase().slice(-6),
    eventName:req.eventName,venueId:venue.id,venueName:venue.name,date:req.date,start:req.start,end:req.end,
    attendees:req.attendees,equipment:req.equipment,createdAt:new Date().toISOString(),status:"Demo booking saved"
  };
  const bookings=getBookings();bookings.push(booking);saveBookings(bookings);showConfirmation(booking);
}

function showConfirmation(b){
  $("confirmationId").textContent=b.id;
  const rows=[
    ["Event",b.eventName],["Venue",b.venueName],["Date",new Date(b.date+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"})],
    ["Time",`${b.start} – ${b.end}`],["Attendees",b.attendees],["Equipment",b.equipment.length?b.equipment.join(", "):"No additional equipment"],["Status",b.status]
  ];
  $("confirmationDetails").innerHTML=rows.map(([k,v])=>`<div class="detail-cell"><span>${escapeHTML(k.toUpperCase())}</span><strong>${escapeHTML(v)}</strong></div>`).join("");
  $("home").classList.add("hidden");$("confirmationPage").classList.remove("hidden");window.scrollTo(0,0);
}
function showMain(){$("confirmationPage").classList.add("hidden");$("home").classList.remove("hidden");window.scrollTo(0,0);}

function answerPolicy(){
  const question=$("policyQuestion").value.trim();if(!question){$("policyQuestion").focus();return;}
  const terms=question.toLowerCase().match(/[a-z0-9]+/g)||[];
  const ranked=POLICY_DOCUMENTS.map(doc=>{
    const text=doc.text.toLowerCase();let score=0;
    terms.forEach(term=>{if(term.length>2&&text.includes(term))score+=1;});
    return {...doc,score};
  }).sort((a,b)=>b.score-a.score);
  const best=ranked[0];
  if(!best||best.score===0){
    $("policyAnswer").innerHTML=`<span class="answer-mark">✦</span><p>I couldn't find a close match in the sample policy passages. Please check the official university policy or contact the relevant administration. <span class="policy-source">No supporting passage retrieved</span></p>`;
  }else{
    $("policyAnswer").innerHTML=`<span class="answer-mark">✦</span><p>${escapeHTML(best.text)}<span class="policy-source">Retrieved from: ${escapeHTML(best.source)} · Sample content</span></p>`;
  }
}

document.addEventListener("DOMContentLoaded",initialize);

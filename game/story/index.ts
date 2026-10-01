import {
  toRoman,
  type Chapter,
  type EnemyStory,
  type Story,
} from "../contracts";

const enemy = (
  name: string,
  title: string,
  domain: string,
  intro: string[],
  struck: string[],
  taunt: string[],
  defeat: string[],
  triumph: string[],
): EnemyStory => ({ name, title, domain, intro, struck, taunt, defeat, triumph });

const EPITHETS = [
  "The Inherited Question",
  "A Blade Recompiled",
  "The Patient Ascent",
  "Lessons Under Load",
  "The Uncached Road",
  "An Heir with Context",
  "The Tested Edge",
  "A Better Failure",
] as const;

const EPIGRAPHS = [
  "The Codex remembers what pride would discard.",
  "A repeated question deserves a deeper answer.",
  "The castle changes less than the climber.",
  "Name the tradeoff, and the locked door gains a hinge.",
  "The surest answer includes the case where it fails.",
  "An old mistake becomes a new instrument.",
  "No retry is wasted when its result is recorded.",
] as const;

const MILESTONES: Record<number, Omit<Chapter, "numeral">> = {
  5: { title: "The Fifth Commit", epigraph: "What survives five climbs is no accident." },
  10: { title: "The Decennial Door", epigraph: "Ten heirs have made one answer precise." },
  20: { title: "The Long Review", epigraph: "The bloodline now sees patterns where it once saw walls." },
  42: { title: "The Answer and Its Caveat", epigraph: "The number is easy. Defending it is the interview." },
  50: { title: "The Golden Regression", epigraph: "Old victories still deserve a test." },
  100: { title: "The Century of Questions", epigraph: "A hundred climbs have made uncertainty speak clearly." },
  1000: { title: "The Thousandth Heir", epigraph: "At this scale, even legend requires observability." },
};

function chapter(bloodline: number): Chapter {
  const n = Math.max(1, Math.floor(bloodline));
  const numeral = toRoman(n);
  if (n === 1) {
    return { numeral, title: "Recognition", epigraph: "First, learn the shape of the question." };
  }
  if (n === 2) {
    return { numeral, title: "Application", epigraph: "Now choose the tool before the tool chooses you." };
  }
  if (n === 3) {
    return { numeral, title: "Tradeoffs", epigraph: "A strong answer names what it spends." };
  }
  const milestone = MILESTONES[n];
  if (milestone) return { numeral, ...milestone };
  return {
    numeral,
    title: EPITHETS[n % EPITHETS.length],
    epigraph: EPIGRAPHS[(n * 17 + 3) % EPIGRAPHS.length],
  };
}

export const STORY: Story = {
  title: "Bloodline: The Interview Castle",
  tagline: "The castle repeats its questions. Your bloodline does not repeat its mistakes.",
  prologue: [
    "Where the black sea meets the shore, a castle rises to test every engineer.",
    "Its guardians were climbers once, until they stopped learning and became what they feared.",
    "At the summit waits the Crown Examiner, who has never accepted an answer learned by rote.",
    "You carry a blade for courage and a Codex for every mistake courage cannot hide.",
    "If you fall, an heir will take both and begin again beneath the same patient walls.",
    "The Bloodline counts those climbs, and each generation inherits the truth of the last.",
    "Victory is not one perfect interview. It is a lineage that grows wiser whenever it fails.",
  ],
  chapter,
  enemies: {
    sentinel: enemy(
      "Foothill Sentinel",
      "Keeper of First Structures",
      "Tests arrays, hash maps, sets, indexes, and the patterns built from them.",
      [
        "Every summit begins at index zero. Show me you know where the array ends.",
        "Bloodline {bloodline}, choose your structure before you swing it.",
        "Maps remember by key. Arrays remember by place. What do you remember?",
        "The foothills punish no one. They merely expose weak foundations.",
      ],
      [
        "A direct lookup. Clean, constant on average, and correctly qualified.",
        "You found the complement without searching every pair.",
        "Good. The index moved, and your reason moved with it.",
        "A set, because membership was the question. Precise.",
        "You saw the edge at n minus one. Many fall one step later.",
      ],
      [
        "You chose order when you needed membership. Write that distinction down.",
        "One past the boundary is still outside it.",
        "A hash map is not magic. Ask what the key buys you.",
        "You scanned what could have been addressed.",
        "The Codex has room. Record the assumption you skipped.",
      ],
      [
        "Your foundation holds. The higher questions may now lean on it.",
        "The foothills yield to Bloodline {bloodline}. Climb with your invariants intact.",
        "You named the structure and the reason. That is enough to pass.",
      ],
      [
        "The first structures outlast another climber. Your heir will know why.",
        "Return when array, map, and set are choices rather than charms.",
        "A weak foundation is useful news. The Codex will reinforce it.",
      ],
    ),
    warden: enemy(
      "Gate Warden",
      "Master of Arrival and Return",
      "Tests stacks, queues, traces, BFS frontiers, and disciplined ordering.",
      [
        "Last challenge in, first challenge out. I am afraid you arrived last.",
        "Queue at the gate. Bloodline {bloodline} will be served in arrival order.",
        "Push your claim. I shall pop its assumptions.",
        "The gate opens only for those who can trace every step by hand.",
      ],
      [
        "Correct. Your answer arrived first, so it leaves first.",
        "A stack for undo. The newest mistake departs before the oldest.",
        "You traced the top, not merely the definition.",
        "BFS keeps a queue. Proper frontier etiquette.",
        "Your reasoning is balanced: push, pop, and no item misplaced.",
      ],
      [
        "You cut the queue. Even errors must wait their turn.",
        "That answer belongs at the bottom of the stack.",
        "You said LIFO, then traced FIFO. The gate notices order.",
        "A stack would make that search deep, not broad.",
        "First in, first corrected. Put this miss in the Codex.",
      ],
      [
        "The queue is empty. The gate may open.",
        "You have popped my last objection.",
        "Bloodline {bloodline} departs in the proper order: onward.",
      ],
      [
        "Your turn ends here. The next heir is already enqueued.",
        "I return your blade to the top of the family stack.",
        "The gate remains. Fortunately, so does the trace in your Codex.",
      ],
    ),
    architect: enemy(
      "The Architect",
      "Builder of Consequences",
      "Tests system design, scale, failure modes, capacity, and explicit tradeoffs.",
      [
        "A design without load is a sketch. Tell me how many requests arrive.",
        "Bloodline {bloodline}, what do you optimize, and what will you spend?",
        "Every wall is a tradeoff made load-bearing. Defend yours.",
        "Begin with requirements. Premature towers collapse elegantly.",
      ],
      [
        "You priced the capacity before buying the machinery.",
        "A queue absorbs the burst, provided you bound its hunger.",
        "Good. You named consistency and the place you can afford lag.",
        "Idempotency makes the retry safe. Now it is architecture.",
        "You found the bottleneck instead of decorating the diagram.",
      ],
      [
        "You added a cache and forgot the day it lies.",
        "More replicas do not repair shared state.",
        "Your queue is infinite only on the whiteboard.",
        "You promised exactly once without naming the mechanism.",
        "A number without units is a turret without stairs.",
      ],
      [
        "The design stands because you admitted where it bends.",
        "Your capacity holds. Pass through the yard.",
        "Bloodline {bloodline} has paid for its tradeoffs honestly.",
      ],
      [
        "The load exceeded your assumptions. Excellent data for the rebuild.",
        "Your diagram survives only in fair weather. Send the Codex into the storm.",
        "An heir will inherit the requirement you forgot to ask.",
      ],
    ),
    refactorer: enemy(
      "The Refactorer",
      "Editor of the Essential",
      "Tests names, cohesion, tests, boundaries, errors, and code that reveals intent.",
      [
        "Your answer has a vague name and three responsibilities. Begin again.",
        "Bloodline {bloodline}, remove the noise until intent remains.",
        "If the function needs an apology, it needs a smaller function.",
        "I test behavior. Your private call graph may keep its secrets.",
      ],
      [
        "That name carries its own explanation.",
        "One responsibility. One reason to change. Good.",
        "You deleted the comment and clarified the code. Cleaner.",
        "The failure can no longer hide inside null.",
        "You tested the edge, not the implementation detail.",
      ],
      [
        "Process what? Name the act.",
        "That comment repeats the code, only less reliably.",
        "You removed duplication and joined two unrelated rules.",
        "An empty catch is a locked room where errors disappear.",
        "The test knows too much about how and too little about what.",
      ],
      [
        "Nothing more to remove. The stair is clear.",
        "Your code now says what it means without raising its voice.",
        "Bloodline {bloodline} leaves this function better named than it found it.",
      ],
      [
        "The mess won this review. Your heir receives actionable comments.",
        "Return after splitting the answer along its reasons to change.",
        "The Codex keeps the diff. The next version can be smaller.",
      ],
    ),
    puzzlewright: enemy(
      "The Puzzlewright",
      "Jester of Moving Parts",
      "Tests algorithms by making you run, trace, and repair them.",
      [
        "A riddle! Better still, it has indexes you can get wrong.",
        "Bloodline {bloodline}, shall we race the pointers or trip over them?",
        "No lucky letters here. Move each value and show your work.",
        "I built a tiny machine. Tell me where it jams.",
      ],
      [
        "Click! The pointer lands exactly where you promised.",
        "You found the invariant. The trick has nowhere left to hide.",
        "Splendid trace. Even the boring middle step was correct.",
        "The heap keeps only the winners. Ruthless and efficient!",
        "You cut the search space without cutting away the answer.",
      ],
      [
        "Almost! The finest distance between correct and wrong.",
        "Your loop has found immortality. It has not found the answer.",
        "You moved both pointers and lost your invariant.",
        "A charming guess. Now trace it.",
        "Off by one: the traditional unit of puzzlewright measurement.",
      ],
      [
        "Solved! I shall make the next mechanism less polite.",
        "My gears concede. Your reasoning did not skip a tooth.",
        "Bloodline {bloodline} wins the game beneath the game.",
      ],
      [
        "The machine still turns, and you are briefly part of it.",
        "A failed trace is merely a solution with excellent annotations.",
        "Bring me your heir. I have moved one pointer.",
      ],
    ),
    latency: enemy(
      "Lady Latency",
      "Duchess of the Critical Path",
      "Tests web performance, perceived speed, design tokens, and component boundaries.",
      [
        "You have 100 milliseconds to earn my attention. Forty have passed.",
        "Bloodline {bloodline}, your first paint is late.",
        "The user is waiting. Explain why this byte blocks anything.",
        "A component needs a boundary before it needs another prop.",
      ],
      [
        "Fast. The below-fold image can wait with everyone else.",
        "You reserved the space. Zero surprise, fewer shifts.",
        "A token, not forty copies of blue. Efficient.",
        "The component owns itself; the page owns its placement.",
        "You removed bytes the screen could never display.",
      ],
      [
        "Two hundred milliseconds. An eternity with a progress bar.",
        "You optimized the server and left the user staring at a blank page.",
        "That image is larger than the wall displaying it.",
        "A design system is not a folder full of disagreements.",
        "You moved the boundary, not the bottleneck.",
      ],
      [
        "Acceptable. The path opened before I finished complaining.",
        "Your critical path is finally worthy of the name.",
        "Bloodline {bloodline} may proceed. Quickly.",
      ],
      [
        "Timeout. Your heir may begin before the spinner stops.",
        "The page arrived after the decision to leave.",
        "Record every blocking millisecond. I will count them next climb.",
      ],
    ),
    shipwright: enemy(
      "The Shipwright",
      "Captain of the Safe Release",
      "Tests CI, delivery, probes, stateless services, automation, and rollback.",
      [
        "A change aboard! Show me the pipeline, the probe, and the way back.",
        "Bloodline {bloodline}, can this release survive a failed retry?",
        "Green on your laptop is cargo, not delivery.",
        "Before we sail, point to the rollback.",
      ],
      [
        "Tests before deploy. The cheapest wreck is the one that stays in port.",
        "Readiness removes traffic; liveness restarts the dead. Correct.",
        "Stateless pods: any deckhand can take the next request.",
        "The step is idempotent. Retry without multiplying damage.",
        "Small release, visible metrics, reversible course.",
      ],
      [
        "You used liveness to punish a healthy process for a sick dependency.",
        "No rollback? Then that was not a release plan.",
        "The pipeline passed by skipping the test. A swift voyage to the reef.",
        "Local disk on a replaceable pod is cargo left on a sinking deck.",
        "Your retry delivered the same package twice.",
      ],
      [
        "All checks green. Cast off.",
        "The release holds, and the rollback remains mercifully unused.",
        "Bloodline {bloodline} ships with evidence, not hope.",
      ],
      [
        "Rollback complete. The Codex contains the postmortem.",
        "The voyage failed safely. That is still engineering.",
        "Your heir inherits a red pipeline and a precise place to begin.",
      ],
    ),
    cartographer: enemy(
      "The Cartographer",
      "Surveyor of Meaning",
      "Tests domain boundaries, model claims, data leakage, and where language changes.",
      [
        "Here, Customer means payer. Beyond that line, it means caller.",
        "Bloodline {bloodline}, show me where this word stops being true.",
        "A shared noun can conceal two incompatible maps.",
        "Your model draws a border. Tell me what lies beyond its claim.",
      ],
      [
        "Two contexts, translated at the border. The map remains honest.",
        "You found the consistency boundary around the aggregate.",
        "The vendor's nouns stop at the gate. Good.",
        "You saw the label hiding in the features.",
        "Training fit is not a passport to unseen country.",
      ],
      [
        "You unified the spelling and erased the meaning.",
        "That model memorized the map and failed the terrain.",
        "The label is in the input. Even prophecy calls that leakage.",
        "Your transaction crosses three borders without papers.",
        "A vendor renamed one field and your whole kingdom moved.",
      ],
      [
        "The boundary is drawn. Both sides may now speak precisely.",
        "Your model claims no more territory than its evidence supports.",
        "Bloodline {bloodline} leaves with an honest map.",
      ],
      [
        "You crossed a context without translating. The Codex marks the border.",
        "The map was confident and wrong. Your heir gets both coordinates.",
        "Return when the same word is allowed to mean two things.",
      ],
    ),
    examiner: enemy(
      "The Crown Examiner",
      "The Last Interviewer",
      "Tests traces, design tradeoffs, code judgment, and the reasoning that joins them.",
      [
        "Sit. I know the memorized answer. I am asking whether you do.",
        "Bloodline {bloodline}. Your ancestors left unusually useful notes.",
        "Give me the answer, the assumption, and the case that breaks both.",
        "The crown is not a prize. It is the weight of explaining clearly.",
      ],
      [
        "Correct, and more importantly, justified.",
        "You named the invariant before touching the code.",
        "That tradeoff is defensible under the stated load.",
        "You found the bug without rewriting the question.",
        "Precise. Continue.",
      ],
      [
        "That is the common answer. It is not yet an argument.",
        "You have described the happy path with admirable confidence.",
        "Which assumption permits that claim?",
        "The mechanism is missing. Name it.",
        "No. Record why, then try the next question without fear.",
      ],
      [
        "Accepted. Not because you knew everything, but because you knew what you did not.",
        "The crown yields to Bloodline {bloodline}. The castle will ask harder questions.",
        "You have passed this interview. Keep the Codex open.",
      ],
      [
        "The interview ends. The learning does not.",
        "I reject this answer, not the engineer who gave it.",
        "Send your heir. I will ask the same question more precisely.",
      ],
    ),
  },
  npcs: {
    mentor: {
      name: "The Senior",
      lines: [
        "Ask before you are stuck. Context shared early is cheaper than rescue shared late.",
        "I will not answer for you. I will point at the assumption doing the most damage.",
        "Say the problem aloud, then tell me what you have already ruled out.",
        "A senior is not an oracle. I have simply collected more expensive mistakes.",
        "When you ask for help, bring evidence. When you give it, leave dignity.",
      ],
    },
    merchant: {
      name: "Mara of Many Heirs",
      lines: [
        "I remember your face. It belonged to someone with fewer scars.",
        "Gear survives a bloodline. Taste, regrettably, must be learned again.",
        "I sold your ancestor a shield. They used it on a null check.",
        "Gold returns. A well-chosen tool returns value.",
      ],
    },
    duck: {
      name: "Quackson",
      lines: [
        "Quack.",
        "Start at the beginning. What did you expect, and what happened instead?",
        "Interesting. You changed your story halfway through explaining it.",
        "Quack. There is the bug.",
        "I accept payment in breadcrumbs and reproducible cases.",
      ],
    },
    ghost: {
      name: "The Blameless Ghost",
      lines: [
        "Git blame says I wrote it. History says three outages were standing behind me.",
        "The line has an author. The system has causes.",
        "Read the commit message before summoning the dead.",
        "I haunt this yard because someone force-pushed my alibi.",
        "Fix forward, write down why, and let old names rest.",
      ],
    },
  },
  merchant: {
    greet: [
      "Mara serves every generation. The family discount remains imaginary.",
      "Bloodline {bloodline}! Your credit is ancestral; your gold is not.",
      "Tools for sale. Wisdom still requires assembly.",
      "Back again? The castle has excellent customer retention.",
    ],
    bought: [
      "Sold. May it fail only where documented.",
      "A fine choice. Your ancestors eventually agreed.",
      "Take it. I warranty neither courage nor edge cases.",
      "The gold is mine; the improved odds are yours.",
    ],
    broke: [
      "Your purse returned null. Unlike some code, I handled it.",
      "Not enough gold. The price has strong consistency.",
      "I accept coin, not optimistic concurrency.",
      "Come back richer or with a compelling funding round.",
    ],
    owned: [
      "Already owned. Even I refuse to sell the same state twice.",
      "Your bloodline kept that one. Inheritance occasionally works.",
      "Duplicate purchase rejected. Mara's shop is idempotent.",
    ],
    farewell: [
      "Climb carefully. Returns are easier than resurrections.",
      "May your next answer have fewer hidden costs.",
      "Go. The castle charges more than I do.",
    ],
  },
  items: {
    armor: { name: "Scale of Resolve", flavor: "Gear whose every tier adds one max heart to the climb." },
    shield: { name: "First-Failure Shield", flavor: "Gear that blocks the first miss in each duel." },
    lens: { name: "Principle Lens", flavor: "Gear that makes every Hint name the principle beneath the problem." },
    hourglass: { name: "Borrowed Hourglass", flavor: "Gear granting one more Extra time charge each climb." },
    seal: { name: "Senior's Seal", flavor: "Gear granting one more Ask a senior charge each climb." },
    potion: { name: "Red Retry", flavor: "A consumable that restores one heart, then empties." },
    scroll: { name: "Margin Scroll", flavor: "A consumable granting one more Hint for this climb." },
    sand: { name: "Second Sand", flavor: "A consumable granting one more Extra time for this climb." },
    note: { name: "Escalation Note", flavor: "A consumable granting one more Ask a senior for this climb." },
  },
  signs: {
    shore: ["THE SHORE", "Every bloodline begins where the previous one left its questions."],
    gate: ["THE GATE", "Stacks enter from the top. Queues form to the left."],
    yard: ["THE YARD", "State requirements before constructing castles in the air."],
    stair: ["THE STAIR", "Leave each step cleaner than the name you found on it."],
    west: ["WEST TOWER", "Algorithms in motion. Tracing paper strongly advised."],
    east: ["EAST TOWER", "Specialist on rotation. Expertise has more than one border."],
    throne: ["THE THRONE", "Answers without reasoning will be returned to sender."],
    shop: ["MARA'S INHERITABLE GOODS", "No refunds across bloodlines. Gear transfers automatically."],
    pond: ["THE POND", "Three laps are excessive. Therefore someone will do them."],
    "hello-world": ["Hello, World.", "The first program reached the last corner of the shore."],
  },
  eggs: {
    konami: { title: "Ancestral Input", lines: ["The castle recognizes an old sequence.", "+30 gold"] },
    sudo: {
      title: "Elevated Privileges",
      lines: ["The castle doubts your authority, then checks the exact spelling.", "+10 gold; Hint charges refilled."],
    },
    "rubber-duck": {
      title: "Duck-Driven Development",
      lines: ["Quackson joins the bloodline's debugging practice.", "Every climb starts with one extra Hint."],
    },
    "hello-world": { title: "First Words", lines: ["A hidden sign answers.", "+10 gold"] },
    "off-by-one": {
      title: "Past the End",
      lines: ["You found the tile at index length. Please do not read from it.", "+15 gold"],
    },
    "infinite-loop": {
      title: "Eventual Termination",
      lines: ["Three pond laps prove the loop had a break after all.", "+15 gold"],
    },
    "git-blame": {
      title: "Blameless History",
      lines: ["The ghost accepts context in place of accusation.", "+10 gold"],
    },
    "forty-two": {
      title: "The Follow-Up Question",
      lines: ["Forty-two answers later, the castle asks for your assumptions.", "+42 gold"],
    },
  },
  stageClear: {
    foothills: "The sentinel lowers its blade. The old road to the gate remembers your feet.",
    gate: "Chains withdraw in proper order, and the castle gate admits the next question.",
    yard: "The Architect's plans fold themselves into a stair climbing the inner wall.",
    stair: "Noise falls from the code-carved steps. Two tower doors stand clear.",
    west: "The last mechanism clicks open, releasing a bridge toward the crown.",
    east: "The specialist marks your answer accepted. The eastern bridge reaches the throne.",
    throne: "The crown's locked light opens above the sea, and the whole castle exhales.",
  },
  rebirth: {
    victory: [
      "The crown was won, but the castle has deeper questions. An heir opens the Codex.",
      "Victory enters the Codex beside every miss. A new hand takes up the blade.",
      "The bloodline celebrates once, then sends an heir to test what certainty has hidden.",
    ],
    defeat: [
      "The blade washes ashore beside the Codex. An heir reads the final unfinished line.",
      "The climber falls; the lesson does not. New hands close around the recorded mistake.",
      "Failure becomes data, data becomes inheritance, and an heir faces the castle.",
    ],
  },
  lifelines: {
    hint: [
      "A sentence in the Codex brightens around the missing idea.",
      "The question casts a smaller shadow when its principle is named.",
      "A margin note points toward the invariant, not the answer.",
    ],
    time: [
      "The hourglass turns, lending thought a little more room.",
      "For one breath, the interview waits and the assumptions settle.",
      "Borrowed sand falls slowly. Use it to trace, not to panic.",
    ],
    senior: [
      "The Senior asks which assumption you have not tested.",
      "A practiced voice removes one ambiguity and leaves the decision to you.",
      "The Senior names the seam. You still choose where to cut.",
    ],
  },
};

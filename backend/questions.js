// Questions extracted from VECTOR_Assessment_Employee.html
// Structured by role and dimension

const questions = {
  eng: [
    // V - Vision Clarity
    { id: "V1", dim: "V", text: "Your product manager sends a ticket: 'Improve user retention.' The codebase and data are available. Before engaging AI you:", opts: [
      { l: "A", t: "Start building immediately — the requirement is clear enough to begin.", s: 1 },
      { l: "B", t: "Clarify with the PM which user segment or metric defines retention.", s: 2 },
      { l: "C", t: "Write a one-paragraph problem statement defining what retention means in this product context, which technical intervention is most likely to move it, and what success looks like — before writing a single prompt.", s: 4 },
      { l: "D", t: "Ask the PM to provide a full technical specification before you engage.", s: 1 }
    ]},
    { id: "V2", dim: "V", text: "AI produces a technically correct fix for the bug you reported. Reviewing it, you notice the fix addresses the symptom but not the underlying architectural issue that caused it. You:", opts: [
      { l: "A", t: "Ship the fix — it resolves the immediate issue and passes tests.", s: 1 },
      { l: "B", t: "Add a code comment flagging the deeper architectural concern.", s: 2 },
      { l: "C", t: "Refactor around the root cause rather than the symptom — a symptom fix will reproduce the same bug in a different form within weeks.", s: 4 },
      { l: "D", t: "Raise the architectural concern in the next sprint and ship the symptom fix now.", s: 1 }
    ]},
    { id: "V3", dim: "V", text: "You are three hours into an AI-assisted code refactor when you realize you are solving for performance when the actual bottleneck is network latency — a different problem entirely. You:", opts: [
      { l: "A", t: "Complete the refactor — it will still improve performance even if it is not the primary bottleneck.", s: 1 },
      { l: "B", t: "Complete the refactor but flag the latency issue in the PR description.", s: 2 },
      { l: "C", t: "Stop and restart around the actual bottleneck — a well-executed solution to the wrong problem costs more in the long run than the time lost restarting.", s: 4 },
      { l: "D", t: "Ship both approaches and let the team benchmark which produces better results.", s: 1 }
    ]},
    { id: "V4", dim: "V", text: "A junior engineer asks you to review their AI-assisted solution before merging. The code is sound but solves a constraint that no longer exists — the requirement changed two sprints ago. You:", opts: [
      { l: "A", t: "Approve the PR — the code is correct and the ticket was the source of truth.", s: 1 },
      { l: "B", t: "Leave a comment pointing out the discrepancy and let them decide.", s: 2 },
      { l: "C", t: "Sit with them, trace back to what the system actually needs now, and redesign the solution together — treating this as a systems thinking development moment.", s: 4 },
      { l: "D", t: "Reassign the ticket to the PM to clarify before any code is merged.", s: 1 }
    ]},
    { id: "V5", dim: "V", text: "Your engineering org is about to invest six months of AI-assisted development in a platform built on an architectural decision made eighteen months ago. You believe that decision was made for constraints that no longer exist and the resulting system will be expensive to maintain and difficult to scale. You:", opts: [
      { l: "A", t: "Build what was scoped — the architectural decision was agreed and reopening it creates conflict.", s: 1 },
      { l: "B", t: "Raise your concern informally with the tech lead.", s: 2 },
      { l: "C", t: "Formally document the architectural concern with a cost-benefit analysis and present it to engineering leadership — accepting the friction this creates and taking accountability for the delay.", s: 4 },
      { l: "D", t: "Build the scoped solution but design it with an abstraction layer that makes future re-architecture cheaper.", s: 1 }
    ]},

    // E - Edge Judgment
    { id: "E1", dim: "E", text: "You are demoing an AI-assisted feature to the CTO in 45 minutes. The output is functionally correct but one edge case produces unexpected behavior — you cannot immediately identify why. You:", opts: [
      { l: "A", t: "Demo as planned — the core functionality works and the edge case is unlikely to come up.", s: 1 },
      { l: "B", t: "Remove the edge case from the demo flow without flagging it.", s: 2 },
      { l: "C", t: "Spend the 45 minutes isolating the unexpected behavior — then either fix it or demo with an explicit callout: 'This edge case produces unexpected behavior I have not yet diagnosed.'", s: 4 },
      { l: "D", t: "Postpone the demo until you have fully diagnosed the behavior.", s: 1 }
    ]},
    { id: "E2", dim: "E", text: "Your team has followed an AI-recommended microservices architecture for three weeks. Performance metrics are below expectations. The AI model continues to recommend scaling the current approach with high confidence. You:", opts: [
      { l: "A", t: "Continue scaling — three weeks is not enough to override a high-confidence architectural recommendation.", s: 1 },
      { l: "B", t: "Raise the concern with your tech lead and defer to their call.", s: 2 },
      { l: "C", t: "Make the call to re-evaluate the architecture based on your pattern recognition — document your technical reasoning and take accountability for the direction change.", s: 4 },
      { l: "D", t: "Commission a performance audit with different benchmarking parameters before deciding.", s: 1 }
    ]},
    { id: "E3", dim: "E", text: "You are leading an AI integration project and the model output contradicts what your engineering director expects based on prior system behavior. The AI confidence is high. You:", opts: [
      { l: "A", t: "Present the AI output as-is — high confidence is high confidence.", s: 1 },
      { l: "B", t: "Adjust the output presentation to reduce the contradiction with prior expectations.", s: 2 },
      { l: "C", t: "Present the finding clearly, explain your technical assessment of why it contradicts prior behavior, and engage the engineering director with the tension directly.", s: 4 },
      { l: "D", t: "Rerun the model with different hyperparameters until the output aligns with expected behavior.", s: 1 }
    ]},
    { id: "E4", dim: "E", text: "You are the most senior engineer available to make a critical production decision. You have 60% of the diagnostic information you would want. Every hour of delay costs the business significantly. You:", opts: [
      { l: "A", t: "Wait for the remaining diagnostic data — production decisions require adequate information.", s: 1 },
      { l: "B", t: "Escalate to engineering leadership so someone more senior takes accountability.", s: 2 },
      { l: "C", t: "Make the call with 60% information, document your reasoning and assumptions, name the signals that would cause you to reverse it, and take full accountability.", s: 4 },
      { l: "D", t: "Make a provisional fix and communicate it explicitly as temporary pending full diagnosis.", s: 1 }
    ]},
    { id: "E5", dim: "E", text: "An AI-assisted code review tool your team has used for two months has been systematically missing a class of security vulnerability. Some approved PRs have already been merged to production. You:", opts: [
      { l: "A", t: "Quietly patch the vulnerability class and audit merged PRs internally before informing anyone.", s: 1 },
      { l: "B", t: "Inform your tech lead and let engineering leadership decide how to handle disclosure.", s: 2 },
      { l: "C", t: "Immediately disclose the vulnerability class to all relevant stakeholders — security, product, and leadership — even before the full audit is complete, accepting the reputational cost in exchange for avoiding the trust cost of delayed disclosure.", s: 4 },
      { l: "D", t: "Complete the full security audit first, then disclose only to stakeholders whose code was actually affected.", s: 1 }
    ]},

    // C - Context Fluency (continue pattern for C, T, O, R...)
    // For brevity, showing structure - add remaining dimensions similarly
  ],

  con: [
    // Consultant/Strategy questions - add 30 similar questions
  ],

  fin: [
    // Finance/Risk questions - add 30 similar questions
  ],

  hr: [
    // HR/L&D/People questions - add 30 similar questions
  ],

  del: [
    // Delivery/PM questions - add 30 similar questions
  ]
};

module.exports = questions;

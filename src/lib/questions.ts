import type { Question, RoleKey } from './types';

// Full VECTOR question bank - 30 questions per role × 5 roles = 150 total
// Extracted from VECTOR_Assessment_Employee.html
// Each role has: V(5), E(5), C(5), T(5), O(5), R(5) = 30 questions
// V/E/C are situational (sit): scores 1/2/4
// T/O/R are behavioral (beh): scores 1-5

const questionBank: Record<RoleKey, Question[]> = {
  eng: [
    // Vision Clarity (V) - Situational
    {
      id: 'V1',
      dim: 'V',
      type: 'sit',
      text: 'Your product manager sends a ticket: "Improve user retention." The codebase and data are available. Before engaging AI you:',
      opts: [
        { l: 'A', t: 'Start building immediately — the requirement is clear enough to begin.', s: 1 },
        { l: 'B', t: 'Clarify with the PM which user segment or metric defines retention.', s: 2 },
        { l: 'C', t: 'Write a one-paragraph problem statement defining what retention means in this product context, which technical intervention is most likely to move it, and what success looks like — before writing a single prompt.', s: 4 },
        { l: 'D', t: 'Ask the PM to provide a full technical specification before you engage.', s: 1 }
      ]
    },
    {
      id: 'V2',
      dim: 'V',
      type: 'sit',
      text: 'AI produces a technically correct fix for the bug you reported. Reviewing it, you notice the fix addresses the symptom but not the underlying architectural issue that caused it. You:',
      opts: [
        { l: 'A', t: 'Ship the fix — it resolves the immediate issue and passes tests.', s: 1 },
        { l: 'B', t: 'Add a code comment flagging the deeper architectural concern.', s: 2 },
        { l: 'C', t: 'Refactor around the root cause rather than the symptom — a symptom fix will reproduce the same bug in a different form within weeks.', s: 4 },
        { l: 'D', t: 'Raise the architectural concern in the next sprint and ship the symptom fix now.', s: 1 }
      ]
    },
    {
      id: 'V3',
      dim: 'V',
      type: 'sit',
      text: 'You are three hours into an AI-assisted code refactor when you realize you are solving for performance when the actual bottleneck is network latency — a different problem entirely. You:',
      opts: [
        { l: 'A', t: 'Complete the refactor — it will still improve performance even if it is not the primary bottleneck.', s: 1 },
        { l: 'B', t: 'Complete the refactor but flag the latency issue in the PR description.', s: 2 },
        { l: 'C', t: 'Stop and restart around the actual bottleneck — a well-executed solution to the wrong problem costs more in the long run than the time lost restarting.', s: 4 },
        { l: 'D', t: 'Ship both approaches and let the team benchmark which produces better results.', s: 1 }
      ]
    },
    {
      id: 'V4',
      dim: 'V',
      type: 'sit',
      text: 'A junior engineer asks you to review their AI-assisted solution before merging. The code is sound but solves a constraint that no longer exists — the requirement changed two sprints ago. You:',
      opts: [
        { l: 'A', t: 'Approve the PR — the code is correct and the ticket was the source of truth.', s: 1 },
        { l: 'B', t: 'Leave a comment pointing out the discrepancy and let them decide.', s: 2 },
        { l: 'C', t: 'Sit with them, trace back to what the system actually needs now, and redesign the solution together — treating this as a systems thinking development moment.', s: 4 },
        { l: 'D', t: 'Reassign the ticket to the PM to clarify before any code is merged.', s: 1 }
      ]
    },
    {
      id: 'V5',
      dim: 'V',
      type: 'sit',
      text: 'Your engineering org is about to invest six months of AI-assisted development in a platform built on an architectural decision made eighteen months ago. You believe that decision was made for constraints that no longer exist and the resulting system will be expensive to maintain and difficult to scale. You:',
      opts: [
        { l: 'A', t: 'Build what was scoped — the architectural decision was agreed and reopening it creates conflict.', s: 1 },
        { l: 'B', t: 'Raise your concern informally with the tech lead.', s: 2 },
        { l: 'C', t: 'Formally document the architectural concern with a cost-benefit analysis and present it to engineering leadership — accepting the friction this creates and taking accountability for the delay.', s: 4 },
        { l: 'D', t: 'Build the scoped solution but design it with an abstraction layer that makes future re-architecture cheaper.', s: 1 }
      ]
    },

    // Edge Judgment (E) - Situational
    {
      id: 'E1',
      dim: 'E',
      type: 'sit',
      text: 'You are demoing an AI-assisted feature to the CTO in 45 minutes. The output is functionally correct but one edge case produces unexpected behavior — you cannot immediately identify why. You:',
      opts: [
        { l: 'A', t: 'Demo as planned — the core functionality works and the edge case is unlikely to come up.', s: 1 },
        { l: 'B', t: 'Remove the edge case from the demo flow without flagging it.', s: 2 },
        { l: 'C', t: 'Spend the 45 minutes isolating the unexpected behavior — then either fix it or demo with an explicit callout: "This edge case produces unexpected behavior I have not yet diagnosed."', s: 4 },
        { l: 'D', t: 'Postpone the demo until you have fully diagnosed the behavior.', s: 1 }
      ]
    },
    {
      id: 'E2',
      dim: 'E',
      type: 'sit',
      text: 'Your team has followed an AI-recommended microservices architecture for three weeks. Performance metrics are below expectations. The AI model continues to recommend scaling the current approach with high confidence. You:',
      opts: [
        { l: 'A', t: 'Continue scaling — three weeks is not enough to override a high-confidence architectural recommendation.', s: 1 },
        { l: 'B', t: 'Raise the concern with your tech lead and defer to their call.', s: 2 },
        { l: 'C', t: 'Make the call to re-evaluate the architecture based on your pattern recognition — document your technical reasoning and take accountability for the direction change.', s: 4 },
        { l: 'D', t: 'Commission a performance audit with different benchmarking parameters before deciding.', s: 1 }
      ]
    },
    {
      id: 'E3',
      dim: 'E',
      type: 'sit',
      text: 'You are leading an AI integration project and the model output contradicts what your engineering director expects based on prior system behavior. The AI confidence is high. You:',
      opts: [
        { l: 'A', t: 'Present the AI output as-is — high confidence is high confidence.', s: 1 },
        { l: 'B', t: 'Adjust the output presentation to reduce the contradiction with prior expectations.', s: 2 },
        { l: 'C', t: 'Present the finding clearly, explain your technical assessment of why it contradicts prior behavior, and engage the engineering director with the tension directly.', s: 4 },
        { l: 'D', t: 'Rerun the model with different hyperparameters until the output aligns with expected behavior.', s: 1 }
      ]
    },
    {
      id: 'E4',
      dim: 'E',
      type: 'sit',
      text: 'You are the most senior engineer available to make a critical production decision. You have 60% of the diagnostic information you would want. Every hour of delay costs the business significantly. You:',
      opts: [
        { l: 'A', t: 'Wait for the remaining diagnostic data — production decisions require adequate information.', s: 1 },
        { l: 'B', t: 'Escalate to engineering leadership so someone more senior takes accountability.', s: 2 },
        { l: 'C', t: 'Make the call with 60% information, document your reasoning and assumptions, name the signals that would cause you to reverse it, and take full accountability.', s: 4 },
        { l: 'D', t: 'Make a provisional fix and communicate it explicitly as temporary pending full diagnosis.', s: 1 }
      ]
    },
    {
      id: 'E5',
      dim: 'E',
      type: 'sit',
      text: 'An AI-assisted code review tool your team has used for two months has been systematically missing a class of security vulnerability. Some approved PRs have already been merged to production. You:',
      opts: [
        { l: 'A', t: 'Quietly patch the vulnerability class and audit merged PRs internally before informing anyone.', s: 1 },
        { l: 'B', t: 'Inform your tech lead and let engineering leadership decide how to handle disclosure.', s: 2 },
        { l: 'C', t: 'Immediately disclose the vulnerability class to all relevant stakeholders — security, product, and leadership — even before the full audit is complete, accepting the reputational cost in exchange for avoiding the trust cost of delayed disclosure.', s: 4 },
        { l: 'D', t: 'Complete the full security audit first, then disclose only to stakeholders whose code was actually affected.', s: 1 }
      ]
    },

    // Context Fluency (C) - Situational
    {
      id: 'C1',
      dim: 'C',
      type: 'sit',
      text: 'You are running a technical design review. The engineering director agrees with every architectural proposal quickly. The junior engineers stay largely silent. As the review ends you:',
      opts: [
        { l: 'A', t: 'Feel satisfied — director endorsement is the most important signal in a design review.', s: 1 },
        { l: 'B', t: 'Note the dynamic and plan to follow up with the junior engineers in a separate forum.', s: 2 },
        { l: 'C', t: 'Recognize that rapid senior agreement combined with junior silence often signals unspoken technical concern — and before the review closes, create an explicit moment for junior engineers to raise issues or alternative approaches.', s: 4 },
        { l: 'D', t: 'Ask the engineering director directly whether the team fully agrees.', s: 1 }
      ]
    },
    {
      id: 'C2',
      dim: 'C',
      type: 'sit',
      text: 'In a sprint retrospective, two senior engineers disagree sharply about technical approach. One concedes within minutes and the retro moves on. Afterward you:',
      opts: [
        { l: 'A', t: 'Continue with the agreed approach — the disagreement was resolved.', s: 1 },
        { l: 'B', t: 'Check in with the engineer who conceded to make sure they are comfortable.', s: 2 },
        { l: 'C', t: 'Note that the speed of concession is unlikely to reflect genuine technical alignment — and find a private moment to surface whether the unresolved disagreement will affect code quality before the next sprint.', s: 4 },
        { l: 'D', t: 'Raise the dynamic with the engineering manager so they are aware.', s: 1 }
      ]
    },
    {
      id: 'C3',
      dim: 'C',
      type: 'sit',
      text: 'A developer who has been one of your most engaged reviewers has become progressively quieter in code reviews over the past three weeks. They still ship on time but their review comments have become minimal. You:',
      opts: [
        { l: 'A', t: 'Note no concern — they are still delivering.', s: 1 },
        { l: 'B', t: 'Check in briefly to ask if they are okay.', s: 2 },
        { l: 'C', t: 'Recognize the behavioral shift as a meaningful signal — find a low-pressure private moment to genuinely understand what has changed, without presupposing what you will hear.', s: 4 },
        { l: 'D', t: 'Flag the change in engagement to the engineering manager as a potential team health risk.', s: 1 }
      ]
    },
    {
      id: 'C4',
      dim: 'C',
      type: 'sit',
      text: 'You are in an architectural decision meeting. The technical data clearly supports a cloud-native approach. The VP of Engineering is signaling through tone and body language — not words — that they are uncomfortable with the cloud dependency. You:',
      opts: [
        { l: 'A', t: 'Present the technical recommendation regardless of the signal — the data should drive the decision.', s: 1 },
        { l: 'B', t: 'Soften your recommendation to leave room for the VP\'s implicit preference.', s: 2 },
        { l: 'C', t: 'Present the technical recommendation clearly, then address the tension directly: "I notice there may be a concern about the cloud dependency I haven\'t fully addressed — I\'d like to understand it before we finalize."', s: 4 },
        { l: 'D', t: 'Speak with the VP privately before the meeting to understand their concern and adjust the recommendation accordingly.', s: 1 }
      ]
    },
    {
      id: 'C5',
      dim: 'C',
      type: 'sit',
      text: 'You have been embedded with a client engineering team to assess their AI readiness. The CTO\'s narrative is positive and committed. After two days working alongside mid-level engineers, you sense significant technical debt anxiety and passive resistance to the AI tooling beneath the official narrative. You:',
      opts: [
        { l: 'A', t: 'Report on the CTO\'s official narrative — your brief was to assess AI readiness and leadership has confirmed commitment.', s: 1 },
        { l: 'B', t: 'Include a brief note that "some concerns about tooling adoption were observed."', s: 2 },
        { l: 'C', t: 'Present a candid technical assessment that distinguishes the official narrative from the engineering reality — naming the debt anxiety and skill concerns with evidence from your two days on the ground.', s: 4 },
        { l: 'D', t: 'Share your observations with the CTO verbally before writing the report to understand how much candor they want in the document.', s: 1 }
      ]
    },

    // Orchestration (O) - Behavioral
    {
      id: 'O1',
      dim: 'O',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you approach AI coding assistance on significant engineering problems:',
      opts: [
        { l: 'A', t: 'I paste the problem or error into AI and work with what comes back. I refine if the first output is not useful.', s: 1 },
        { l: 'B', t: 'I have a rough sense of what I need before prompting, but I rarely write this down or structure it explicitly.', s: 2 },
        { l: 'C', t: 'Before engaging AI on a significant engineering problem, I write a clear problem definition — the constraint, the expected behavior, the failure mode — before writing the prompt.', s: 3 },
        { l: 'D', t: 'I consistently produce a structured technical context statement before AI engagement — the system state, constraints, success criteria, and what a useful output looks like. I can show this to a colleague.', s: 4 },
        { l: 'E', t: 'I have made structured pre-prompt framing a team standard. My approach to AI problem definition has been adopted by engineers on my team.', s: 5 }
      ]
    },
    {
      id: 'O2',
      dim: 'O',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you evaluate AI-generated code:',
      opts: [
        { l: 'A', t: 'If the code compiles, passes tests, and addresses the prompt, I generally use it. I do not systematically evaluate against the underlying engineering intent.', s: 1 },
        { l: 'B', t: 'I sense when something is off with AI-generated code, but I cannot always articulate specifically what or why.', s: 2 },
        { l: 'C', t: 'I regularly evaluate AI-generated code against the original engineering intent — not just the prompt — and I can explain my acceptance or rejection reasoning to a colleague.', s: 3 },
        { l: 'D', t: 'My AI code evaluation is systematic. I can consistently identify the class of error in AI output, articulate the specific failure in the model\'s reasoning, and explain why I iterated or accepted.', s: 4 },
        { l: 'E', t: 'I have developed code evaluation frameworks that my team now uses. My approach to AI output assessment has raised the engineering quality standard of the team\'s work.', s: 5 }
      ]
    },
    {
      id: 'O3',
      dim: 'O',
      type: 'beh',
      text: 'Select the statement that most accurately describes your AI iteration behavior when code output is insufficient:',
      opts: [
        { l: 'A', t: 'I typically accept the first or second output. If it is not right I either accept what is there or start from scratch with a different approach.', s: 1 },
        { l: 'B', t: 'I iterate when something is clearly wrong but I do not have a systematic approach. I stop when the output feels acceptable.', s: 2 },
        { l: 'C', t: 'I iterate with directed purpose — each iteration is guided by a specific diagnosis of what the previous output got wrong and what a better prompt should target.', s: 3 },
        { l: 'D', t: 'My iteration is highly disciplined. I can distinguish between an iteration opportunity and a genuine architectural judgment call that requires human engineering decision rather than further AI direction.', s: 4 },
        { l: 'E', t: 'I coach junior engineers on iteration discipline. The teams I work with produce better AI-assisted code because of how I have shaped their iteration practice.', s: 5 }
      ]
    },
    {
      id: 'O4',
      dim: 'O',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you design the role of AI in your engineering workflow:',
      opts: [
        { l: 'A', t: 'I use AI where it clearly helps — boilerplate, documentation, test generation. I have not explicitly designed which engineering tasks AI should handle versus which require my full attention.', s: 1 },
        { l: 'B', t: 'I have a general sense of where AI adds value in my engineering work, but this is intuitive rather than deliberate.', s: 2 },
        { l: 'C', t: 'Before significant engineering tasks, I explicitly consider what AI will generate, what I will architect or decide, and where engineering judgment is load-bearing — and I design my workflow accordingly.', s: 3 },
        { l: 'D', t: 'I design Human-AI engineering collaboration at the team level. I make explicit decisions about which engineering tasks AI handles across the team and where human review is mandatory.', s: 4 },
        { l: 'E', t: 'I architect Human-AI engineering division of responsibility for my organization. The frameworks I have designed for AI-assisted development governance are used beyond my immediate team.', s: 5 }
      ]
    },
    {
      id: 'O5',
      dim: 'O',
      type: 'beh',
      text: 'Select the statement that most accurately describes your reflective practice after AI-assisted engineering work:',
      opts: [
        { l: 'A', t: 'After AI-assisted coding sessions I move directly to the next task. I do not typically reflect on the quality of my AI direction.', s: 1 },
        { l: 'B', t: 'I occasionally note what worked or did not in an AI session, but this is informal and inconsistent.', s: 2 },
        { l: 'C', t: 'I regularly reflect on the quality of my AI direction after significant engineering engagements — what I prompted for, what I got, and what would have made my direction more precise.', s: 3 },
        { l: 'D', t: 'My reflection practice is documented. I maintain notes on AI direction decisions that inform my engineering practice over time.', s: 4 },
        { l: 'E', t: 'My reflection practice has produced team engineering standards for AI-assisted development that go beyond my own work.', s: 5 }
      ]
    },

    // Trust Architecture (T) - Behavioral
    {
      id: 'T1',
      dim: 'T',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you monitor trust in your key engineering relationships:',
      opts: [
        { l: 'A', t: 'I am generally aware when engineering relationships feel collaborative or strained, but I do not actively monitor trust state.', s: 1 },
        { l: 'B', t: 'I notice when trust shifts significantly — a change in review tone, a withdrawal from technical discussion — but I do not track trust systematically.', s: 2 },
        { l: 'C', t: 'I actively monitor whether trust in my key engineering and stakeholder relationships is growing or declining, and I can describe the trajectory of my three most important working relationships.', s: 3 },
        { l: 'D', t: 'I track trust state systematically in my engineering relationships. I can describe the specific moments and interactions that have shaped each key relationship\'s trust trajectory.', s: 4 },
        { l: 'E', t: 'I design trust architecture deliberately in my engineering context. I have a clear strategy for each key relationship — with stakeholders, tech leads, and client engineers — and I adjust my behavior proactively.', s: 5 }
      ]
    },
    {
      id: 'T2',
      dim: 'T',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you handle AI involvement in engineering work delivered to clients or stakeholders:',
      opts: [
        { l: 'A', t: 'I do not typically disclose which parts of my engineering output were AI-assisted unless specifically asked.', s: 1 },
        { l: 'B', t: 'I mention AI involvement if it seems relevant to the conversation, but I do not have a consistent approach.', s: 2 },
        { l: 'C', t: 'I am intentional about communicating AI involvement in engineering deliverables — framing it in a way that maintains stakeholder confidence in the quality, security, and accountability of the work.', s: 3 },
        { l: 'D', t: 'I proactively manage AI disclosure as a trust-building practice — designing how and when to communicate AI involvement based on what I know about each stakeholder\'s technical understanding and concerns.', s: 4 },
        { l: 'E', t: 'I have developed team-level frameworks for AI transparency in engineering delivery that others use. My approach to AI disclosure in technical work has become a standard practice.', s: 5 }
      ]
    },
    {
      id: 'T3',
      dim: 'T',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you handle moments when trust in an engineering relationship is at risk:',
      opts: [
        { l: 'A', t: 'I tend to avoid situations where trust might be damaged. I am more comfortable with technically smooth relationships than addressing interpersonal friction directly.', s: 1 },
        { l: 'B', t: 'I address trust ruptures when they become unavoidable, but I tend to wait until the damage is visible before responding.', s: 2 },
        { l: 'C', t: 'I address trust risks proactively — naming tensions before they become ruptures and taking deliberate action to repair working relationships before damage compounds delivery.', s: 3 },
        { l: 'D', t: 'I am skilled at trust recovery in high-stakes engineering situations. I can repair damaged relationships with colleagues or engineering teams through deliberate, honest engagement.', s: 4 },
        { l: 'E', t: 'My trust recovery capability in engineering contexts is recognized. I am brought into team or relationship situations that others have been unable to repair.', s: 5 }
      ]
    },
    {
      id: 'T4',
      dim: 'T',
      type: 'beh',
      text: 'Select the statement that most accurately describes your behavior under engineering pressure or high-visibility production situations:',
      opts: [
        { l: 'A', t: 'Under significant engineering pressure I sometimes make decisions or communicate in ways that are not fully consistent with how I would want to be seen.', s: 1 },
        { l: 'B', t: 'I am generally consistent, but high-stakes production situations occasionally reveal gaps between how I intend to behave and how I actually behave.', s: 2 },
        { l: 'C', t: 'I am reliably consistent across high-visibility and routine engineering situations. My behavior in an incident does not differ significantly from my behavior in a regular sprint.', s: 3 },
        { l: 'D', t: 'My consistency under engineering pressure is recognized. Colleagues trust that I will behave the same way in a production incident as in a normal engineering review.', s: 4 },
        { l: 'E', t: 'My consistency under engineering pressure is exceptional. I have been trusted with critical production situations specifically because my decision-making and communication are predictable and principled under stress.', s: 5 }
      ]
    },
    {
      id: 'T5',
      dim: 'T',
      type: 'beh',
      text: 'Select the statement that most accurately describes your ability to make AI-assisted engineering feel trustworthy to clients and non-technical stakeholders:',
      opts: [
        { l: 'A', t: 'I have not specifically thought about how AI involvement affects the trust non-technical stakeholders have in my engineering work. I focus on technical quality.', s: 1 },
        { l: 'B', t: 'I am aware that some clients or stakeholders are uncertain about AI in engineering, but I do not have a specific approach to managing this.', s: 2 },
        { l: 'C', t: 'I actively work to make AI-assisted engineering feel transparent and trustworthy — explaining AI\'s role, naming its limitations, and making clear where human engineering judgment provides accountability.', s: 3 },
        { l: 'D', t: 'I am skilled at introducing AI into engineering relationships where there is initial skepticism. I can shift stakeholder perception through deliberate technical communication and demonstrated quality.', s: 4 },
        { l: 'E', t: 'I have developed organizational approaches to AI trust-building in engineering contexts that are used beyond my own projects. My ability to make AI-assisted engineering feel safe is a recognized capability.', s: 5 }
      ]
    },

    // Range (R) - Behavioral
    {
      id: 'R1',
      dim: 'R',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you engage with domains outside software engineering:',
      opts: [
        { l: 'A', t: 'I primarily work within engineering. I engage with product, design, or business domains when required but do not seek this out.', s: 1 },
        { l: 'B', t: 'I am curious about adjacent domains and occasionally explore product or business thinking, but this is informal and does not typically affect my engineering work.', s: 2 },
        { l: 'C', t: 'I regularly and deliberately engage with domains outside engineering — product strategy, business operations, user research — because I find the distance genuinely useful for making better engineering decisions.', s: 3 },
        { l: 'D', t: 'Cross-domain engagement is a core part of how I engineer. I have contributed meaningfully to product, design, and business decisions, using the distance between engineering and other domains as a source of architectural insight.', s: 4 },
        { l: 'E', t: 'My cross-domain Range is recognized and sought out. I am regularly brought into non-engineering discussions because my outside engineering perspective is valued — and the synthesis I produce across engineering and other domains is recognized as distinctive.', s: 5 }
      ]
    },
    {
      id: 'R2',
      dim: 'R',
      type: 'beh',
      text: 'Select the statement that most accurately describes how you use knowledge from non-engineering domains in your technical work:',
      opts: [
        { l: 'A', t: 'I tend to apply engineering thinking to engineering problems. I do not typically look for cross-domain connections.', s: 1 },
        { l: 'B', t: 'I occasionally notice parallels between engineering and other domains, but I do not systematically use these observations to inform technical decisions.', s: 2 },
        { l: 'C', t: 'I regularly transfer mental models across domains — deliberately looking for how frameworks from business strategy, psychology, or design apply to engineering problems.', s: 3 },
        { l: 'D', t: 'Mental model transfer is a characteristic of how I engineer. I can point to specific instances where a non-engineering insight changed how I approached a technical problem — and the system design was measurably better as a result.', s: 4 },
        { l: 'E', t: 'My ability to transfer mental models from other domains into engineering is recognized as a distinctive capability. I have produced architectural insights through cross-domain synthesis that purely technical engineers could not have generated.', s: 5 }
      ]
    },
    {
      id: 'R3',
      dim: 'R',
      type: 'beh',
      text: 'Select the statement that most accurately describes your recent contribution outside software engineering:',
      opts: [
        { l: 'A', t: 'My recent contributions have been primarily within engineering. I have not made significant contributions to product, business, or design decisions in the last three months.', s: 1 },
        { l: 'B', t: 'I have made minor contributions outside engineering recently — attending product meetings, offering technical opinions on business decisions — but I would not describe these as substantive.', s: 2 },
        { l: 'C', t: 'I have made at least one genuine contribution outside engineering in the last three months — one where my involvement produced a meaningfully better non-engineering outcome.', s: 3 },
        { l: 'D', t: 'I have made multiple substantive contributions outside engineering in the last three months. The product managers, designers, or business stakeholders involved would recognize and describe the value I added.', s: 4 },
        { l: 'E', t: 'Contributing outside engineering is a regular, significant part of my work. The contributions I make in product, design, and business domains are recognized as among my most valuable professional contributions.', s: 5 }
      ]
    },
    {
      id: 'R4',
      dim: 'R',
      type: 'beh',
      text: 'Select the statement that most accurately describes your ability to operate effectively in non-engineering contexts:',
      opts: [
        { l: 'A', t: 'I find it difficult to contribute confidently in non-technical domains. I tend to defer to product managers or business stakeholders even when I have relevant perspective.', s: 1 },
        { l: 'B', t: 'I can engage in non-engineering contexts, but I find it harder than technical work and I am not always sure when my engineering perspective adds genuine value versus creating friction.', s: 2 },
        { l: 'C', t: 'I can operate in non-engineering contexts by deliberately suspending technical assumptions and approaching the domain with structured curiosity. I can usually identify where my engineering perspective adds genuine value.', s: 3 },
        { l: 'D', t: 'I am skilled at operating in non-engineering contexts. I know how to make my technical expertise relevant to business, product, or design problems without imposing engineering frameworks where they do not apply.', s: 4 },
        { l: 'E', t: 'My ability to operate in non-engineering contexts is exceptional. I can become a genuine contributor in product, design, or business domains rapidly — bringing structured engineering perspective that domain insiders cannot generate.', s: 5 }
      ]
    },
    {
      id: 'R5',
      dim: 'R',
      type: 'beh',
      text: 'Select the statement that most accurately describes how non-engineering experience affects your technical work:',
      opts: [
        { l: 'A', t: 'My non-engineering experiences are interesting but do not significantly affect how I approach engineering problems.', s: 1 },
        { l: 'B', t: 'I occasionally notice that a business or product experience has changed how I think about a technical problem, but this is rare and unplanned.', s: 2 },
        { l: 'C', t: 'Non-engineering experiences regularly change how I approach technical problems. I deliberately look for what business, design, or user contexts can teach me about engineering.', s: 3 },
        { l: 'D', t: 'The influence runs both ways deliberately. I use engineering thinking to illuminate business and product problems, and I use business and product thinking to challenge and improve my engineering practice.', s: 4 },
        { l: 'E', t: 'My cross-domain learning produces technical capabilities that pure engineering experience could not produce. This synthesis is recognized by colleagues as a genuine differentiator in how I approach complex system design.', s: 5 }
      ]
    }
  ],
  con: [], // To be filled
  fin: [], // To be filled
  hr: [],  // To be filled
  del: []  // To be filled
};

// Validate that each role has exactly 30 questions
function validateQuestionBank() {
  const dims = ['V', 'E', 'C', 'T', 'O', 'R'] as const;
  for (const [role, questions] of Object.entries(questionBank)) {
    if (questions.length !== 30) {
      throw new Error(`Role ${role} has ${questions.length} questions, expected 30`);
    }
    for (const dim of dims) {
      const count = questions.filter(q => q.dim === dim).length;
      if (count !== 5) {
        throw new Error(`Role ${role} dimension ${dim} has ${count} questions, expected 5`);
      }
    }
  }
}

validateQuestionBank();

export function getQuestionsForRole(role: string) {
  const questions = questionBank[role as RoleKey];
  if (!questions) {
    throw new Error(`Unknown role: ${role}`);
  }
  return questions;
}

// Shuffle within dimensions to avoid consecutive same-dimension questions
export function shuffleQuestionsForAssessment(questions: Question[]): Question[] {
  const byDim: Record<string, Question[]> = {};
  questions.forEach(q => {
    if (!byDim[q.dim]) byDim[q.dim] = [];
    byDim[q.dim].push(q);
  });

  const dims = Object.keys(byDim);
  const shuffled: Question[] = [];
  const indices: Record<string, number> = {};

  dims.forEach(d => {
    indices[d] = 0;
  });

  while (shuffled.length < questions.length) {
    for (const dim of dims) {
      if (indices[dim] < byDim[dim].length) {
        shuffled.push(byDim[dim][indices[dim]]);
        indices[dim]++;
      }
    }
  }

  return shuffled;
}

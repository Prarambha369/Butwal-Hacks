---
name: antigenic-prompt-generator
description: Generate iteratively refined, adversarially challenging, and semantically diverse prompts from large context documents. Use this skill whenever you need to extract key themes, create prompt variations with opposing viewpoints, chain prompts for iterative refinement, or stress-test understanding against contradictory angles. Trigger when the user provides a large document or context and asks for prompts, questions, test cases, or "challenges." This includes: testing comprehension, generating interview questions, creating debate prompts, building adversarial test suites, extracting latent themes for exploration, or creating multi-angle interrogations of complex material. Use this skill even if the user doesn't explicitly say "antigenic" or "adversarial"—if they want to "deeply explore," "test," "challenge," "question," or "stress-test" understanding of a document or context, this applies.
compatibility: None
---

# Antigenic Prompt Generator: Multi-Angle Interrogation from Context

This skill extracts and generates prompts from large contexts in three complementary ways: **iterative refinement chains**, **adversarial/opposing prompts**, and **thematic extraction & variation loops**. The term "antigenic" refers to generating prompts that challenge, provoke, and expose gaps—like antigens challenging the immune system.

## The Three Prompt Generation Modes

### Mode 1: Iterative Refinement Chain (Linear Loop)
Extract concepts from context and create a *chain* of progressively deeper or more specific prompts.

**Pattern:** Surface-level → Intermediate detail → Deep mechanics → Edge cases → Synthesis

**Example from a document on climate models:**

1. **Surface**: "What are the main inputs to a climate model?"
2. **Intermediate**: "How do climate models handle feedback loops between temperature and CO₂ concentration?"
3. **Deep**: "Explain the specific parameterization schemes used in GCMs to represent sub-grid-scale processes like cloud formation."
4. **Edge case**: "What happens to model predictions if cloud albedo feedback reverses sign? Why is this physically implausible but mathematically possible?"
5. **Synthesis**: "If models struggle with sub-grid parameterization, how much should we trust their century-ahead projections? What would convince you?"

**When to use:** 
- Testing progressive mastery of material
- Building curricula or learning paths
- Extracting hidden assumptions (prompts 4–5)
- Creating question hierarchies

---

### Mode 2: Adversarial/Opposing Prompts (Contrapositive Loop)
From each claim or theme in the context, generate prompts that challenge, contradict, or flip the assumption.

**Pattern:** Original claim → Devil's advocate → Opposing evidence → Synthesis/Resolution

**Example from a document defending remote work:**

**Original claim (from context):** "Remote work increases productivity."
1. **Opposing angle**: "What evidence suggests remote work *decreases* productivity, especially for junior employees or collaborative work?"
2. **Devil's advocate**: "If remote work is so great, why are major tech companies mandating return-to-office?"
3. **Hidden assumption challenged**: "This claim assumes productivity = output. What about innovation, mentorship, company culture? Is remote work better on those dimensions?"
4. **Synthesis**: "Under what specific conditions does remote work boost *some* aspects of productivity while harming others? How do these trade-offs play out?"

**When to use:**
- Stress-testing claims
- Identifying unstated assumptions
- Preparing for criticism or debate
- Building adversarial AI test suites
- Uncovering nuance in polarized topics

---

### Mode 3: Thematic Extraction & Variation Loop (Branching Loop)
Identify major themes in the context, then generate multiple questions/prompts that *vary* each theme.

**Pattern:** Extract theme → Generate 3-4 variations → Layer variations together

**Example from a document on neural networks:**

**Extracted theme:** "Overfitting happens when models memorize training data."

**Variations on this theme:**
1. **Mechanistic**: "What specific architectural or training choices cause a model to overfit?"
2. **Practical**: "How do practitioners detect overfitting in real time?"
3. **Philosophical**: "Is overfitting a feature or a bug? Can you design a task where 'overfitting' is actually the goal?"
4. **Boundary-testing**: "At what point does memorization become genuine understanding?"

**Combine themes** (creates 2x prompts):
- Overfitting + Generalization → "How do regularization techniques reduce overfitting while preserving generalization?"
- Overfitting + Data efficiency → "If you had only 100 examples, how would you prevent overfitting? Does the solution change if you have 1M?"

**When to use:**
- Exploring a topic from multiple angles
- Generating test case suites
- Building comprehensive question banks
- Creating prompt libraries for downstream tasks

---

## The Refactoring Process

### Step 1: Parse the Context
Read the provided document and identify:
- **Core claims** (explicit statements, arguments, conclusions)
- **Assumed facts** (things stated without evidence)
- **Themes** (recurring concepts, patterns)
- **Logical dependencies** (X depends on Y; Y is unsupported)
- **Gaps** (what's *not* addressed?)

### Step 2: Choose Your Mode(s)
- **Iterative chains**: When you need *depth* and progressive complexity
- **Adversarial**: When you need *critique* and assumption-testing
- **Thematic variations**: When you need *breadth* and multiple angles

(Often, mix all three for comprehensive interrogation.)

### Step 3: Generate Prompts

#### For Iterative Chains:
1. Identify a concept or claim in the context
2. Generate 5 prompts, each assuming mastery of the previous:
   - What is it? (definition/overview)
   - How does it work? (mechanism)
   - Why does it matter? (implications)
   - What breaks it? (edge cases, failures)
   - What's the meta-question? (assumption or next frontier)

#### For Adversarial Prompts:
1. Identify a claim: "The document says X is true."
2. Generate anti-prompts:
   - What evidence contradicts X?
   - What assumption must be true for X to hold?
   - What would falsify X?
   - Is X sometimes false? When?
3. Generate synthesis: "Given both X and ¬X, what's actually true?"

#### For Thematic Variations:
1. Extract 3–5 major themes
2. For each theme, generate 4 angles: Mechanistic, Practical, Philosophical, Boundary-testing
3. Cross-theme prompts: Combine theme A + theme B → new question

### Step 4: Organize & Present

**Output format:**

```
## Theme: [Name]

### Iterative Chain
1. [Surface] ...
2. [Intermediate] ...
3. [Deep] ...
4. [Edge case] ...
5. [Synthesis] ...

### Adversarial Angles
- [Pro] ...
- [Con] ...
- [Hidden assumption] ...
- [Synthesis] ...

### Thematic Variations
- [Mechanistic] ...
- [Practical] ...
- [Philosophical] ...
- [Boundary] ...
```

---

## Detailed Example: Document on AI Alignment

**Sample context:**
"AI alignment is the problem of ensuring advanced AI systems behave in accordance with human values. Current approaches include RLHF, constitutional AI, and interpretability research. Success requires solving the value specification problem and ensuring scalable oversight."

---

### Extracted Themes

#### Theme 1: Value Specification

**Iterative Chain:**
1. *Surface*: "What is the value specification problem?"
2. *Intermediate*: "Why is it hard to specify human values in code or objectives?"
3. *Deep*: "If values are context-dependent and change over time, can they ever be 'specified' at all? Or are we solving the wrong problem?"
4. *Edge case*: "Whose values? One person's freedom is another's harm."
5. *Synthesis*: "Is alignment about specifying values, or building systems that negotiate values dynamically?"

**Adversarial Angles:**
- *Pro alignment*: "Alignment is essential; misaligned AI is existentially dangerous."
- *Con alignment*: "The alignment problem is overblown; market forces and regulation will solve it."
- *Hidden assumption*: "Alignment assumes we can define 'human values.' But whose? Rich countries'? Majorities'?"
- *Synthesis*: "What's the minimum alignment needed? 90%? 99.9%? And can we measure it?"

**Thematic Variations:**
- *Mechanistic*: "How do RLHF and constitutional AI operationalize value specification?"
- *Practical*: "If you had $1B and 5 years, what's your alignment bet?"
- *Philosophical*: "Is 'alignment' even coherent, or are we imposing false unity on diverse, conflicting values?"
- *Boundary*: "At what capability level does alignment become critical? GPT-5? AGI? Post-singularity?"

---

#### Theme 2: Scalable Oversight

**Iterative Chain:**
1. *Surface*: "What is scalable oversight?"
2. *Intermediate*: "Why can't humans directly oversee superintelligent systems?"
3. *Deep*: "If we can't understand the system's reasoning, how do we verify its decisions are aligned?"
4. *Edge case*: "What if the AI is better at fooling oversight mechanisms than we are at detecting deception?"
5. *Synthesis*: "Is scalable oversight a temporary band-aid, or a permanent necessity?"

**Adversarial Angles:**
- *Pro*: "Scalable oversight is necessary and achievable (e.g., recursive reward modeling)."
- *Con*: "Scalable oversight is theoretically impossible; we're kidding ourselves."
- *Hidden assumption*: "Oversight assumes alignment is a binary property. What if it's fuzzy?"
- *Synthesis*: "What's the oversight vs. autonomy tradeoff? More oversight = less capability?"

---

## Edge Cases & Best Practices

### When Prompts Are Contradictory
That's intentional. Adversarial prompts should clash. The goal is to expose tension, not resolve it prematurely. Include a "synthesis" prompt that acknowledges both angles.

### When Context Is Vague
Extract themes anyway. Ask prompts that *force* specificity:
- "What does 'X' actually mean in practice?"
- "How would you test whether X is true?"
- "If X is true, what follows? What breaks?"

### When Context Is Massive
1. Skim for major themes (don't read every word)
2. Generate 3–5 deep chains per theme (not 100 surface prompts)
3. Offer to expand on specific chains

### Quality Signal
A good prompt:
- ✅ Is answerable from the context (or requires thinking about the context)
- ✅ Reveals something non-obvious
- ✅ Challenges an assumption or explores a gap
- ✅ Is specific enough to be useful (not "what do you think about X?")

A bad prompt:
- ❌ Is trivially answered in the text
- ❌ Is so vague it could apply to anything
- ❌ Requires external knowledge the context doesn't provide (unless that's the point)

---

## Looping & Chaining

### The "Loop"
Generate prompts → User answers/discusses → Extract new themes from answers → Generate next batch of prompts → Repeat.

This creates a spiral of deepening understanding. Each loop refines and expands:

**Loop 1:** High-level themes, basic chains
**Loop 2:** Subthemes, antagonistic perspectives
**Loop 3:** Synthesis, synthesis-of-synthesis, meta-questions

### How to Implement Looping in Practice

1. **Present batch 1**: "Here are the top themes and initial prompts"
2. **Gather feedback**: "Which of these do you want to explore? Any themes I missed?"
3. **Generate batch 2**: Based on their interest, deepen those chains and add new angles
4. **Iterate**: Continue until the user reaches their goal (comprehension, debate prep, test suite)

---

## Quick Checklist

- [ ] Extracted 3–5 major themes from context
- [ ] For each theme, generated 1 iterative chain (5 prompts)
- [ ] For each theme, generated 1 adversarial set (4 angles + synthesis)
- [ ] For 2+ themes, generated cross-theme variations
- [ ] Prompts are specific and answerable from context
- [ ] Prompts reveal gaps, assumptions, or tensions
- [ ] Ready to loop: user can pick angles to deepen

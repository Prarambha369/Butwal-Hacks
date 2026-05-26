---
name: wikipedia-humanizer
description: Transform stiff, formal, or AI-generated Wikipedia text into natural, conversational human writing. Use this skill whenever you encounter text that reads like it was written by an AI or Wikipedia's formal style—look for stilted phrasing, unnecessary jargon, redundant qualifiers like "It is important to note" or "It should be noted," passive voice overuse, or complex sentence structures that could be simplified. This skill refactors for tone, clarity, directness, and readability while preserving factual accuracy and depth. Trigger on Wikipedia articles, AI-generated summaries, academic content, or formal documentation that needs humanization. Even if the user doesn't explicitly ask for "humanization," if they mention content "sounds robotic," "is too formal," "needs to be more relatable," or "reads like Wikipedia," use this skill.
compatibility: None
---

# Wikipedia Humanizer: Transform Formal Text to Natural Human Voice

This skill refactors stiff, AI-generated, or overly formal text (especially Wikipedia-style content) into natural, conversational prose that reads like it was written by a real person.

## Core Transformations

### 1. **Eliminate Robotic Qualifiers**
Remove redundant hedge phrases and filler language:

| Robotic | Human |
|---------|--------|
| "It is important to note that..." | (State the point directly) |
| "It should be noted..." | (State the point directly) |
| "It is widely known that..." | (If obvious, omit; if surprising, state as fact) |
| "Research has shown that..." | "Studies show..." or "Researchers found..." |
| "One could argue that..." | (Make the argument directly or remove) |
| "In some respects..." | (Be specific about which respects) |

### 2. **Convert Passive to Active Voice**
Passive voice dominates formal writing but feels distant.

| Passive | Active |
|---------|--------|
| "The theory was developed by Einstein in 1905." | "Einstein developed the theory in 1905." |
| "It was discovered that..." | "Researchers discovered..." |
| "The article was written..." | "The author wrote..." |

### 3. **Break Up Long, Complex Sentences**
Formal text chains ideas with commas and clauses. Humans use shorter bursts:

| Formal | Human |
|--------|--------|
| "The mechanism, which operates through catalytic processes that are activated by temperature gradients in the upper atmosphere, has been the subject of intense scientific scrutiny." | "The mechanism works through catalytic processes. Temperature gradients in the upper atmosphere activate it. Scientists have studied it intensely." |

### 4. **Replace Jargon & Pretentious Vocabulary**
Swap academic/formal words for everyday equivalents when possible:

| Formal | Human |
|--------|--------|
| "utilize" | "use" |
| "facilitate" | "help" or "enable" |
| "elucidate" | "explain" or "clarify" |
| "endeavor" | "try" or "attempt" |
| "subsequent" | "next" or "later" |
| "heretofore" | "until now" |
| "in lieu of" | "instead of" |
| "commencement" | "start" or "beginning" |

### 5. **Add Personality & Directness**
Formal writing avoids opinions. Human writing has a voice:

| Formal | Human |
|--------|--------|
| "The process involves multiple stages." | "This happens in three steps, and the third one's tricky." |
| "Various factors contribute..." | "Three things matter here: X, Y, and Z." |
| "The implications are significant." | "This changes everything because..." |

### 6. **Flatten Nested Clauses**
Instead of: "The discovery, which was made by a team working in isolation from mainstream academia, overturned the prevailing paradigm that, until that point, had dominated the field."

Write: "A isolated team made the discovery. It overturned the field's prevailing paradigm. No one saw it coming."

### 7. **Use Contractions & Conversational Markers**
Formal text avoids contractions; human speech uses them:
- "cannot" → "can't"
- "do not" → "don't"
- "it is" → "it's"
- Add occasional "actually," "really," "basically," "honestly" (sparingly)

### 8. **Show, Don't Explain Importance**
Instead of: "The significance of this development cannot be overstated."
Just: "This changed everything." (Let the reader infer why it matters, or show them.)

---

## The Refactoring Process

When you encounter text to humanize, follow this workflow:

1. **Read the original** and identify:
   - Hedge qualifiers (note, important, should be noted)
   - Passive voice constructions
   - Long, clause-heavy sentences
   - Jargon or pretentious words
   - Missing personality or directness

2. **Rewrite in chunks:**
   - Keep paragraphs but shorten sentences within them
   - Use active voice
   - Replace formal words with everyday equivalents
   - Add specificity where the original was vague
   - Inject directness: "This is X" instead of "X may be considered..."

3. **Preserve:**
   - Factual accuracy
   - Technical terms (when unavoidable; just explain them better)
   - Nuance and qualifications (but express them naturally)
   - Depth and comprehensiveness

4. **Test the result:**
   - Read it aloud (mentally or literally)
   - Does it sound like a real person wrote it?
   - Is it easier to scan and understand?
   - Did you lose any important information?

---

## Example Transformations

### Example 1: Wikipedia-Style Biology

**Original:**
"The phenomenon whereby organisms undergo transformations in their physical characteristics over extended temporal intervals, a process facilitated by environmental pressures and genetic variation, has been the subject of extensive scientific investigation since the nineteenth century. It should be noted that the mechanisms underlying such adaptations are multifaceted and complex."

**Humanized:**
"Over long stretches of time, organisms change. They adapt to environmental pressures, and genetic variation plays a huge role. Scientists have studied this since the 1800s. The mechanisms? They're complicated—multiple factors are at play."

---

### Example 2: Formal Academic

**Original:**
"The implementation of renewable energy sources has necessitated significant infrastructural modifications. Stakeholders have had to reconsider existing paradigms regarding power distribution and grid resilience."

**Humanized:**
"Renewable energy forced infrastructure overhauls. Power companies and grid operators had to rethink how they distribute electricity and keep the system stable."

---

### Example 3: AI-Generated Summary

**Original:**
"The advent of artificial intelligence has precipitated substantial transformations across numerous sectors, with implications that extend beyond the purely technological domain. Various stakeholders, including policymakers, industry leaders, and academic institutions, are grappling with the multifaceted challenges posed by rapid technological advancement."

**Humanized:**
"AI is reshaping industries—not just tech ones. Policymakers, business leaders, and researchers are scrambling to figure out what comes next. The challenges are real and they're everywhere."

---

## Edge Cases & Nuance

### When NOT to Humanize Everything:
- **Legal/medical text**: Some formality is necessary for precision. Keep it, but still clear it up.
- **Definitions**: "A catalytic converter is a device that..." is fine. Don't force informality into definitions.
- **Direct quotes**: Never alter a direct quote; just introduce it naturally.

### When to Preserve Formality:
- Technical specifications that require precision
- Safety warnings
- Definitions of specialized terms
- Citations or attributions

### Balancing Act:
You're not writing a text message. Conversational doesn't mean casual to the point of being unclear. The goal is **readable, direct, confident prose**—the way smart people talk to each other, not the way they write dissertations.

---

## Quick Checklist Before Submitting

- [ ] No "it is important to note," "should be noted," "it could be argued"
- [ ] Majority of sentences are active voice
- [ ] Long sentences (20+ words) broken into shorter ones
- [ ] Jargon replaced or explained clearly
- [ ] Contractions used naturally
- [ ] Text has a voice, not a monotone
- [ ] Accuracy preserved
- [ ] Reads aloud naturally

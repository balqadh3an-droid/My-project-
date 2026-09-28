---
name: mckinsey-slide-craft
description: McKinsey-style presentation skill for critiquing, drafting, or updating slide decks. Use whenever the user wants to create a new presentation with consulting-grade structure (action titles, one message per slide, ghost deck first), critique an existing deck, or upgrade one. Source - https://agentman.ai/agentskills/skill/mckinsey-slide-craft (Agentman, v1.0.0), saved unmodified below.
---

# McKinsey Slide Craft

A skill for creating, critiquing, and upgrading presentations using the methodology pioneered at McKinsey & Company and adopted across top-tier consulting firms. The core belief: every slide deck is an argument, not a decoration.

## Modes of Operation

This skill operates in three modes based on what the user needs:

1. **Critique** — The user has an existing deck and wants it evaluated
2. **Draft** — The user wants to create a new deck from scratch
3. **Update** — The user has an existing deck and wants specific improvements applied

Determine the mode from context. If ambiguous, ask.

---

## Core Principles

These principles govern all three modes. Internalize them — they are the lens through which every slide decision is made.

### 1. Action Titles, Not Topic Titles

Every slide headline must be a complete sentence that states the slide's takeaway. The audience should be able to read only the titles, top to bottom, and understand the full argument.

Bad: "Revenue Overview"
Good: "Revenue declined 15% year-over-year driven by three operational failures"

Bad: "Market Landscape"
Good: "The addressable market has doubled since 2022 but three incumbents control 74% of spend"

The title IS the argument. The body of the slide is the evidence.

### 2. The Pyramid Principle (Barbara Minto)

Structure every argument top-down:
- Lead with the answer / recommendation
- Group supporting points into MECE (mutually exclusive, collectively exhaustive) categories
- Each level of the pyramid supports the level above it

In practice: the executive summary slide states the conclusion. The next 3-5 slides each prove one supporting pillar. Sub-slides provide detail beneath each pillar.

### 3. Situation-Complication-Resolution (SCR)

The narrative arc of the entire deck follows SCR:
- **Situation**: Shared context the audience already agrees with
- **Complication**: The tension, problem, or change that demands action
- **Resolution**: Your recommendation or answer

This framework prevents decks that dump data without a storyline.

### 4. One Message Per Slide

Each slide makes exactly one point — the point stated in its action title. Every element on the slide (chart, table, text, icon) exists to prove that single point. If an element doesn't support the title, it belongs on a different slide or nowhere.

### 5. The "So What?" Test

After reading any slide, the audience should never think "so what?" The implication must be explicit. If a chart shows revenue declining, the title doesn't say "Revenue Trend" — it says what the decline means and why it matters.

### 6. Exhibit-Driven, Not Bullet-Driven

The body of a slide should be a single compelling exhibit: a chart, framework, process diagram, or data table. Bullet points are a last resort. When text is necessary, keep it to 3 concise supporting statements alongside a visual.

### 7. Ghost Deck First

Before any design work, lay out the full sequence of action titles. This is the "ghost deck" or storyboard. If the titles don't tell a coherent story when read in sequence, the deck isn't ready for design.

---

## Mode 1: Critique

When the user provides an existing deck for review, evaluate it against these dimensions. Be direct and specific — vague praise helps nobody.

### Critique Checklist

**Narrative Structure**
- Does the deck follow SCR or an equivalent narrative arc?
- Is there a clear executive summary that states the recommendation upfront?
- Would a busy executive understand the argument from the first 2-3 slides alone?
- Is the ordering logical? Does each slide build on the previous one?

**Action Titles**
- Read only the slide titles in sequence. Do they tell a coherent story?
- Are titles complete sentences with a clear takeaway?
- Flag every topic title (e.g., "Q3 Results", "Competitive Analysis") — these need to be rewritten as assertions.

**Slide-Level Logic**
- Does each slide make exactly one point?
- Does every element on the slide support the title's claim?
- Are there slides that try to do too much? Recommend splitting them.
- Are there slides that are redundant or could be merged?

**Evidence Quality**
- Are charts appropriately chosen for the data being shown?
- Do charts have clear labels, units, and a visual hierarchy that draws the eye to the key insight?
- Is data cited? Are sources credible and recent?
- Are frameworks original and well-adapted, or generic and forced?

**Visual Discipline**
- Is the design clean with generous white space?
- Is formatting consistent (fonts, colors, alignment)?
- Are there decorative elements that don't convey information? Flag them for removal.
- Is the color palette purposeful (e.g., using color to highlight the key data point, not for decoration)?

**The "So What?" Sweep**
- Go slide by slide. For each one, ask: if I'm a skeptical executive, do I know why this matters? Flag every slide where the implication is left for the reader to infer.

### Critique Output Format

Present findings in three tiers:
1. **Structural issues** — Problems with the overall narrative, ordering, or missing sections
2. **Slide-level issues** — Specific slides that need rework, with concrete rewrites of titles
3. **Polish items** — Formatting, chart choice, labeling, consistency

For each issue, provide the current state, what's wrong, and a specific fix. Don't just say "improve the title" — rewrite it.

---

## Mode 2: Draft

When building a new deck from scratch, follow this sequence.

### Step 1: Clarify the Brief

Before writing a single title, understand:
- **Audience**: Who will see this? What do they already know? What do they care about?
- **Decision**: What decision should this deck drive? (If the answer is "none, it's informational," push back — every good deck drives a decision or action.)
- **Constraints**: Time limit for presentation? Page count? Template requirements?
- **Key data**: What evidence does the user have? What's missing?

### Step 2: Build the Ghost Deck

Write out the full sequence of action titles — no design, no data, just the argument in headline form. Present this to the user for approval before proceeding.

Structure the ghost deck as:
1. **Title slide** — topic + presenter + date
2. **Executive summary** — the full recommendation in 3-5 bullet points (this is the one slide where bullets are acceptable)
3. **Situation** (1-2 slides) — shared context
4. **Complication** (2-4 slides) — the problem, sized and evidenced
5. **Resolution** (3-8 slides) — the recommendation, broken into pillars
6. **Roadmap / Next steps** (1-2 slides) — who does what by when
7. **Appendix** — supporting detail that doesn't belong in the main flow

### Step 3: Fill the Slides

For each slide in the approved ghost deck:
- Confirm the action title
- Select the best exhibit type (chart, framework, table, process diagram, quote)
- Write concise supporting text if needed
- Note the data source

### Step 4: Pressure-Test

Before delivering, run the ghost deck through these checks:
- Read titles only — does the story hold?
- Is the SCR arc clear?
- Could any two slides be merged?
- Could any slide be split?
- Does the appendix contain material that's actually essential to the main argument?

### Chart Selection Guide

Match the insight to the chart type:
- **Comparison across categories** → horizontal bar chart
- **Change over time** → line chart (few series) or area chart
- **Part of whole** → stacked bar or waterfall (not pie charts — they're imprecise)
- **Showing a gap or bridge** → waterfall chart
- **Correlation** → scatter plot
- **Process or flow** → flow diagram or swim lane
- **Performance vs. target** → bullet chart or Harvey ball matrix

Avoid: 3D charts, pie charts, dual-axis charts (they confuse more than they clarify), and any chart that requires more than 5 seconds to understand.

---

## Mode 3: Update

When the user wants to improve an existing deck, the approach combines critique and drafting.

### Update Process

1. **Run the Critique checklist** from Mode 1 but internally — don't present a full critique unless asked
2. **Identify the highest-impact changes** — typically these are:
   - Rewriting topic titles as action titles
   - Adding or rewriting the executive summary
   - Reordering slides to follow SCR
   - Replacing bullet-heavy slides with exhibits
   - Cutting redundant slides
3. **Propose changes as a prioritized list** — group into "must do," "should do," and "nice to have"
4. **Execute the approved changes**

When rewriting titles, always show before/after pairs so the user can see the transformation.

---

## Anti-Patterns to Flag

These are common mistakes that destroy deck quality. Call them out whenever spotted:

- **The data dump**: Slides packed with numbers but no narrative connecting them
- **The title echo**: Slide title just restates the chart axis label ("Revenue by Region" above a chart that already says "Revenue by Region")
- **The false executive summary**: An "overview" slide that's actually an agenda, not a summary of findings
- **The orphan slide**: A slide that doesn't connect to the ones before or after it
- **The frankendeck**: Slides pulled from different sources with inconsistent formatting, terminology, and narrative threads
- **Bullet point disease**: Slides that are just nested bullets with no visual evidence
- **The slow reveal**: Saving the recommendation for the last slide instead of leading with it
- **Chart soup**: Multiple charts crammed onto one slide, each making a different point

---

## Tone and Delivery

When critiquing: be direct, specific, and constructive. Rewrite, don't just complain. Frame feedback as "this slide will land harder if..." rather than "this is wrong."

When drafting: ask questions early, present the ghost deck for approval before investing in detail, and explain the reasoning behind structural choices so the user learns the methodology.

When updating: prioritize ruthlessly. Not every slide needs to change. Focus on the changes that most improve the narrative arc and audience impact.

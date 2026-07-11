I began using Codex when I realized that AI could take on much of the repetitive work of implementation. The more I build, the more I feel that the scarce skill is not hand-writing repeated logic. It is thinking a system through.

Many ordinary development tasks are repetition: copying, composing, and debugging. I do not object to handing that execution work to Codex. It moves my work earlier in the process. I need to define the system boundary, architecture, and direction, then judge whether an implementation is actually the one I want.

This does not mean code has stopped mattering. I simply no longer treat personally typing every line as the only proof of professionalism. For an independent developer, the real differentiator is often the ability to turn a vague idea into an executable system: which problem is worth solving, how data should move, how modules should be traded off, and who is responsible when something goes wrong. Repetitive implementation can be accelerated. Engineering judgment cannot be outsourced.

## I Set the Direction. Codex Expands the Possibilities.

I treat Codex as a collaborator. I usually begin with the idea, the goal, and a system-level judgment. It helps move the proposal into something runnable, and it can surface feedback I had not considered.

I do not always state the answer completely. Sometimes I know how I would approach a problem but intentionally describe only the problem and let Codex infer a solution. The point is not to test it. It is to avoid becoming trapped by the first approach that comes to mind. A different answer or decomposition can open a new line of thinking.

At the same time, I do not treat its response as a conclusion. If I always insist on my own plan, or always accept its suggestion, I can create a new form of tunnel vision. Many AI systems also tend to accommodate the questioner. The more strongly a direction is framed, the easier it is for them to agree. My division of work is simple: **Codex executes, and I review the plan.**

That review is not waiting for the final code and pointing out a few syntax errors. I care whether it understood the real problem, where it placed complexity, and whether the approach can still evolve. If it produces working code but has already drifted away from the original goal, a successful run has little value.

My relationship with Codex is therefore not a command-and-submission model. I set direction and keep questions open. I accept some suggestions and reject others. It brings speed and perspective; I keep judgment and responsibility. That tension is the collaboration I want.

## A Change in Algorithm Direction

In Urban Sidequest, I originally wanted to train a set of MLP parameters to filter suitable POIs. The approach was feasible, but while working through requirements and implementation details, I realized that the real problem was not only which places were worth visiting. It was what makes one route better than another.

I changed the algorithmic direction. Instead of using an MLP only to filter POIs, I began exploring how it could learn from route data and search for stronger routes. The final decision was still mine, but the shift came from a collision of ideas during collaboration that forced me to redefine the problem.

The important part was not that AI produced a smarter answer. It pushed the original idea far enough into a concrete proposal that I could see I had asked the wrong question. Optimizing POI filtering may improve a local action. Treating the route as the learning object is closer to the experience the product should deliver.

This is where I find AI coding most useful. It can quickly turn an idea into something that can be discussed, challenged, or discarded. Many directions feel reasonable in the abstract. Their flaws only appear once they reach the level of plans, interfaces, and implementation.

## Running Is Not the Same as Being Right

Codex can often write code that runs, but that does not mean it follows my implementation reasoning. When our directions conflict, it is not especially good at discovering and resolving that conflict on its own. Someone still has to decide whether the result is worth iterating on or was pointed in the wrong direction from the start.

It can also compensate for my weaker frontend experience, helping a page move from nothing to functional and then more complete. But I still cannot expect it to produce unusually refined visual work in one attempt. AI improves the starting point. It does not automatically replace design ability.

That is why I do not believe that throwing a requirement at AI directly produces a product. It can build a page, connect components, and wire functionality, but a genuinely good interface still depends on taste, hierarchy, interaction rhythm, and repeated trade-offs. In frontend work where I have less experience, Codex is a valuable complement. It is not a shortcut around thinking.

## Personal Projects Can Be Bold. Production Systems Need Boundaries.

As an independent developer, I am willing to delegate more execution work to AI. I may even let AI tools such as Hermes take part in maintaining my own server. An enterprise environment is different. AI remains uncertain, can make mistakes, and needs accountable processes. Copying the same bold delegation from a personal project into a company system is not mature engineering.

For personal work, I can experiment quickly according to my own risk tolerance. In a company system, the scope of impact, data security, and responsibility are different. AI can participate deeply without receiving unconstrained authority. The more capable a collaborator it becomes, the more clearly its boundaries, verification, and final accountability must be defined.

Codex has not made me think less. It has given me back time from repetitive implementation and moved it to work that deserves responsibility: defining the problem, judging direction, and accepting or rejecting a plan.

For me, the point of using AI to write code has never been to let it become the engineer in my place. It is to make it a fast collaborator that is willing to offer different answers. It can generate code. I still have to define the problem. We can reason through a proposal together. The responsibility remains with me.

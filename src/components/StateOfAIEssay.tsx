import ScrollReveal from "@/components/ScrollReveal";

const StateOfAIEssay = () => {
  return (
    <div className="max-w-3xl">
      <ScrollReveal>
        <div className="border-l-2 border-foreground/20 pl-6 sm:pl-8 space-y-6">
          <p className="font-mono text-sm text-foreground/80 leading-[1.9]">
            We are living through the fastest technological transformation in human history.
            In three years, AI went from a research curiosity to a force reshaping every industry,
            every profession, and every assumption about what machines can do.
          </p>
          <p className="font-mono text-sm text-muted-foreground leading-[1.9]">
            2024 gave a Nobel Prize to a computer scientist. 2025 made an AI CEO
            TIME's Person of the Year. The open-source community proved that frontier AI
            doesn't require a trillion-dollar company. The safety debate split the field's
            founders against each other. And an alternative to the Transformer — the architecture
            that powered it all — emerged from a CMU lab.
          </p>
          <p className="font-mono text-sm text-muted-foreground leading-[1.9]">
            This notebook is my attempt to map the landscape. Not just who's doing what —
            but <em className="text-foreground/70">why it matters</em>, how these people
            connect, what to read, and what I've learned from studying each of them. Think of
            it as a living document — a reference you return to as you go deeper.
          </p>
          <p className="font-mono text-xs text-muted-foreground/40 italic mt-4">
            — Venkata Pagadala, March 2026
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default StateOfAIEssay;

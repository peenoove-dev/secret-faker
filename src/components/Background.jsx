/** Fixed animated neon backdrop shared by every page. */
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-neon-violet/30 blur-[120px] animate-glow-pulse" />
      <div
        className="absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-neon-blue/20 blur-[120px] animate-glow-pulse"
        style={{ animationDelay: '1.2s' }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-[24rem] w-[24rem] rounded-full bg-neon-pink/20 blur-[120px] animate-glow-pulse"
        style={{ animationDelay: '0.6s' }}
      />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
    </div>
  )
}

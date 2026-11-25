/** Tiny toast. Parent controls visibility by rendering/not rendering it. */
export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="animate-fade-up rounded-2xl border border-neon-blue/40 bg-ink-800/95 px-5 py-3 text-sm font-medium text-white shadow-glow-blue backdrop-blur-md">
        {message}
      </div>
    </div>
  )
}

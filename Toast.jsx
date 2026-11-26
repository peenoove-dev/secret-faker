/** แถบข้อความสั้น ๆ เหมือนกระดาษโน้ต. Parent controls visibility by rendering/not rendering it. */
export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div role="status" className="paper animate-fade-in -rotate-1 px-5 py-3 text-base font-semibold">
        {message}
      </div>
    </div>
  )
}

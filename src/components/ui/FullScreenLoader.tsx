import React from 'react'

export const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-base z-[9999]">
      <div className="w-12 h-12 bg-amber/15 border-[1.5px] border-amber/40 rounded-[10px] flex items-center justify-center text-[22px] font-extrabold text-amber tracking-[-1px] font-sans">
        F
      </div>
      <div className="w-7 h-7 rounded-full border-[3px] border-amber/15 border-t-amber animate-spin" />
    </div>
  )
}

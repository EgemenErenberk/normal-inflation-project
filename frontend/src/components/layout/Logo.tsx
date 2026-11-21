export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#ffffff" fillOpacity="0.1" />
        <path
          d="M7 21.5l5.5-5.5 4 4L25 11.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="11.5" r="2" fill="#f87171" />
      </svg>
      <div className="leading-tight">
        <p className="text-[13px] font-bold tracking-[0.08em] text-white">ENFLASYON ANALİZİ</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">Türkiye Araştırma Platformu</p>
      </div>
    </div>
  )
}

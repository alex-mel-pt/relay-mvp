interface Props {
  brandName: string
  productName: string
  checkInUrl: string
  daysUntilDelivery: number
}

export default function IMessageCard({ brandName, productName, checkInUrl, daysUntilDelivery }: Props) {
  return (
    <div className="max-w-sm">
      {/* iPhone status bar simulation */}
      <div className="bg-gray-100 rounded-t-[2rem] px-6 pt-3 pb-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>●●●●</span>
            <span>WiFi</span>
            <span>🔋</span>
          </div>
        </div>
      </div>

      {/* iMessage header */}
      <div className="bg-gray-100 px-4 py-2 flex items-center gap-3 border-b border-gray-200">
        <span className="text-peel-blue text-lg">‹</span>
        <div className="flex-1 text-center">
          <div className="w-8 h-8 rounded-full bg-peel-blue/20 mx-auto mb-0.5 flex items-center justify-center">
            <span className="text-peel-blue text-xs font-bold">{brandName[0]}</span>
          </div>
          <div className="text-xs font-medium text-gray-700">{brandName}</div>
          <div className="text-[10px] text-gray-400">Business Chat</div>
        </div>
        <span className="text-peel-blue text-lg opacity-0">‹</span>
      </div>

      {/* Chat area */}
      <div className="bg-white px-4 py-6 min-h-[320px] flex flex-col justify-end gap-3">
        {/* Timestamp */}
        <div className="text-center text-[10px] text-gray-400 mb-2">Today 9:41 AM</div>

        {/* Brand message bubble */}
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
            <p className="text-sm text-gray-800 leading-relaxed">
              Hey! 👋 Your <strong>{productName}</strong> is scheduled to ship in {daysUntilDelivery} days.
            </p>
            <p className="text-sm text-gray-800 leading-relaxed mt-2">
              Quick check — how's your shelf? 🤔
            </p>
          </div>
        </div>

        {/* iMessage interactive card */}
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md overflow-hidden max-w-[85%] shadow-sm">
            {/* Card header */}
            <div className="bg-gradient-to-r from-peel-blue to-blue-500 px-4 py-3">
              <div className="text-white text-xs font-medium opacity-80">{brandName} × Relay</div>
              <div className="text-white text-sm font-semibold mt-0.5">How much {productName} do you have?</div>
            </div>
            {/* 3 bucket buttons */}
            <div className="p-3 space-y-2">
              {[
                { emoji: '🟢', label: 'Plenty left — I just opened it', value: 'full' },
                { emoji: '🟡', label: 'About halfway through', value: 'halfway' },
                { emoji: '🔴', label: 'Running low — send it!', value: 'running_low' },
              ].map((bucket) => (
                <a
                  key={bucket.value}
                  href={`${checkInUrl}&level=${bucket.value}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-peel-blue hover:bg-peel-blue-light transition-colors cursor-pointer"
                >
                  <span className="text-lg">{bucket.emoji}</span>
                  <span className="text-sm text-gray-700">{bucket.label}</span>
                </a>
              ))}
            </div>
            {/* Card footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Tap to check in · 3 sec</span>
              <span className="text-[10px] text-peel-blue font-medium">Powered by Relay</span>
            </div>
          </div>
        </div>
      </div>

      {/* iPhone bottom bar */}
      <div className="bg-gray-100 rounded-b-[2rem] px-6 py-3">
        <div className="bg-gray-200 rounded-full px-4 py-2 text-xs text-gray-400 text-center">
          iMessage
        </div>
      </div>
    </div>
  )
}

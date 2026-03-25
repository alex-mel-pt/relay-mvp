interface Props {
  brandName: string
  productName: string
  checkInUrl: string
  daysUntilDelivery: number
  savedTotal: number
}

function cents(amount: number) {
  return `$${(amount / 100).toFixed(2)}`
}

export default function SMSReply({ brandName, productName, checkInUrl, daysUntilDelivery, savedTotal }: Props) {
  return (
    <div className="max-w-sm">
      {/* Android/SMS style header */}
      <div className="bg-peel-navy rounded-t-[1.5rem] px-5 pt-3 pb-1">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>●●●●</span>
            <span>5G</span>
            <span>🔋</span>
          </div>
        </div>
      </div>

      {/* SMS header */}
      <div className="bg-peel-navy px-4 py-3 flex items-center gap-3">
        <span className="text-white text-lg">←</span>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{brandName[0]}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-white">{brandName}</div>
            <div className="text-[10px] text-white/40">+1 (800) 555-RELAY</div>
          </div>
        </div>
        <span className="text-white/60">⋯</span>
      </div>

      {/* Chat area */}
      <div className="bg-peel-gray-50 px-4 py-6 min-h-[320px] flex flex-col justify-end gap-3">
        {/* Timestamp */}
        <div className="text-center text-[10px] text-gray-400 mb-2">Today 7:30 AM</div>

        {/* SMS from brand */}
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">
              {brandName}: Your {productName} ships in {daysUntilDelivery} days.
            </p>
            <p className="text-sm text-gray-800 leading-relaxed mt-2">
              How much do you have left?
            </p>
            <p className="text-sm text-gray-800 leading-relaxed mt-2 font-medium">
              Reply:<br />
              1 = Plenty left<br />
              2 = About halfway<br />
              3 = Running low
            </p>
            {savedTotal > 0 && (
              <p className="text-sm text-peel-green leading-relaxed mt-2">
                Your concierge has saved you {cents(savedTotal)} so far.
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Or tap to check in: <a href={checkInUrl} className="text-peel-blue underline">relay.link/checkin</a>
            </p>
          </div>
        </div>

        {/* User reply */}
        <div className="flex justify-end">
          <div className="bg-peel-blue text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]">
            <p className="text-sm font-medium">1</p>
          </div>
        </div>

        {/* System confirmation */}
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">
              Got it. Your {productName} delivery is <strong>pushed back 30 days</strong>. Enjoy at your own pace.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">
              Next delivery: <strong>May 8</strong>
            </p>
            {savedTotal > 0 && (
              <p className="text-sm text-peel-green leading-relaxed mt-1 font-medium">
                You just saved {cents(savedTotal > 5000 ? 7900 : 3600)}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SMS input bar */}
      <div className="bg-white rounded-b-[1.5rem] px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-lg">+</span>
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-400">
            Text message
          </div>
          <span className="text-peel-blue text-lg">➤</span>
        </div>
      </div>
    </div>
  )
}

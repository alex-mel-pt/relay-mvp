export default function LoginPage({ error }: { error?: string | null }) {
  const consumers = [
    { token: 'chloe-demo', label: 'Chloe Park', desc: 'Gen Z · Skincare & Supplements · $97/mo' },
    { token: 'marcus-demo', label: 'Marcus Chen', desc: 'Millennial · Supplements & Skincare · $180/mo' },
  ]

  return (
    <div className="min-h-screen bg-peel-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-peel-blue flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <h1 className="text-3xl font-bold text-peel-navy tracking-tight">Relay</h1>
          </div>
          <p className="text-peel-gray-400 text-sm">Usage Pulse — Adaptive Subscription Platform</p>
        </div>

        {error && (
          <div className="bg-peel-red-light border border-peel-red/20 text-peel-red rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Consumers */}
        <div className="bg-white rounded-xl shadow-sm border border-peel-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-peel-blue-light flex items-center justify-center">
              <span className="text-peel-blue text-xs">U</span>
            </div>
            <h2 className="text-xs font-semibold text-peel-gray-400 uppercase tracking-wider">Subscribers</h2>
          </div>
          <div className="space-y-2">
            {consumers.map((link) => (
              <a
                key={link.token}
                href={`?token=${link.token}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-peel-gray-200 hover:border-peel-blue hover:bg-peel-blue-light transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-peel-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-sm text-peel-gray-500 font-medium">
                    {link.label.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-peel-navy">{link.label}</div>
                  <div className="text-xs text-peel-gray-400">{link.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-peel-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-peel-navy/10 flex items-center justify-center">
              <span className="text-peel-navy text-xs">A</span>
            </div>
            <h2 className="text-xs font-semibold text-peel-gray-400 uppercase tracking-wider">Admin Dashboard</h2>
          </div>
          <a
            href="?token=admin-demo"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-peel-gray-200 hover:border-peel-navy hover:bg-peel-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-peel-navy flex items-center justify-center shrink-0">
              <span className="text-xs text-white font-bold">UP</span>
            </div>
            <div>
              <div className="text-sm font-medium text-peel-navy">Usage Pulse — Admin</div>
              <div className="text-xs text-peel-gray-400">All brands · 6 subscribers · Full analytics</div>
            </div>
          </a>
        </div>

        <p className="text-center text-xs text-peel-gray-400 mt-6">
          In production, users access via magic link sent to their email or phone.
        </p>
      </div>
    </div>
  )
}

import type { User } from '../lib/types'

interface SidebarProps {
  user: User
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: { id: string; label: string; icon: string }[]
}

export default function Sidebar({ user, activeTab, onTabChange, tabs }: SidebarProps) {
  const isAdmin = user.role === 'merchant'

  return (
    <aside className="w-60 bg-peel-navy min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-peel-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <span className="text-white font-heading font-semibold text-lg tracking-tight">Relay</span>
        </div>
        {isAdmin && (
          <div className="mt-2 text-xs text-white/40">
            Usage Pulse
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeTab === tab.id
                ? 'bg-white/10 text-white font-medium'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-peel-blue/30 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {user.full_name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white truncate">{user.full_name}</div>
            <div className="text-xs text-white/40 truncate">
              {isAdmin ? user.brand_name : user.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

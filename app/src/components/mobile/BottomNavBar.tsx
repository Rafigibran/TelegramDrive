import { Folder, Download, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavBarProps {
  activeTab: 'files' | 'downloads' | 'settings';
  setActiveTab: (tab: 'files' | 'downloads' | 'settings') => void;
}

export function BottomNavBar({ activeTab, setActiveTab }: BottomNavBarProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'files', labelKey: 'common.files', icon: Folder },
    { id: 'downloads', labelKey: 'common.transfers', icon: Download },
    { id: 'settings', labelKey: 'common.settings', icon: Settings },
  ] as const;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 bg-telegram-surface border-t border-telegram-border z-50 flex justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]`}
      aria-label="Primary navigation"
    >
      {tabs.map(({ id, labelKey, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`min-w-0 flex-1 flex flex-col items-center gap-1 py-1.5 transition-colors duration-150 ${
              isActive
                ? 'text-telegram-primary'
                : 'text-telegram-subtext hover:text-telegram-text'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 2} />
            <span className="text-[10px] font-medium tracking-tight">{t(labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

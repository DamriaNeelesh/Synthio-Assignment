import {
  ChevronDown,
  Menu,
  MessageSquarePlus,
  Phone,
  Share2,
  Star,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { IconButton } from './IconButton';

export interface AppHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onStartVoice: () => void;
  onNewConversation: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  isOnline?: boolean;
  statusLabel?: string;
  className?: string;
}

export function AppHeader({
  className,
  isFavorite = false,
  isOnline = true,
  onNewConversation,
  onShare,
  onStartVoice,
  onToggleFavorite,
  onToggleSidebar,
  statusLabel = isOnline ? 'Online' : 'Offline',
  title,
}: AppHeaderProps) {
  return (
    <header
      className={['app-header', className].filter(Boolean).join(' ')}
    >
      <div className="app-header__leading">
        <IconButton
          className="app-header__sidebar-toggle"
          label="Open conversation sidebar"
          onClick={onToggleSidebar}
          size="large"
        >
          <Menu size={24} strokeWidth={1.8} />
        </IconButton>

        <BrandMark className="app-header__brand-mark" height={30} width={30} />

        <div className="app-header__identity">
          <span className="app-header__brand-name">Synthio Labs</span>
          <div className="app-header__title-row">
            <h1 className="app-header__title">{title}</h1>
            <ChevronDown
              aria-hidden="true"
              className="app-header__title-chevron"
              size={18}
              strokeWidth={1.8}
            />
          </div>
        </div>

        <span
          className={[
            'app-header__status',
            isOnline
              ? 'app-header__status--online'
              : 'app-header__status--offline',
          ].join(' ')}
        >
          <span aria-hidden="true" className="app-header__status-dot" />
          <span>{statusLabel}</span>
        </span>
      </div>

      <div
        aria-label="Conversation actions"
        className="app-header__actions"
        role="group"
      >
        <IconButton
          className="app-header__action app-header__action--new"
          label="Start a new conversation"
          onClick={onNewConversation}
          variant="outline"
        >
          <MessageSquarePlus size={20} strokeWidth={1.8} />
        </IconButton>

        {onToggleFavorite ? (
          <IconButton
            aria-pressed={isFavorite}
            className="app-header__action app-header__action--favorite"
            label={
              isFavorite
                ? 'Remove conversation from favorites'
                : 'Add conversation to favorites'
            }
            onClick={onToggleFavorite}
            variant="outline"
          >
            <Star
              fill={isFavorite ? 'currentColor' : 'none'}
              size={20}
              strokeWidth={1.8}
            />
          </IconButton>
        ) : null}

        {onShare ? (
          <IconButton
            className="app-header__action app-header__action--share"
            label="Share conversation"
            onClick={onShare}
            variant="outline"
          >
            <Share2 size={20} strokeWidth={1.8} />
          </IconButton>
        ) : null}

        <IconButton
          className="app-header__action app-header__action--voice"
          label="Start voice conversation"
          onClick={onStartVoice}
          size="large"
          variant="subtle"
        >
          <Phone size={22} strokeWidth={1.9} />
        </IconButton>
      </div>
    </header>
  );
}

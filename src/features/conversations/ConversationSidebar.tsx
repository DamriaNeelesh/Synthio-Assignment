import {
  BarChart3,
  Check,
  ChevronDown,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Target,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { BrandMark } from '../../components/BrandMark';
import { IconButton } from '../../components/IconButton';

export type ConversationIcon =
  | 'message'
  | 'target'
  | 'chart'
  | 'people';

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAtLabel: string;
  icon?: ConversationIcon;
}

export interface SidebarUser {
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface ConversationSidebarProps {
  conversations: readonly ConversationSummary[];
  currentConversationId: string | null;
  isBlocked?: boolean;
  isOpen: boolean;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (
    conversationId: string,
    nextTitle: string,
  ) => void;
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  user?: SidebarUser;
  className?: string;
}

const fallbackIcons = ['message', 'target', 'chart', 'people'] as const;

function getConversationIcon(
  icon: ConversationIcon | undefined,
  index: number,
): ReactNode {
  const resolvedIcon = icon ?? fallbackIcons[index % fallbackIcons.length];
  const iconProps = { 'aria-hidden': true, size: 20, strokeWidth: 1.8 };

  switch (resolvedIcon) {
    case 'target':
      return <Target {...iconProps} />;
    case 'chart':
      return <BarChart3 {...iconProps} />;
    case 'people':
      return <UsersRound {...iconProps} />;
    case 'message':
    default:
      return <MessageCircle {...iconProps} />;
  }
}

function closeActionMenu(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.closest('details')?.removeAttribute('open');
}

export function ConversationSidebar({
  className,
  conversations,
  currentConversationId,
  isBlocked = false,
  isOpen,
  onClose,
  onDeleteConversation,
  onNewConversation,
  onOpenProfile,
  onOpenSettings,
  onRenameConversation,
  onSelectConversation,
  user = { initials: 'JS', name: 'Jane Smith' },
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const asideRef = useRef<HTMLElement>(null);
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (editingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!isOpen || isBlocked || window.innerWidth >= 768) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusFrame = window.requestAnimationFrame(() => {
      newButtonRef.current?.focus();
    });

    function handleDrawerKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }

      const sidebar = asideRef.current;
      if (!sidebar) {
        return;
      }
      const focusableElements = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), summary, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('inert'));
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleDrawerKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleDrawerKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isBlocked, isOpen]);

  function startRenaming(conversation: ConversationSummary) {
    setEditingId(conversation.id);
    setDraftTitle(conversation.title);
  }

  function cancelRenaming() {
    setEditingId(null);
    setDraftTitle('');
  }

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    const nextTitle = draftTitle.trim();
    if (nextTitle) {
      onRenameConversation(editingId, nextTitle);
    }

    cancelRenaming();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    event.currentTarget.removeAttribute('open');
    event.currentTarget.querySelector('summary')?.focus();
  }

  return (
    <aside
      aria-hidden={!isOpen || isBlocked}
      aria-label="Conversation navigation"
      className={[
        'conversation-sidebar',
        isOpen ? 'conversation-sidebar--open' : 'conversation-sidebar--closed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-state={isOpen ? 'open' : 'closed'}
      inert={!isOpen || isBlocked}
      ref={asideRef}
    >
      <div className="conversation-sidebar__header">
        <div className="conversation-sidebar__brand">
          <BrandMark className="conversation-sidebar__brand-mark" />
          <span className="conversation-sidebar__brand-name">Synthex</span>
        </div>
        <IconButton
          className="conversation-sidebar__close"
          label="Close conversation sidebar"
          onClick={onClose}
          size="large"
        >
          <X size={21} strokeWidth={1.8} />
        </IconButton>
      </div>

      <button
        className="conversation-sidebar__new-button"
        onClick={onNewConversation}
        ref={newButtonRef}
        type="button"
      >
        <Plus aria-hidden="true" size={22} strokeWidth={1.8} />
        <span>New conversation</span>
      </button>

      <nav
        aria-labelledby="conversation-sidebar-recent-heading"
        className="conversation-sidebar__navigation"
      >
        <h2
          className="conversation-sidebar__section-title"
          id="conversation-sidebar-recent-heading"
        >
          Recent
        </h2>

        {conversations.length > 0 ? (
          <ul className="conversation-sidebar__list">
            {conversations.map((conversation, index) => {
              const isCurrent =
                conversation.id === currentConversationId;
              const isEditing = editingId === conversation.id;

              return (
                <li
                  className={[
                    'conversation-sidebar__item',
                    isCurrent
                      ? 'conversation-sidebar__item--current'
                      : undefined,
                    isEditing
                      ? 'conversation-sidebar__item--editing'
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={conversation.id}
                >
                  {isEditing ? (
                    <form
                      className="conversation-sidebar__rename-form"
                      onSubmit={submitRename}
                    >
                      <label
                        className="conversation-sidebar__rename-label"
                        htmlFor={`rename-conversation-${conversation.id}`}
                      >
                        Rename {conversation.title}
                      </label>
                      <input
                        className="conversation-sidebar__rename-input"
                        id={`rename-conversation-${conversation.id}`}
                        maxLength={80}
                        onChange={(event) =>
                          setDraftTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelRenaming();
                          }
                        }}
                        ref={renameInputRef}
                        value={draftTitle}
                      />
                      <IconButton
                        className="conversation-sidebar__rename-save"
                        disabled={!draftTitle.trim()}
                        label={`Save name for ${conversation.title}`}
                        size="small"
                        type="submit"
                        variant="subtle"
                      >
                        <Check size={17} strokeWidth={2} />
                      </IconButton>
                      <IconButton
                        className="conversation-sidebar__rename-cancel"
                        label="Cancel rename"
                        onClick={cancelRenaming}
                        size="small"
                      >
                        <X size={17} strokeWidth={2} />
                      </IconButton>
                    </form>
                  ) : (
                    <>
                      <button
                        aria-label={conversation.title}
                        aria-current={isCurrent ? 'page' : undefined}
                        className="conversation-sidebar__conversation-button"
                        onClick={() =>
                          onSelectConversation(conversation.id)
                        }
                        type="button"
                      >
                        <span className="conversation-sidebar__conversation-icon">
                          {getConversationIcon(conversation.icon, index)}
                        </span>
                        <span className="conversation-sidebar__conversation-title">
                          {conversation.title}
                        </span>
                        <span className="conversation-sidebar__conversation-time">
                          {conversation.updatedAtLabel}
                        </span>
                      </button>

                      <details
                        className="conversation-sidebar__actions"
                        onBlur={(event) => {
                          if (
                            !event.currentTarget.contains(event.relatedTarget)
                          ) {
                            event.currentTarget.removeAttribute('open');
                          }
                        }}
                        onKeyDown={handleMenuKeyDown}
                      >
                        <summary
                          aria-label={`Actions for ${conversation.title}`}
                          className="conversation-sidebar__actions-trigger"
                          title={`Actions for ${conversation.title}`}
                        >
                          <MoreHorizontal
                            aria-hidden="true"
                            size={19}
                            strokeWidth={1.8}
                          />
                        </summary>
                        <div
                          aria-label={`Actions for ${conversation.title}`}
                          className="conversation-sidebar__actions-popover"
                          role="group"
                        >
                          <button
                            className="conversation-sidebar__action"
                            onClick={(event) => {
                              closeActionMenu(event);
                              startRenaming(conversation);
                            }}
                            type="button"
                          >
                            <Pencil
                              aria-hidden="true"
                              size={16}
                              strokeWidth={1.8}
                            />
                            Rename
                          </button>
                          <button
                            className="conversation-sidebar__action conversation-sidebar__action--danger"
                            onClick={(event) => {
                              closeActionMenu(event);
                              onDeleteConversation(conversation.id);
                            }}
                            type="button"
                          >
                            <Trash2
                              aria-hidden="true"
                              size={16}
                              strokeWidth={1.8}
                            />
                            Delete
                          </button>
                        </div>
                      </details>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="conversation-sidebar__empty">
            Your conversations will appear here.
          </p>
        )}
      </nav>

      <div className="conversation-sidebar__footer">
        <button
          className="conversation-sidebar__settings"
          disabled={!onOpenSettings}
          onClick={onOpenSettings}
          type="button"
        >
          <Settings aria-hidden="true" size={22} strokeWidth={1.7} />
          <span>Settings</span>
        </button>

        {onOpenProfile ? (
          <button
            className="conversation-sidebar__profile"
            onClick={onOpenProfile}
            type="button"
          >
            <span className="conversation-sidebar__avatar">
              {user.avatarUrl ? (
                <img
                  alt=""
                  className="conversation-sidebar__avatar-image"
                  src={user.avatarUrl}
                />
              ) : (
                user.initials
              )}
            </span>
            <span className="conversation-sidebar__profile-name">
              {user.name}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="conversation-sidebar__profile-chevron"
              size={18}
              strokeWidth={1.8}
            />
          </button>
        ) : (
          <div className="conversation-sidebar__profile">
            <span className="conversation-sidebar__avatar">
              {user.avatarUrl ? (
                <img
                  alt=""
                  className="conversation-sidebar__avatar-image"
                  src={user.avatarUrl}
                />
              ) : (
                user.initials
              )}
            </span>
            <span className="conversation-sidebar__profile-name">
              {user.name}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

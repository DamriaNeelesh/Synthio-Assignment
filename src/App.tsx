import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { Toast, type ToastMessage } from './components/Toast';
import { ChatView } from './features/chat/ChatView';
import { useChatController } from './features/chat/useChatController';
import {
  ConversationSidebar,
  type ConversationSummary,
} from './features/conversations/ConversationSidebar';
import { useConversations } from './features/conversations';
import { useVoiceCall } from './features/voice/useVoiceCall';
import { VoicePanel } from './features/voice/VoicePanel';
import { formatRelativeTime } from './lib/format';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  return isOnline;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener('change', updateMatch);
    return () => mediaQuery.removeEventListener('change', updateMatch);
  }, [query]);

  return matches;
}

export default function App() {
  const {
    activeConversation,
    activeConversationId,
    conversations,
    createConversation,
    deleteConversation,
    renameConversation,
    selectConversation,
  } = useConversations();
  const {
    isGenerating,
    retryMessage,
    sendMessage,
    stopGeneration,
  } = useChatController();
  const isOnline = useOnlineStatus();
  const isVoiceModal = useMediaQuery('(max-width: 1179px)');
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches,
  );
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceAssistantTranscript, setVoiceAssistantTranscript] =
    useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const voiceSpeakRef = useRef<(text: string) => Promise<void>>(
    () => Promise.resolve(),
  );
  const voiceResumeRef = useRef<() => void>(() => undefined);
  const voiceSessionRef = useRef(0);

  const showToast = useCallback(
    (message: string, tone: ToastMessage['tone'] = 'info') => {
      setToast({ id: Date.now(), message, tone });
    },
    [],
  );

  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      const session = voiceSessionRef.current;
      void sendMessage(transcript).then(
        async (response) => {
          if (session !== voiceSessionRef.current) {
            return;
          }
          if (!response) {
            voiceResumeRef.current();
            return;
          }
          setVoiceAssistantTranscript(response);
          await voiceSpeakRef.current(response);
        },
      );
    },
    [sendMessage],
  );

  const voice = useVoiceCall({
    onFinalTranscript: handleVoiceTranscript,
    speech: { pitch: 1.02, rate: 1.04, volume: 1 },
  });
  const {
    clearTranscript: clearVoiceTranscript,
    endCall: endVoiceCall,
    resumeListening: resumeVoiceListening,
    speak: speakVoiceResponse,
    startCall: startVoiceCall,
    status: voiceStatus,
  } = voice;

  useEffect(() => {
    voiceSpeakRef.current = speakVoiceResponse;
    voiceResumeRef.current = resumeVoiceListening;
  }, [resumeVoiceListening, speakVoiceResponse]);

  const handleStartVoiceCall = useCallback(() => {
    voiceSessionRef.current += 1;
    setVoiceAssistantTranscript('');
    clearVoiceTranscript();
    startVoiceCall();
  }, [clearVoiceTranscript, startVoiceCall]);

  const handleEndVoice = useCallback(() => {
    voiceSessionRef.current += 1;
    endVoiceCall();
  }, [endVoiceCall]);

  const handleCloseVoice = useCallback(() => {
    handleEndVoice();
    setVoiceOpen(false);
  }, [handleEndVoice]);

  const handleOpenVoice = useCallback(() => {
    if (isVoiceModal) {
      setSidebarOpen(false);
    }
    setVoiceOpen(true);
    if (voiceStatus === 'disconnected') {
      handleStartVoiceCall();
    }
  }, [handleStartVoiceCall, isVoiceModal, voiceStatus]);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const handleLayoutChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setSidebarOpen(true);
      }
    };
    desktopQuery.addEventListener('change', handleLayoutChange);
    return () =>
      desktopQuery.removeEventListener('change', handleLayoutChange);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }
      if (voiceOpen) {
        handleCloseVoice();
      } else if (sidebarOpen && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleCloseVoice, sidebarOpen, voiceOpen]);

  const conversationSummaries = useMemo<ConversationSummary[]>(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        updatedAtLabel: formatRelativeTime(conversation.updatedAt),
      })),
    [conversations],
  );

  const isFavorite = activeConversationId
    ? favoriteIds.has(activeConversationId)
    : false;
  const visibleSidebarOpen =
    sidebarOpen && !(voiceOpen && isVoiceModal);

  function handleNewConversation() {
    createConversation();
    setSidebarOpen(window.innerWidth >= 768);
  }

  function handleSelectConversation(conversationId: string) {
    selectConversation(conversationId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }

  function handleDeleteConversation(conversationId: string) {
    const conversation = conversations.find(
      (candidate) => candidate.id === conversationId,
    );
    if (
      conversation &&
      !window.confirm(`Delete “${conversation.title}”? This cannot be undone.`)
    ) {
      return;
    }
    stopGeneration(conversationId);
    deleteConversation(conversationId);
    showToast('Conversation deleted');
  }

  function handleToggleFavorite() {
    if (!activeConversationId) {
      return;
    }
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(activeConversationId)) {
        next.delete(activeConversationId);
      } else {
        next.add(activeConversationId);
      }
      return next;
    });
  }

  async function handleShareConversation() {
    if (!activeConversation) {
      return;
    }
    const transcript = activeConversation.messages
      .map(
        (message) =>
          `${message.role === 'assistant' ? 'Synthex' : 'You'}: ${message.content}`,
      )
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(
        `${activeConversation.title}\n\n${transcript}`,
      );
      showToast('Conversation copied to your clipboard', 'success');
    } catch {
      showToast('Clipboard access is unavailable in this browser');
    }
  }

  return (
    <div
      className={[
        'app-shell',
        visibleSidebarOpen
          ? 'app-shell--sidebar-open'
          : 'app-shell--sidebar-closed',
        voiceOpen ? 'app-shell--voice-open' : '',
      ].join(' ')}
    >
      <a
        aria-hidden={voiceOpen && isVoiceModal ? true : undefined}
        className="skip-link"
        href="#conversation"
        tabIndex={voiceOpen && isVoiceModal ? -1 : undefined}
      >
        Skip to conversation
      </a>

      <ConversationSidebar
        conversations={conversationSummaries}
        currentConversationId={activeConversationId}
        isBlocked={voiceOpen && isVoiceModal}
        isOpen={visibleSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        onOpenProfile={() => showToast('Profile controls are ready to connect')}
        onOpenSettings={() =>
          showToast('Settings are ready to connect to your account')
        }
        onRenameConversation={renameConversation}
        onSelectConversation={handleSelectConversation}
      />

      {visibleSidebarOpen ? (
        <button
          aria-label="Close conversation sidebar"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <main
        aria-hidden={voiceOpen && isVoiceModal ? true : undefined}
        className="workspace"
        id="conversation"
        inert={voiceOpen && isVoiceModal}
      >
        <AppHeader
          isFavorite={isFavorite}
          isOnline={isOnline}
          onNewConversation={handleNewConversation}
          onShare={() => void handleShareConversation()}
          onStartVoice={handleOpenVoice}
          onToggleFavorite={handleToggleFavorite}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          statusLabel={isOnline ? 'Online' : 'Offline · mock ready'}
          title={activeConversation?.title ?? 'New conversation'}
        />

        <div className="workspace__body">
          <ChatView
            conversation={activeConversation}
            isGenerating={isGenerating}
            onRetryMessage={(messageId) => {
              if (activeConversationId) {
                void retryMessage(activeConversationId, messageId);
              }
            }}
            onSendMessage={(content) => void sendMessage(content)}
            onStartVoice={handleOpenVoice}
            onStopGeneration={() => stopGeneration()}
          />

          {voiceOpen && !isVoiceModal ? (
            <VoicePanel
              assistantTranscript={voiceAssistantTranscript}
              elapsedSeconds={voice.elapsedSeconds}
              error={voice.error}
              interimTranscript={voice.transcript.interim}
              isMuted={voice.isMuted}
              isModal={false}
              mode={voice.mode}
              onClose={handleCloseVoice}
              onEndCall={handleEndVoice}
              onStartCall={handleStartVoiceCall}
              onToggleMute={voice.toggleMute}
              status={voice.status}
              userTranscript={voice.transcript.final}
            />
          ) : null}
        </div>
      </main>

      {voiceOpen && isVoiceModal ? (
        <VoicePanel
          assistantTranscript={voiceAssistantTranscript}
          elapsedSeconds={voice.elapsedSeconds}
          error={voice.error}
          interimTranscript={voice.transcript.interim}
          isMuted={voice.isMuted}
          isModal
          mode={voice.mode}
          onClose={handleCloseVoice}
          onEndCall={handleEndVoice}
          onStartCall={handleStartVoiceCall}
          onToggleMute={voice.toggleMute}
          status={voice.status}
          userTranscript={voice.transcript.final}
        />
      ) : null}

      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </div>
  );
}

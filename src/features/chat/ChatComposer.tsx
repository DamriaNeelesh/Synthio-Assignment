import {
  ArrowUp,
  FileText,
  Mic,
  Paperclip,
  Square,
  X,
} from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { IconButton } from '../../components/IconButton';

interface ChatComposerProps {
  isGenerating: boolean;
  onSend: (content: string) => void;
  onStartVoice: () => void;
  onStop: () => void;
}

const MAX_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_FILE_SIZE = 16_000;

interface TextAttachment {
  content: string;
  name: string;
}

export function ChatComposer({
  isGenerating,
  onSend,
  onStartVoice,
  onStop,
}: ChatComposerProps) {
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<TextAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent = Boolean(draft.trim() || attachment);

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    resizeTextarea(event.target);
  }

  function submitMessage() {
    if (!hasContent || isGenerating) {
      return;
    }

    const attachmentLine = attachment
      ? `Context from ${attachment.name}:\n---\n${attachment.content}\n---${draft.trim() ? '\n\n' : ''}`
      : '';
    onSend(`${attachmentLine}${draft.trim()}`);
    setDraft('');
    setAttachment(null);
    setAttachmentError('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '';
      textareaRef.current.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submitMessage();
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setAttachmentError('');

    if (!file) {
      return;
    }
    if (file.size > MAX_CONTEXT_FILE_SIZE) {
      setAttachment(null);
      setAttachmentError('Choose a text file smaller than 16 KB.');
      return;
    }

    try {
      const content = await file.text();
      setAttachment({ content, name: file.name });
    } catch {
      setAttachment(null);
      setAttachmentError('That file could not be read.');
    }
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={handleSubmit}>
        {attachment ? (
          <div className="composer__attachment">
            <FileText aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>{attachment.name}</span>
            <button
              aria-label={`Remove ${attachment.name}`}
              onClick={() => {
                setAttachment(null);
                setAttachmentError('');
              }}
              type="button"
            >
              <X aria-hidden="true" size={14} strokeWidth={2} />
            </button>
          </div>
        ) : null}

        <textarea
          aria-label="Message Synthex"
          autoComplete="off"
          className="composer__input"
          disabled={isGenerating}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isGenerating ? 'Synthex is responding…' : 'Ask anything…'
          }
          ref={textareaRef}
          rows={1}
          value={draft}
        />

        <div className="composer__toolbar">
          <div className="composer__leading-actions">
            <input
              accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
              aria-label="Attach a text file"
              className="visually-hidden"
              onChange={(event) => void handleFileChange(event)}
              ref={fileInputRef}
              type="file"
            />
            <IconButton
              label="Attach a text file as context"
              onClick={() => fileInputRef.current?.click()}
              size="small"
            >
              <Paperclip size={20} strokeWidth={1.8} />
            </IconButton>
            <span className="composer__hint">
              Enter to send · Shift+Enter for a new line
            </span>
          </div>

          <div className="composer__trailing-actions">
            <IconButton
              label="Start a voice conversation"
              onClick={onStartVoice}
              size="medium"
              variant="outline"
            >
              <Mic size={19} strokeWidth={1.8} />
            </IconButton>
            {isGenerating ? (
              <IconButton
                label="Stop response"
                onClick={onStop}
                size="medium"
                variant="accent"
              >
                <Square fill="currentColor" size={13} strokeWidth={0} />
              </IconButton>
            ) : (
              <IconButton
                disabled={!hasContent}
                label="Send message"
                size="medium"
                type="submit"
                variant="accent"
              >
                <ArrowUp size={19} strokeWidth={2.1} />
              </IconButton>
            )}
          </div>
        </div>
        {attachmentError ? (
          <p className="composer__attachment-error" role="alert">
            {attachmentError}
          </p>
        ) : null}
      </form>
      <p className="composer__disclaimer">
        Synthex can make mistakes. Check important information.
      </p>
    </div>
  );
}

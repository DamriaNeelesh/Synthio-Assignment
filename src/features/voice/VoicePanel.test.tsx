import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoicePanel } from './VoicePanel';
import type {
  VoiceCallError,
  VoiceCallMode,
} from './voice.types';

const notice: VoiceCallError = {
  code: 'recognition-error',
  message:
    'Live transcription paused. The call remains available while recognition recovers.',
  recoverable: true,
};

afterEach(() => {
  cleanup();
});

function renderPanel(mode: VoiceCallMode) {
  return render(
    <VoicePanel
      assistantTranscript=""
      elapsedSeconds={12}
      error={notice}
      interimTranscript=""
      isModal={false}
      isMuted={false}
      mode={mode}
      onClose={vi.fn()}
      onEndCall={vi.fn()}
      onStartCall={vi.fn()}
      onToggleMute={vi.fn()}
      status="connected"
      userTranscript=""
    />,
  );
}

describe('VoicePanel', () => {
  it.each<VoiceCallMode>(['demo', 'live'])(
    'shows voice notices in %s mode',
    (mode) => {
      renderPanel(mode);

      expect(screen.getByText(notice.message)).toBeVisible();
    },
  );

  it('uses the Synthio Assistant name in the voice transcript', () => {
    render(
      <VoicePanel
        assistantTranscript="Your synthetic field brief is ready."
        elapsedSeconds={12}
        error={null}
        interimTranscript=""
        isModal={false}
        isMuted={false}
        mode="live"
        onClose={vi.fn()}
        onEndCall={vi.fn()}
        onStartCall={vi.fn()}
        onToggleMute={vi.fn()}
        status="speaking"
        userTranscript=""
      />,
    );

    expect(screen.getByText('Synthio Assistant')).toBeVisible();
  });
});

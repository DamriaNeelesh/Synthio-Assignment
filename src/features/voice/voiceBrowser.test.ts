import { describe, expect, it } from 'vitest';
import { joinTranscript, mapRecognitionError } from './voiceBrowser';

describe('voiceBrowser utilities', () => {
  it('joins transcript fragments without duplicate whitespace', () => {
    expect(joinTranscript('', '  hello there  ')).toBe('hello there');
    expect(joinTranscript('hello there', ' how are you? ')).toBe(
      'hello there how are you?',
    );
    expect(joinTranscript('hello there', '  ')).toBe('hello there');
  });

  it('maps a denied permission to the safe demo fallback error', () => {
    expect(
      mapRecognitionError({ error: 'not-allowed', message: '' }),
    ).toMatchObject({
      code: 'permission-denied',
      recoverable: true,
    });
  });

  it('does not surface expected aborted and no-speech events as errors', () => {
    expect(mapRecognitionError({ error: 'aborted', message: '' })).toBeNull();
    expect(mapRecognitionError({ error: 'no-speech', message: '' })).toBeNull();
  });
});

interface MessageContentProps {
  content: string;
}

interface NumberedItem {
  description: string;
  label: string;
  number: string;
}

type MessageBlock =
  | { content: string; type: 'paragraph' }
  | { items: NumberedItem[]; type: 'steps' };

const NUMBERED_ITEM = /^(\d+)\.\s+(.+?)(?:\s+\u2014\s+(.+))?$/u;

function createBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let paragraphLines: string[] = [];
  let numberedItems: NumberedItem[] = [];

  function flushParagraph() {
    const paragraph = paragraphLines.join('\n').trim();
    if (paragraph) {
      blocks.push({ content: paragraph, type: 'paragraph' });
    }
    paragraphLines = [];
  }

  function flushSteps() {
    if (numberedItems.length > 0) {
      blocks.push({ items: numberedItems, type: 'steps' });
    }
    numberedItems = [];
  }

  for (const line of content.split('\n')) {
    const trimmedLine = line.trim();
    const match = NUMBERED_ITEM.exec(trimmedLine);

    if (match) {
      flushParagraph();
      numberedItems.push({
        description: match[3] ?? '',
        label: match[2],
        number: match[1],
      });
      continue;
    }

    flushSteps();
    if (!trimmedLine) {
      flushParagraph();
      continue;
    }
    paragraphLines.push(line);
  }

  flushParagraph();
  flushSteps();
  return blocks;
}

export function MessageContent({ content }: MessageContentProps) {
  const blocks = createBlocks(content);

  return (
    <div className="message-content">
      {blocks.map((block, blockIndex) =>
        block.type === 'paragraph' ? (
          <p
            className="message-content__paragraph"
            key={`paragraph-${blockIndex}`}
          >
            {block.content}
          </p>
        ) : (
          <ol
            className="message-content__steps"
            key={`steps-${blockIndex}`}
          >
            {block.items.map((item, itemIndex) => (
              <li
                className="message-content__step"
                key={`${item.number}-${itemIndex}`}
              >
                <span
                  aria-hidden="true"
                  className="message-content__step-number"
                >
                  {item.number}
                </span>
                <span className="message-content__step-copy">
                  <strong>{item.label}</strong>
                  {item.description ? <span>{item.description}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}

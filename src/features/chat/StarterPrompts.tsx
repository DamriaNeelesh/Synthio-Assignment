import { ArrowUpRight } from 'lucide-react';
import {
  ERROR_TEST_PROMPT,
  STARTER_PROMPTS,
} from './starterPromptCatalog';

interface StarterPromptsProps {
  disabled?: boolean;
  onSelectPrompt: (prompt: string) => void;
}

export function StarterPrompts({
  disabled = false,
  onSelectPrompt,
}: StarterPromptsProps) {
  return (
    <section
      aria-labelledby="starter-prompts-heading"
      className="starter-prompts-section"
    >
      <h3 className="visually-hidden" id="starter-prompts-heading">
        One-click demo prompts
      </h3>
      <ul className="starter-prompts">
        {STARTER_PROMPTS.map(
          ({
            description,
            icon: PromptIcon,
            id,
            product,
            prompt,
            title,
          }) => (
            <li key={id}>
              <button
                aria-label={`Try ${product} prompt: ${title}`}
                aria-describedby={`starter-prompt-${id}-description`}
                className="starter-prompt"
                disabled={disabled}
                onClick={() => onSelectPrompt(prompt)}
                type="button"
              >
                <span aria-hidden="true" className="starter-prompt__icon">
                  <PromptIcon size={19} strokeWidth={1.8} />
                </span>
                <span className="starter-prompt__content">
                  <span className="starter-prompt__product">{product}</span>
                  <span className="starter-prompt__title">{title}</span>
                  <span
                    className="starter-prompt__description"
                    id={`starter-prompt-${id}-description`}
                  >
                    {description}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="starter-prompt__arrow"
                  size={16}
                  strokeWidth={1.8}
                />
              </button>
            </li>
          ),
        )}
      </ul>

      <div className="starter-prompts__reviewer-check">
        <span>Reviewer shortcut</span>
        <button
          aria-label="Simulate a retryable mock error"
          disabled={disabled}
          onClick={() => onSelectPrompt(ERROR_TEST_PROMPT)}
          type="button"
        >
          Simulate a retryable error
        </button>
      </div>
    </section>
  );
}

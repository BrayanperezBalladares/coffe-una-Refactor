import OptimizedImage from '../OptimizedImage/OptimizedImage';
import { ST } from '../T/ST';
import { Check } from 'lucide-react';

function formatNarrativeTitle(rawTitle) {
  if (!rawTitle) return '';
  const trimmed = String(rawTitle).trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'historia') return 'Nuestra Historia';
  if (lower === 'misión' || lower === 'mision') return 'Nuestra Misión';
  if (lower === 'visión' || lower === 'vision') return 'Nuestra Visión';

  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    return trimmed
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return trimmed;
}

function resolveEyebrow(rawEyebrow, title, defaultEyebrow = '') {
  const eb = String(rawEyebrow || '').trim();
  const t = String(title || '').trim();
  if (!eb) return defaultEyebrow;
  if (eb.toLowerCase() === t.toLowerCase()) return defaultEyebrow;
  return eb;
}

export function AboutNarrativeBlock({
  eyebrow = '',
  defaultEyebrow = '',
  title = '',
  description = '',
  image = '',
  reverse = false,
  className = '',
  highlights = [],
  badgeLabel = '',
  badgeIcon = null,
}) {
  const displayTitle = formatNarrativeTitle(title);
  const displayEyebrow = resolveEyebrow(eyebrow, title, defaultEyebrow);
  const hasCopy = Boolean(displayTitle || description || displayEyebrow);
  const hasImage = Boolean(image);
  if (!hasCopy && !hasImage) return null;

  const paragraphs = typeof description === 'string'
    ? description.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  const clases = [
    'about-narrative',
    reverse ? 'about-narrative--reverse' : '',
    hasImage ? 'about-narrative--with-media' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <article className={clases}>
      {hasCopy ? (
        <div className="about-narrative__copy">
          {displayEyebrow ? (
            <div className="about-narrative__badge">
              <span className="about-narrative__badge-dot" aria-hidden="true" />
              <p className="about-narrative__eyebrow"><ST>{displayEyebrow}</ST></p>
            </div>
          ) : null}
          {displayTitle ? <h2><ST>{displayTitle}</ST></h2> : null}
          {paragraphs.length > 0 ? (
            <div className="about-narrative__text">
              {paragraphs.map((parrafo, idx) => (
                <p
                  key={idx}
                  className={idx === 0 ? 'about-narrative__lead' : 'about-narrative__paragraph'}
                >
                  <ST>{parrafo}</ST>
                </p>
              ))}
            </div>
          ) : description ? (
            <p className="about-narrative__lead"><ST>{description}</ST></p>
          ) : null}
          {Array.isArray(highlights) && highlights.length > 0 ? (
            <ul className="about-narrative__highlights" aria-label="Aspectos destacados">
              {highlights.map((item, idx) => (
                <li key={idx} className="about-narrative__pill">
                  <Check size={13} className="about-narrative__pill-icon" aria-hidden="true" />
                  <span><ST>{item}</ST></span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {hasImage ? (
        <div className="about-narrative__media-container">
          <figure className="about-narrative__media">
            <OptimizedImage
              src={image}
              alt={displayTitle || ''}
              width={960}
              height={760}
              className="about-narrative__image"
            />
          </figure>
          {badgeLabel ? (
            <div className="about-narrative__floating-chip">
              {badgeIcon}
              <span><ST>{badgeLabel}</ST></span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

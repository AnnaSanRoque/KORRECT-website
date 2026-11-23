import { useEffect } from 'react';
import { Icon } from './MotoArt';

// A pop-up used for login results: banned, account missing, wrong credentials, etc.
// notice = { tone: 'danger' | 'warning' | 'info', title, text } or null
export default function NoticeModal({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notice, onClose]);

  if (!notice) return null;
  const IconTag = notice.tone === 'danger' ? Icon.Block : Icon.Alert;

  return (
    <div className="modal" role="presentation" onClick={onClose}>
      <div
        className={`modal__card modal__card--${notice.tone || 'warning'}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notice-title"
        aria-describedby="notice-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__icon"><IconTag width="30" height="30" /></div>
        <h2 id="notice-title">{notice.title}</h2>
        <p id="notice-text">{notice.text}</p>
        <button type="button" className="btn" onClick={onClose} autoFocus>
          <span>Okay</span>
        </button>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

// Where the APK file lives (unchanged from the original site).
// Default: KORRECT-v1.0.3.apk inside the project's "public" folder.
const APK_URL = '/KORRECT-v1.0.3.apk';
const APK_FILENAME = 'KORRECT-v1.0.3.apk';

export default function Download({ session }) {
  function handleDownload() {
    const link = document.createElement('a');
    link.href = APK_URL;
    link.download = APK_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section className="page-hero page-hero--center page-hero--tall">
      <div className="wrap wrap--narrow">
        <p className="eyebrow">Your riding journey starts here</p>
        <h1>Download KORRECT</h1>
        <p className="page-hero__lead">
          KORRECT is a mobile motorcycle simulation focused on beginner-friendly learning, guided missions and safe riding practices.
        </p>

        {!session ? (
          <>
            <p className="lead-text">Please log in to your account before downloading the game.</p>
            <Link to="/play" className="btn btn--lg"><span>Log in to download</span></Link>
          </>
        ) : (
          <>
            <p className="lead-text">
              You are logged in and the APK is ready. After downloading, open the file on your Android phone. If asked, allow installing apps from this source.
            </p>
            <button type="button" className="btn btn--lg" onClick={handleDownload}><span>Download APK</span></button>
            <p className="fineprint">{APK_FILENAME}</p>
          </>
        )}
      </div>
    </section>
  );
}

export default function LoginTitle() {
  return (
    <>
      {/* Same inline SVG brand mark as the app header — no external image
          request on the unauthenticated login page. */}
      <div className="tm-login-mark">
        <svg viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 10H6L8.5 3L13 17L15.5 10H25" stroke="#F1EDE4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1>Theramotion</h1>
      <p className="tm-login-eyebrow">Clinical Portal</p>
    </>
  );
}

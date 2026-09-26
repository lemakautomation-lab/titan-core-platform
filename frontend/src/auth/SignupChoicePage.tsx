import { Link } from "react-router-dom";

export default function SignupChoicePage() {
  return (
    <main className="titan-signup-choice">
      <span className="titan-eyebrow">START YOUR JOURNEY</span>
      <h1>Create your TITAN Health account</h1>
      <p>Choose how you will use TITAN Health. Your selection does not grant paid or professional access.</p>
      <div className="titan-signup-options">
        <Link to="/signup/athlete"><strong>Athlete</strong><span>Track your training and performance.</span></Link>
        <Link to="/signup/trainer"><strong>Trainer</strong><span>Build your professional profile.</span></Link>
        <div><strong>Coach</strong><span>Coach registration and approval are being prepared.</span></div>
        <div><strong>Club or organisation manager</strong><span>Organisation registration and approval are being prepared.</span></div>
      </div>
      <p><Link to="/login">Back to sign in</Link></p>
    </main>
  );
}

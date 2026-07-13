export const metadata = { title: "Privacy Policy | Pet Tag ID" };

export default function PrivacyPage() {
  return (
    <article className="card legal-page">
      <h1>Privacy Policy</h1>
      <p className="muted">Effective July 13, 2026</p>
      <p>This policy explains how Pet Tag ID collects and uses information when pet owners register tags and when finders scan them.</p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information, including email address and authentication records.</li>
        <li>Pet profile information submitted by an owner, including photos, descriptions, and selected contact details.</li>
        <li>Tag activation, status, and scan records.</li>
        <li>A finder's precise location only when the finder presses the location-sharing button and grants device permission.</li>
        <li>Limited technical and security information, such as browser type and a protected representation of an IP address.</li>
      </ul>

      <h2>How we use information</h2>
      <p>We use information to operate the tag service, display the pet profile chosen by the owner, help a finder contact the owner, send scan and location alerts, prevent abuse, provide support, and maintain service security.</p>

      <h2>Public pet profiles</h2>
      <p>Anyone who scans an active tag can view the pet profile. Owners control whether phone numbers and a general address appear publicly. Do not add information that should remain private.</p>

      <h2>Finder location</h2>
      <p>Precise coordinates are not collected automatically. They are collected only after an affirmative action and device permission, then shared with the registered owner and stored with the scan record.</p>

      <h2>Service providers and disclosure</h2>
      <p>We use hosting, database, authentication, storage, and email providers to operate the service. We may also disclose information when required by law, to protect users, or in connection with a business transfer. We do not sell precise location information.</p>

      <h2>Retention and security</h2>
      <p>We retain information while it is needed to provide the service, meet legal obligations, resolve disputes, and prevent abuse. We use access controls, encrypted connections, restricted administrative access, and other reasonable safeguards. No online system can guarantee absolute security.</p>

      <h2>Your choices and rights</h2>
      <p>Owners can update profile visibility and pet information from their account. Depending on location, users may request access, correction, deletion, or a copy of personal information by contacting customer support through the support address provided on our website or at purchase.</p>

      <h2>Children and international use</h2>
      <p>The service is not directed to children under 13. Information may be processed in countries other than the user's home country, subject to applicable safeguards.</p>

      <h2>Changes and contact</h2>
      <p>We may update this policy and will post the revised effective date here. Questions and privacy requests may be sent to the customer support address shown on our website or order materials.</p>
    </article>
  );
}

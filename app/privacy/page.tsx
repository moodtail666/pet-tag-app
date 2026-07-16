import { getSiteSettings } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <article className="card legal-page">
      <h1>Privacy Policy</h1>
      <p className="muted">Effective July 16, 2026</p>
      <p>{settings.businessName} operates the {settings.brandName} pet identification service. This policy explains how we handle information from pet owners, account holders, and people who scan a tag.</p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information, including email address, authentication records, and acceptance of our legal terms.</li>
        <li>Pet profiles provided by owners, including photos, descriptions, and selected contact details.</li>
        <li>Tag activation, status, and scan records.</li>
        <li>A finder's precise coordinates only after the finder presses the location-sharing button and grants device permission.</li>
        <li>Limited device and security information, such as browser type and a one-way protected representation of an IP address.</li>
      </ul>

      <h2>How we use information</h2>
      <p>We use information to operate and secure the service, activate tags, display owner-selected pet profiles, help finders contact owners, send scan and location alerts, prevent abuse, respond to support requests, and comply with law.</p>

      <h2>Public pet profiles</h2>
      <p>Anyone with a tag's QR code can view its active pet profile. Owners choose whether phone numbers and a home area appear. Owners should not enter information they do not want a finder to see.</p>

      <h2>Finder location</h2>
      <p>We do not collect precise coordinates merely because someone scans a tag. A finder must press the share-location button and approve the browser permission. The coordinates are then shared with the registered owner and retained with the scan record. We do not sell precise location information.</p>

      <h2>Service providers and disclosure</h2>
      <p>We use service providers for hosting, databases, authentication, file storage, email delivery, security, and support. They process information for us under their applicable terms. We may disclose information when required by law, to protect users or the service, or as part of a business transaction.</p>

      <h2>Retention</h2>
      <p>Account and pet profile information is retained while the account is active. Replaced photos are removed, and account deletion removes pet profiles, stored photos, and associated scan history. Security attempts are retained briefly, and scan records are generally retained for no more than 24 months unless a longer period is reasonably required for security, disputes, or law.</p>

      <h2>Security</h2>
      <p>We use encrypted connections, restricted administrative access, verified account email addresses, access controls, upload limits, and abuse monitoring. No online service can guarantee absolute security.</p>

      <h2>Your choices and rights</h2>
      <p>Owners can edit profile visibility, download a copy of their data, and delete their account from the account page. Depending on where you live, you may also request access, correction, deletion, or portability, and may appeal a denied privacy request. We do not sell personal information or share it for cross-context behavioral advertising.</p>

      <h2>Children and international processing</h2>
      <p>The service is not directed to children under 13, and children under 13 may not create accounts. Information may be processed in countries other than the user's home country, subject to applicable safeguards.</p>

      <h2>Changes and contact</h2>
      <p>We may update this policy and will post a revised effective date. Privacy questions and requests can be sent to <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>.</p>
    </article>
  );
}

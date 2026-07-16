import { getSiteSettings } from "@/lib/site";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getSiteSettings();
  return (
    <article className="card legal-page">
      <h1>Terms of Service</h1>
      <p className="muted">Effective July 16, 2026</p>
      <p>These terms govern the {settings.brandName} service operated by {settings.businessName}. By creating an account or activating a tag, you agree to these terms.</p>

      <h2>The service</h2>
      <p>{settings.brandName} connects a physical QR tag to an owner-managed pet profile. A finder can scan the tag to view owner-selected contact information and may voluntarily share a location.</p>

      <h2>Important limitation</h2>
      <p>The tag is not a GPS tracker, emergency service, microchip replacement, or guarantee that a missing pet will be found. A location is available only when a finder voluntarily shares it from a compatible device. Owners remain responsible for supervision and applicable identification or licensing requirements.</p>

      <h2>Accounts and activation</h2>
      <ul>
        <li>You must be at least 13 and legally able to agree to these terms.</li>
        <li>You must provide accurate information and keep contact details current.</li>
        <li>You are responsible for your account credentials and access to unregistered physical tags.</li>
        <li>You may activate only tags and manage only pets you are authorized to control.</li>
      </ul>

      <h2>Public content</h2>
      <p>You keep ownership of information and photos you submit. You give us permission to host and display that content only as needed to provide the service. Do not upload unlawful content, another person's confidential information, or material that infringes intellectual property or privacy rights.</p>

      <h2>Prohibited conduct</h2>
      <p>You may not probe or disrupt the service, bypass access controls, automate abusive requests, impersonate another person, harvest public profiles, upload harmful material, or use the service for unlawful tracking, harassment, fraud, or surveillance.</p>

      <h2>Availability and enforcement</h2>
      <p>We may maintain or change features and may suspend accounts or tags that are fraudulent, unlawful, unsafe, or harmful to the service or other users. We will use reasonable efforts to preserve access, but uninterrupted availability is not guaranteed.</p>

      <h2>Disclaimers and liability</h2>
      <p>To the extent permitted by law, the service is provided on an "as available" basis. We are not responsible for a finder's conduct, incorrect owner-provided information, device or network failures, or events outside our reasonable control. Nothing in these terms excludes rights or remedies that cannot legally be excluded.</p>

      <h2>Account termination</h2>
      <p>Owners may delete their account from the account page. Deletion removes pet profiles and releases registered tags so they can be registered again by scanning their QR codes.</p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will post a revised effective date. Material changes apply prospectively. Questions can be sent to <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>.</p>
    </article>
  );
}

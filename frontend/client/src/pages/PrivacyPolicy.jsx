import { LegalPage } from "../components/info/LegalPage";

const sections = [
  {
    title: "Introduction",
    blocks: [
      {
        type: "p",
        text: "Lifebookz (\"we\", \"us\", or \"our\") operates a digital storytelling platform that lets you preserve, publish, and share your life stories. This Privacy Policy explains what personal information we collect, how we use it, and the choices you have over your data. By using Lifebookz, you agree to the practices described in this policy.",
      },
    ],
  },
  {
    title: "Information We Collect",
    blocks: [
      { type: "p", text: "We collect information you provide directly, information generated as you use the platform, and limited information from third parties:" },
      {
        type: "list",
        items: [
          "Account information — your name, email address, profile photo, and other details you add to your profile when you register or update your account.",
          "Content you create — stories, comments, testimonials, and any other content you submit, along with metadata such as publication date and settings.",
          "Usage information — pages you visit, features you use, search queries, and how you interact with stories.",
          "Device and technical information — browser type, operating system, IP address, and device identifiers collected automatically.",
          "Communications — messages you send us through support, forms, or email.",
        ],
      },
    ],
  },
  {
    title: "How We Use Your Information",
    blocks: [
      { type: "p", text: "We use the information we collect to operate and improve Lifebookz, including to:" },
      {
        type: "list",
        items: [
          "Provide, personalize, and maintain the platform and its features.",
          "Process your registration and manage your account.",
          "Power features like writing assistance, story suggestions, search, and recommendations.",
          "Send you service updates, newsletters, or other communications you have opted into.",
          "Detect, prevent, and address fraud, abuse, security, or technical issues.",
          "Comply with legal obligations and enforce our Terms of Service and Content Policy.",
        ],
      },
    ],
  },
  {
    title: "How We Share Information",
    blocks: [
      { type: "p", text: "We do not sell your personal information. We share data only in limited circumstances:" },
      {
        type: "list",
        items: [
          "Service providers — trusted companies that help us host, store, secure, analyze, or deliver the platform, bound by confidentiality obligations.",
          "Public content — stories and comments you choose to publish are visible to other users as part of the service.",
          "Legal requirements — when required by law, regulation, or valid legal process, or to protect the rights, safety, and property of Lifebookz, our users, or the public.",
          "Business transfers — in connection with a merger, acquisition, or sale of assets, with notice where feasible.",
          "With your consent — when you ask us to share information for a specific purpose.",
        ],
      },
    ],
  },
  {
    title: "Cookies & Similar Technologies",
    blocks: [
      {
        type: "p",
        text: "We use cookies and similar technologies to keep you signed in, remember your preferences, understand how the platform is used, and improve your experience. You can control cookies through your browser settings; however, disabling certain cookies may affect how the platform functions.",
      },
    ],
  },
  {
    title: "Data Security",
    blocks: [
      {
        type: "p",
        text: "We take reasonable technical and organizational measures to protect your information — including encryption in transit, hashed credentials, and access controls. No method of transmission or storage is completely secure, so while we work hard to safeguard your data, we cannot guarantee absolute security.",
      },
    ],
  },
  {
    title: "Data Retention",
    blocks: [
      {
        type: "p",
        text: "We keep your personal information for as long as your account is active or as needed to provide the service, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete content or close your account, we remove or anonymize your data where possible.",
      },
    ],
  },
  {
    title: "Your Rights & Choices",
    blocks: [
      { type: "p", text: "Depending on where you live, you may have rights over your personal information, including:" },
      {
        type: "list",
        items: [
          "Access and obtain a copy of the personal data we hold about you.",
          "Correct inaccurate or incomplete information.",
          "Delete your account and associated data.",
          "Object to or restrict certain processing activities.",
          "Data portability — receive your data in a structured, machine-readable format.",
          "Withdraw consent at any time where processing is based on consent.",
        ],
      },
      {
        type: "p",
        text: "To exercise these rights, contact us at the address below. We will respond within the timeframe required by applicable law. You may also have the right to lodge a complaint with your local data protection authority.",
      },
    ],
  },
  {
    title: "Children's Privacy",
    blocks: [
      {
        type: "p",
        text: "Lifebookz is not directed to children under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will take steps to delete it.",
      },
    ],
  },
  {
    title: "Third-Party Links",
    blocks: [
      {
        type: "p",
        text: "Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites, and we encourage you to review their privacy policies before providing any information.",
      },
    ],
  },
  {
    title: "Changes to This Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or through the platform before the changes take effect. Your continued use of Lifebookz after the updated policy is posted constitutes acceptance of the revised terms.",
      },
    ],
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="How Lifebookz collects, uses, and protects your personal information."
      updated="August 5, 2026"
      sections={sections}
    />
  );
}

export default PrivacyPolicyPage;

import { LegalPage } from "../components/info/LegalPage";

const sections = [
  {
    title: "Acceptance of Terms",
    blocks: [
      {
        type: "p",
        text: "Welcome to Lifebookz. These Terms of Service (\"Terms\") govern your access to and use of the Lifebookz platform, including our websites, applications, and services. By creating an account or using the platform, you agree to be bound by these Terms and our Privacy Policy and Content Policy. If you do not agree, please do not use the platform.",
      },
    ],
  },
  {
    title: "Eligibility",
    blocks: [
      {
        type: "p",
        text: "You must be at least 13 years old (or 16 in the European Economic Area) to use Lifebookz. By using the platform, you represent that you meet this requirement and that your use complies with the laws of your jurisdiction.",
      },
    ],
  },
  {
    title: "Your Account",
    blocks: [
      {
        type: "list",
        items: [
          "You are responsible for maintaining the confidentiality of your account credentials.",
          "You must provide accurate and complete information when creating an account and keep it up to date.",
          "You may not create accounts for others without authorization or impersonate another person.",
          "You are responsible for all activity that occurs under your account. Notify us immediately of any unauthorized use.",
        ],
      },
    ],
  },
  {
    title: "Use of the Service",
    blocks: [
      {
        type: "p",
        text: "We grant you a limited, non-exclusive, non-transferable, revocable license to use the platform for personal, non-commercial purposes, subject to these Terms. You agree not to misuse the platform, including by attempting to access it through unauthorized means, interfering with its operation, or circumventing any security or rate-limiting measures.",
      },
    ],
  },
  {
    title: "User Content",
    blocks: [
      {
        type: "p",
        text: "You retain ownership of the stories and other content you submit to Lifebookz. By publishing content, you grant us a worldwide, royalty-free license to host, store, display, reproduce, and distribute that content to operate and promote the platform.",
      },
      {
        type: "p",
        text: "You are solely responsible for the content you publish and for ensuring it does not violate these Terms, our Content Policy, or any applicable law. Content you publish may be visible to other users, so think carefully about what you share.",
      },
    ],
  },
  {
    title: "Acceptable Use",
    blocks: [
      {
        type: "p",
        text: "All content and behavior on Lifebookz must comply with our Content Policy, which is incorporated into these Terms by reference. Prohibited activities include publishing content that is unlawful, harassing, defamatory, or infringing, or that violates the privacy or rights of others.",
      },
    ],
  },
  {
    title: "Intellectual Property",
    blocks: [
      {
        type: "p",
        text: "The Lifebookz name, logo, design, and all platform software and materials are owned by Lifebookz or its licensors and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works from them without our prior written permission.",
      },
    ],
  },
  {
    title: "AI-Assisted Features",
    blocks: [
      {
        type: "p",
        text: "Lifebookz may offer writing assistance and other features powered by artificial intelligence. AI-generated suggestions are provided to help you write and are not a substitute for your own judgment. You are responsible for reviewing and taking ownership of the final content you publish.",
      },
    ],
  },
  {
    title: "Third-Party Links & Services",
    blocks: [
      {
        type: "p",
        text: "The platform may link to third-party websites or services that we do not control. We are not responsible for their content, availability, or practices. Accessing third-party services is at your own risk.",
      },
    ],
  },
  {
    title: "Termination",
    blocks: [
      {
        type: "p",
        text: "You may stop using Lifebookz and delete your account at any time. We may suspend or terminate your access, remove content, or close your account if we reasonably believe you have violated these Terms or our Content Policy, or if continued access would harm the platform or other users. Upon termination, your right to use the platform ceases, and we may delete your data as described in our Privacy Policy.",
      },
    ],
  },
  {
    title: "Disclaimers",
    blocks: [
      {
        type: "p",
        text: "Lifebookz is provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the platform will be uninterrupted, error-free, or free of harmful components.",
      },
    ],
  },
  {
    title: "Limitation of Liability",
    blocks: [
      {
        type: "p",
        text: "To the maximum extent permitted by law, Lifebookz shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill, arising out of or related to your use of the platform. Our total liability for any claim shall not exceed the amount you paid us, if any, in the twelve months preceding the claim.",
      },
    ],
  },
  {
    title: "Indemnification",
    blocks: [
      {
        type: "p",
        text: "You agree to indemnify and hold harmless Lifebookz, its affiliates, and their officers, employees, and agents from any claims, damages, liabilities, and expenses arising out of your use of the platform, your content, or your violation of these Terms.",
      },
    ],
  },
  {
    title: "Governing Law & Disputes",
    blocks: [
      {
        type: "p",
        text: "These Terms are governed by the laws of your jurisdiction, without regard to conflict-of-law principles. Any disputes arising from these Terms or your use of the platform shall be resolved through good-faith negotiation first, and then through the courts of competent jurisdiction.",
      },
    ],
  },
  {
    title: "Changes to These Terms",
    blocks: [
      {
        type: "p",
        text: "We may revise these Terms from time to time. Material changes will be announced on the platform or by email. Continued use of Lifebookz after changes take effect means you accept the updated Terms.",
      },
    ],
  },
];

export function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      description="The rules and guidelines that govern your use of the Lifebookz platform."
      updated="August 5, 2026"
      sections={sections}
    />
  );
}

export default TermsOfServicePage;

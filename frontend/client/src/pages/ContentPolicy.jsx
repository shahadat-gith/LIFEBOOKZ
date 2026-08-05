import { LegalPage } from "../components/info/LegalPage";

const sections = [
  {
    title: "Our Commitment",
    blocks: [
      {
        type: "p",
        text: "Lifebookz exists to preserve personal stories and build a respectful community around them. This Content Policy describes what is allowed on the platform and what we will remove. It applies to all content you publish — including stories, comments, testimonials, profile details, and images — as well as to how you interact with others.",
      },
    ],
  },
  {
    title: "Community Standards",
    blocks: [
      {
        type: "list",
        items: [
          "Be respectful — treat every author and reader with dignity, even when you disagree.",
          "Be authentic — share your own stories and experiences, and give credit where it is due.",
          "Protect privacy — never publish others' personal information without consent.",
          "Write with care — personal stories are deeply meaningful to the people who share them.",
        ],
      },
    ],
  },
  {
    title: "Prohibited Content",
    blocks: [
      {
        type: "p",
        text: "The following types of content are not permitted on Lifebookz. We may remove such content, and we may suspend or terminate accounts that repeatedly violate this policy:",
      },
      {
        type: "h3",
        text: "Privacy & Doxxing",
      },
      {
        type: "p",
        text: "Because Lifebookz hosts personal life stories, privacy violations are taken especially seriously. Do not publish someone's address, phone number, financial details, or other private information without their explicit consent.",
      },
      {
        type: "h3",
        text: "Hate Speech & Discrimination",
      },
      {
        type: "p",
        text: "Content that attacks or demeans individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics is prohibited.",
      },
      {
        type: "h3",
        text: "Harassment & Bullying",
      },
      {
        type: "p",
        text: "Do not harass, bully, shame, or systematically target individuals. This includes stalking, malicious shaming, and coordinated abuse.",
      },
      {
        type: "h3",
        text: "Violence & Threats",
      },
      {
        type: "p",
        text: "Content that promotes, glorifies, or threatens violence — including self-harm — is prohibited. If someone is in immediate danger, please contact local emergency services.",
      },
      {
        type: "h3",
        text: "Illegal Activity",
      },
      {
        type: "p",
        text: "Content that facilitates or encourages illegal activity is not allowed.",
      },
      {
        type: "h3",
        text: "Sexually Explicit Content",
      },
      {
        type: "p",
        text: "Sexually explicit content and content that sexualizes minors are strictly prohibited. Content involving minors is reported to the appropriate authorities.",
      },
      {
        type: "h3",
        text: "Plagiarism & Impersonation",
      },
      {
        type: "p",
        text: "Publish only content you have the right to share. Do not copy others' work without permission, and do not impersonate real people or organizations.",
      },
      {
        type: "h3",
        text: "Misinformation & Deceptive Content",
      },
      {
        type: "p",
        text: "Content that is designed to mislead, deceive, or manipulate readers — including deceptive AI-generated content presented as fact — is prohibited.",
      },
      {
        type: "h3",
        text: "Spam & Manipulation",
      },
      {
        type: "p",
        text: "Do not post spam, repeatedly self-promote, artificially inflate engagement, or attempt to manipulate recommendations and rankings.",
      },
      {
        type: "h3",
        text: "Harm to Minors",
      },
      {
        type: "p",
        text: "Content that exploits, endangers, or sexualizes minors is prohibited and will be reported to law enforcement where required.",
      },
    ],
  },
  {
    title: "AI & Authenticity",
    blocks: [
      {
        type: "p",
        text: "Lifebookz supports AI-assisted writing tools, but authenticity is central to personal storytelling. Clearly indicate when content is substantially generated or edited by AI, and never use AI to misrepresent yourself, your experiences, or other people.",
      },
    ],
  },
  {
    title: "Reporting Violations",
    blocks: [
      {
        type: "p",
        text: "If you see content that violates this policy, please report it through the report option on the content or by contacting us at support@lifebookz.com. Include the reason and, where possible, a link to the content. We review reports as quickly as we can.",
      },
    ],
  },
  {
    title: "Moderation & Enforcement",
    blocks: [
      {
        type: "p",
        text: "We review reported content and may also use automated tools to detect violations. Depending on the severity, enforcement may include:",
      },
      {
        type: "list",
        items: [
          "Removal of the violating content.",
          "A warning or temporary restriction on the account.",
          "Suspension or permanent termination of the account.",
          "Reporting to law enforcement for serious violations involving safety or minors.",
        ],
      },
    ],
  },
  {
    title: "Appeals",
    blocks: [
      {
        type: "p",
        text: "If you believe your content was removed or your account was restricted in error, you may appeal by contacting us at support@lifebookz.com. We will review the decision and respond with the outcome of the review.",
      },
    ],
  },
  {
    title: "Changes to This Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this Content Policy as the platform evolves. Material changes will be announced on the platform or by email. Continued use of Lifebookz after changes take effect means you accept the updated policy.",
      },
    ],
  },
];

export function ContentPolicyPage() {
  return (
    <LegalPage
      eyebrow="Community"
      title="Content Policy"
      description="What is welcome on Lifebookz — and what we will remove to keep every story safe."
      updated="August 5, 2026"
      sections={sections}
    />
  );
}

export default ContentPolicyPage;

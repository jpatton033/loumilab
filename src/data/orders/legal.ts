/**
 * Loumilab Orders legal documents.
 *
 * Held as structured data so the Terms and Privacy pages share one renderer and
 * the version stamp lives in a single place. `AGREEMENT_VERSION` is what gets
 * recorded when a merchant agrees — bump it when the wording materially changes
 * and merchants will be asked to agree again.
 */

export const AGREEMENT_VERSION = "2026-09-07";
export const AGREEMENT_EFFECTIVE_DATE = "September 7, 2026";
export const AGREEMENT_LAST_UPDATED = "September 7, 2026";

export const TERMS_PATH = "/orders/terms";
export const PRIVACY_PATH = "/orders/privacy";

export interface LegalSection {
  title: string;
  /** Paragraphs. A block starting with "- " renders as a bullet. */
  blocks: string[];
}

export interface LegalDocument {
  title: string;
  intro: string[];
  sections: LegalSection[];
}

export const ORDERS_TERMS: LegalDocument = {
  title: "Loumilab Orders Terms & Conditions",
  intro: [
    "These Terms & Conditions (“Terms”) govern your access to and use of Loumilab Orders, including Loumilab Orders websites, merchant storefronts, ordering functionality, merchant tools, dashboards, payment-related features, communications, and related services (collectively, the “Services”).",
    "Loumilab Orders is operated by Loumilab (“Loumilab,” “we,” “us,” or “our”).",
    "By accessing or using the Services, creating an account, creating a merchant storefront, placing an order, or otherwise interacting with Loumilab Orders, you acknowledge that you have read, understood, and agree to these Terms.",
    "If you do not agree to these Terms, do not use the Services.",
  ],
  sections: [
    {
      title: "1. About Loumilab Orders",
      blocks: [
        "Loumilab Orders is a technology platform designed to enable participating businesses (“Merchants”) to create and operate digital storefronts, display products or services, receive and manage orders, and access payment-related functionality.",
        "Customers (“Customers”) may use participating Merchant storefronts to browse available offerings, submit orders, make payments, and interact with Merchants.",
        "Unless expressly stated otherwise, Loumilab provides the technology platform facilitating these interactions. The Merchant, rather than Loumilab, is the seller or provider of the products or services offered through a Merchant storefront.",
        "“User” refers collectively to Merchants, Customers, and other persons using the Services.",
      ],
    },
    {
      title: "2. Eligibility",
      blocks: [
        "You must be legally capable of entering into a binding agreement to use the Services.",
        "If you use Loumilab Orders on behalf of a company, organization, or other legal entity, you represent that you have authority to bind that entity to these Terms.",
        "Certain products, services, payment methods, or functionality may have additional eligibility requirements.",
        "You may not use Loumilab Orders where doing so would violate applicable law.",
      ],
    },
    {
      title: "3. Accounts",
      blocks: [
        "Certain Services require an account.",
        "You agree to provide accurate, current, and complete information and to keep your information reasonably updated.",
        "You are responsible for maintaining the confidentiality and security of your account credentials and for activity conducted through your account.",
        "You may not:",
        "- Impersonate another person or business;",
        "- Create accounts using false or misleading information;",
        "- Share credentials in a manner that compromises account security;",
        "- Attempt to gain unauthorized access to another account; or",
        "- Use Loumilab Orders for unlawful, deceptive, fraudulent, or abusive purposes.",
        "Notify Loumilab promptly if you believe your account has been compromised.",
      ],
    },
    {
      title: "4. Merchant Accounts",
      blocks: [
        "Merchants may be required to provide information concerning their business, identity, ownership, contact information, products or services, fulfillment methods, payment information, and other information reasonably necessary to operate through Loumilab Orders.",
        "Merchants are responsible for ensuring that information provided through their account or storefront is accurate.",
        "Loumilab may require additional information or verification before allowing a Merchant to publish a storefront, accept orders, receive payments or payouts, or access certain functionality.",
        "Registration or creation of a storefront does not guarantee that a Merchant will be permitted to publish or transact through Loumilab Orders.",
      ],
    },
    {
      title: "5. Merchant Storefronts",
      blocks: [
        "Loumilab Orders may allow Merchants to create customer-facing storefronts hosted through the Loumilab platform.",
        "Merchants are responsible for their storefront content, including:",
        "- Business names;",
        "- Logos and branding;",
        "- Photographs;",
        "- Product and service descriptions;",
        "- Pricing;",
        "- Availability;",
        "- Ingredients or product characteristics;",
        "- Allergen or dietary information;",
        "- Fulfillment information;",
        "- Business hours;",
        "- Refund or cancellation information; and",
        "- Other Merchant-provided information.",
        "Merchants represent that they have all necessary rights and permissions to upload and use their content.",
        "Loumilab may remove or restrict content that violates these Terms, applicable law, intellectual-property rights, platform requirements, or the rights or safety of others.",
      ],
    },
    {
      title: "6. Publishing a Storefront",
      blocks: [
        "Creating a storefront does not necessarily make it publicly available.",
        "Merchants may be required to complete specified setup requirements before publication, including payment setup, business information, products or services, and other required configuration.",
        "When a Merchant intentionally publishes a storefront, the Merchant authorizes Loumilab to make the storefront and its associated public information available to Customers.",
        "Loumilab may temporarily restrict, unpublish, suspend, or disable a storefront when reasonably necessary for security, legal, payment, fraud-prevention, policy, or operational purposes.",
      ],
    },
    {
      title: "7. Products and Services",
      blocks: [
        "Merchants are solely responsible for the legality, quality, safety, accuracy, preparation, provision, and fulfillment of the products and services they offer.",
        "Merchants may not offer prohibited or unlawful products or services through Loumilab Orders.",
        "Loumilab may establish additional restrictions regarding categories of products or services that may be offered through the platform.",
      ],
    },
    {
      title: "8. Food Merchants",
      blocks: [
        "Food Merchants are solely responsible for food preparation, sanitation, food safety, licensing, permits, ingredients, allergen disclosures, temperature control, packaging, and compliance with applicable health and food-service requirements.",
        "Customers with allergies or dietary restrictions should contact the Merchant directly before ordering.",
        "Loumilab does not independently prepare, handle, inspect, or guarantee food offered by Merchants.",
      ],
    },
    {
      title: "9. Customer Orders",
      blocks: [
        "Submitting an order constitutes a request to purchase products or services from the applicable Merchant.",
        "Orders may be subject to Merchant acceptance, availability, payment authorization, operating hours, fulfillment capacity, and other applicable conditions.",
        "An electronic confirmation does not necessarily guarantee that every requested product or service will be available.",
        "Merchants are responsible for fulfilling accepted orders.",
      ],
    },
    {
      title: "10. Pricing",
      blocks: [
        "Merchants generally determine the prices of their products or services.",
        "Prices displayed through Loumilab Orders may differ from prices available through other channels.",
        "Before submitting an order, Customers should review the applicable subtotal, taxes, fees, delivery or fulfillment charges, tips, and other charges displayed at checkout.",
        "By submitting an order, the Customer authorizes collection of the displayed amount, subject to any permitted adjustments disclosed during checkout.",
      ],
    },
    {
      title: "11. Payments",
      blocks: [
        "Loumilab Orders may use third-party payment service providers, including Stripe, to facilitate payment processing and Merchant payouts.",
        "Payment information may therefore be collected and processed directly by the applicable payment provider.",
        "Use of payment functionality may be subject to additional terms imposed by the payment provider.",
        "Loumilab does not guarantee that every payment method will always be available.",
        "Transactions may be declined, delayed, reviewed, reversed, or otherwise affected by payment providers, financial institutions, fraud-prevention systems, legal requirements, or other circumstances outside Loumilab's reasonable control.",
      ],
    },
    {
      title: "12. Merchant Fees and Subscription Plans",
      blocks: [
        "Merchants may be charged subscription fees, platform fees, transaction-related fees, or other charges according to the Loumilab Orders plan selected by the Merchant.",
        "Applicable pricing and plan features will be disclosed during signup, subscription selection, or within the Merchant dashboard.",
        "Payment-processing fees imposed by payment providers may be separate from Loumilab's fees.",
        "Loumilab may modify plans, pricing, or platform fees upon reasonable notice as required by applicable law or contractual commitments.",
      ],
    },
    {
      title: "13. Taxes",
      blocks: [
        "Merchants are responsible for determining their tax obligations arising from their business activities and use of Loumilab Orders unless applicable law expressly places a particular obligation on Loumilab.",
        "Loumilab may provide technology that assists with tax calculation or collection but does not provide tax, accounting, or legal advice.",
      ],
    },
    {
      title: "14. Pickup and Delivery",
      blocks: [
        "Merchants may offer pickup, delivery, shipping, service appointments, or other fulfillment options.",
        "Estimated preparation, pickup, delivery, shipping, or service times are estimates unless expressly stated otherwise.",
        "Merchants are responsible for fulfilling orders according to the options they make available.",
        "Where third-party delivery or fulfillment providers are used, additional terms may apply.",
      ],
    },
    {
      title: "15. Cancellations, Refunds, and Disputes",
      blocks: [
        "Orders should be reviewed carefully before submission.",
        "Cancellation and refund eligibility may depend on the Merchant's policies, the status of the order, the nature of the product or service, and applicable law.",
        "A refund request does not automatically guarantee a refund.",
        "Loumilab may provide tools for requesting or reviewing refunds and disputes. Where Loumilab becomes involved in a platform-related refund review, Loumilab may consider the circumstances of the transaction, Merchant information, Customer information, payment-provider requirements, and applicable law.",
        "Nothing in these Terms eliminates consumer rights that cannot legally be waived.",
      ],
    },
    {
      title: "16. Promotions and Discounts",
      blocks: [
        "Loumilab or participating Merchants may occasionally provide promotional offers, discounts, credits, or promotional codes.",
        "Promotions may:",
        "- Have expiration dates;",
        "- Apply only to selected Merchants or Users;",
        "- Require minimum purchases;",
        "- Be limited to one use;",
        "- Exclude certain products or services; or",
        "- Be subject to additional terms.",
        "Promotions have no cash value unless required by law.",
        "Loumilab may cancel or restrict promotions that are obtained or used fraudulently or contrary to their applicable terms.",
      ],
    },
    {
      title: "17. Merchant Responsibilities",
      blocks: [
        "Merchants are independent businesses responsible for operating their businesses lawfully.",
        "Each Merchant is responsible for obtaining and maintaining applicable:",
        "- Licenses;",
        "- Permits;",
        "- Registrations;",
        "- Insurance;",
        "- Professional credentials;",
        "- Food-service approvals;",
        "- Tax registrations; and",
        "- Other legally required authorizations.",
        "Loumilab's acceptance of a Merchant onto the platform does not constitute legal, regulatory, tax, professional, or licensing approval.",
      ],
    },
    {
      title: "18. Independent Businesses",
      blocks: [
        "Except where Loumilab expressly states otherwise, Merchants are independent businesses and are not employees, agents, franchisees, joint venturers, or legal representatives of Loumilab merely because they use Loumilab Orders.",
        "Merchants do not have authority to bind Loumilab.",
      ],
    },
    {
      title: "19. Acceptable Use",
      blocks: [
        "Users may not use Loumilab Orders to:",
        "- Violate applicable law;",
        "- Commit or facilitate fraud;",
        "- Infringe intellectual-property rights;",
        "- Distribute malicious software;",
        "- Interfere with platform operation or security;",
        "- Circumvent access controls;",
        "- Scrape or harvest information through unauthorized means;",
        "- Test platform vulnerabilities without authorization;",
        "- Misrepresent products, services, businesses, or identities;",
        "- Engage in harassment, threats, discrimination, or abusive conduct;",
        "- Process transactions unrelated to legitimate Merchant commerce;",
        "- Sell prohibited products or services; or",
        "- Use the Services in a manner that materially harms Loumilab, Merchants, Customers, or third parties.",
      ],
    },
    {
      title: "20. Merchant Content",
      blocks: [
        "Merchants retain ownership of content they own.",
        "By uploading content to Loumilab Orders, the Merchant grants Loumilab a non-exclusive, worldwide, royalty-free license to host, reproduce, display, format, resize, distribute, and otherwise use that content as reasonably necessary to provide, operate, secure, promote, and improve the Services and the Merchant's storefront.",
        "This license ends when the content is removed or the Merchant's account is terminated, except where continued retention or use is reasonably necessary for backups, transaction records, legal compliance, dispute resolution, or other legitimate purposes.",
      ],
    },
    {
      title: "21. Loumilab Intellectual Property",
      blocks: [
        "Loumilab Orders, including its software, interfaces, designs, branding, documentation, graphics, trademarks, and other proprietary materials, is owned by Loumilab or its licensors and protected by applicable intellectual-property laws.",
        "These Terms do not transfer ownership of Loumilab intellectual property to Users.",
      ],
    },
    {
      title: "22. Feedback",
      blocks: [
        "If you voluntarily provide suggestions, ideas, or feedback concerning Loumilab Orders, Loumilab may use that feedback to improve its products and services without an obligation to compensate you, subject to applicable law.",
      ],
    },
    {
      title: "23. Electronic Communications",
      blocks: [
        "By creating an account or using Loumilab Orders, you consent to receive transactional electronic communications necessary to provide the Services.",
        "These may include:",
        "- Account confirmations;",
        "- Store creation notices;",
        "- Store URLs;",
        "- Order confirmations;",
        "- Payment and payout notifications;",
        "- Security alerts;",
        "- Policy notices;",
        "- Subscription information; and",
        "- Service-related communications.",
        "Marketing communications will be handled in accordance with applicable law and available communication preferences.",
      ],
    },
    {
      title: "24. Third-Party Services",
      blocks: [
        "Loumilab Orders may integrate with or link to third-party products and services.",
        "Third-party services are governed by their respective terms and privacy practices.",
        "Loumilab is not responsible for third-party services except to the extent required by applicable law.",
      ],
    },
    {
      title: "25. Service Availability and Changes",
      blocks: [
        "Loumilab may modify, improve, replace, restrict, or discontinue portions of the Services.",
        "We do not guarantee uninterrupted or error-free operation.",
        "Maintenance, third-party outages, internet disruptions, payment-provider issues, security incidents, or circumstances outside our reasonable control may temporarily affect availability.",
      ],
    },
    {
      title: "26. Security",
      blocks: [
        "Loumilab uses reasonable administrative, technical, and organizational safeguards designed to protect the Services and information under our control.",
        "No internet-based service can guarantee absolute security.",
        "Users are responsible for using reasonable security practices, including protecting passwords and devices and promptly reporting suspected unauthorized access.",
      ],
    },
    {
      title: "27. Suspension and Termination",
      blocks: [
        "Loumilab may restrict, suspend, or terminate access when reasonably necessary because of:",
        "- Violation of these Terms;",
        "- Fraud or suspected fraudulent activity;",
        "- Security threats;",
        "- Unlawful activity;",
        "- Payment or chargeback concerns;",
        "- Risk to Customers or Merchants;",
        "- Third-party payment restrictions; or",
        "- Legal or regulatory requirements.",
        "Where appropriate, Loumilab may provide notice or an opportunity to address the issue.",
        "Users may discontinue use of Loumilab Orders subject to outstanding payment, transaction, subscription, and record-retention obligations.",
      ],
    },
    {
      title: "28. Disclaimer of Warranties",
      blocks: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.”",
        "LOUMILAB DISCLAIMS WARRANTIES NOT EXPRESSLY PROVIDED IN THESE TERMS, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE EXTENT SUCH DISCLAIMERS ARE PERMITTED BY LAW.",
        "Loumilab does not warrant that Merchant products or services will meet Customer expectations or that use of the platform will produce particular sales, revenue, or business results.",
      ],
    },
    {
      title: "29. Limitation of Liability",
      blocks: [
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LOUMILAB AND ITS AFFILIATES, OFFICERS, EMPLOYEES, CONTRACTORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING FROM OR RELATING TO USE OF THE SERVICES.",
        "Any limitation of liability will apply only to the extent permitted by applicable law.",
        "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited.",
      ],
    },
    {
      title: "30. Indemnification",
      blocks: [
        "To the extent permitted by law, Merchants agree to indemnify and hold harmless Loumilab and its affiliates, officers, employees, and representatives from claims, losses, liabilities, damages, and reasonable expenses arising from the Merchant's:",
        "- Products or services;",
        "- Storefront content;",
        "- Business operations;",
        "- Violation of law;",
        "- Violation of these Terms; or",
        "- Infringement of third-party rights.",
      ],
    },
    {
      title: "31. Governing Law",
      blocks: [
        "These Terms are governed by the laws of the State of Maryland, without regard to conflict-of-law principles, except where applicable law requires otherwise.",
        "Any additional dispute-resolution, venue, arbitration, or class-action provisions should be separately reviewed and approved by qualified legal counsel before implementation.",
      ],
    },
    {
      title: "32. Changes to These Terms",
      blocks: [
        "Loumilab may update these Terms periodically.",
        "When changes are material, we may provide notice through the Services, email, or another appropriate method.",
        "The updated Terms will identify their effective date.",
        "Where required by law, we will obtain consent before materially different terms become effective.",
      ],
    },
    {
      title: "33. Severability",
      blocks: [
        "If any provision of these Terms is determined to be invalid or unenforceable, the remaining provisions will remain effective to the extent permitted by law.",
      ],
    },
    {
      title: "34. Entire Agreement",
      blocks: [
        "These Terms, together with policies and additional terms expressly incorporated by reference, constitute the agreement between the User and Loumilab concerning the Services covered by these Terms.",
      ],
    },
    {
      title: "35. Contact Us",
      blocks: [
        "Questions regarding these Terms may be submitted through the contact information provided on the Loumilab website.",
      ],
    },
  ],
};

export const ORDERS_PRIVACY: LegalDocument = {
  title: "Loumilab Orders Privacy Policy",
  intro: [
    "Loumilab (“Loumilab,” “we,” “us,” or “our”) respects your privacy.",
    "This Privacy Policy describes how Loumilab collects, uses, discloses, retains, and protects personal information when individuals use Loumilab Orders, including merchant storefronts, merchant accounts, ordering functionality, websites, dashboards, communications, and related services.",
    "This Policy applies to Merchants, Customers, website visitors, and other individuals who interact with Loumilab Orders.",
  ],
  sections: [
    {
      title: "1. Information We Collect",
      blocks: [
        "The information collected depends on how you interact with Loumilab Orders.",
        "Information You Provide",
        "We may collect information such as:",
        "- Name;",
        "- Email address;",
        "- Telephone number;",
        "- Account credentials;",
        "- Business name;",
        "- Business contact information;",
        "- Merchant type or industry;",
        "- Store information;",
        "- Delivery, pickup, or shipping information;",
        "- Customer order information;",
        "- Communications with Loumilab or Merchants;",
        "- Uploaded logos, photographs, and other content;",
        "- Preferences;",
        "- Support requests; and",
        "- Other information you voluntarily provide.",
        "Merchant Information",
        "For Merchants, we may also collect:",
        "- Business ownership or representative information;",
        "- Business addresses;",
        "- Tax-related information where required;",
        "- Store configuration;",
        "- Products and services;",
        "- Prices;",
        "- Fulfillment settings;",
        "- Subscription information;",
        "- Transaction information;",
        "- Payment and payout status;",
        "- Merchant account status; and",
        "- Information required for fraud prevention, verification, or regulatory compliance.",
        "Certain Merchant identity, financial, banking, or verification information may be provided directly to our payment-processing partners rather than stored by Loumilab.",
      ],
    },
    {
      title: "2. Payment Information",
      blocks: [
        "Loumilab Orders uses third-party payment processors, including Stripe, to facilitate certain payments and Merchant payouts.",
        "Payment processors may collect information such as:",
        "- Payment card information;",
        "- Bank-account information;",
        "- Billing information;",
        "- Identity-verification information;",
        "- Transaction information; and",
        "- Fraud-prevention information.",
        "Loumilab generally does not need to receive or store complete payment-card numbers or complete Merchant bank-account credentials when those details are handled directly by the payment provider.",
        "Payment providers process information according to their own privacy policies and applicable contractual requirements.",
      ],
    },
    {
      title: "3. Customer Order Information",
      blocks: [
        "When a Customer places an order, we may process information necessary to facilitate that transaction, including:",
        "- Customer name;",
        "- Contact information;",
        "- Order contents;",
        "- Merchant selected;",
        "- Transaction amount;",
        "- Pickup, delivery, shipping, or service information;",
        "- Order notes;",
        "- Order status; and",
        "- Relevant transaction identifiers.",
        "Certain information must be shared with the Merchant so the Merchant can fulfill the order.",
      ],
    },
    {
      title: "4. Information Collected Automatically",
      blocks: [
        "When you use Loumilab Orders, we may automatically collect information concerning your device and interaction with the Services, including:",
        "- IP address;",
        "- Browser type;",
        "- Device type;",
        "- Operating system;",
        "- Pages viewed;",
        "- Referring pages;",
        "- Dates and times of access;",
        "- Session information;",
        "- Interaction data;",
        "- Approximate location derived from IP address;",
        "- Error and diagnostic information; and",
        "- Security-related information.",
        "We may use cookies, local storage, pixels, SDKs, and similar technologies where appropriate.",
      ],
    },
    {
      title: "5. How We Use Information",
      blocks: [
        "We may use personal information to:",
        "- Provide Loumilab Orders;",
        "- Create and maintain accounts;",
        "- Create and host Merchant storefronts;",
        "- Facilitate orders;",
        "- Facilitate payments and payouts;",
        "- Authenticate Users;",
        "- Communicate about accounts and transactions;",
        "- Send store creation and publishing information;",
        "- Provide Merchant storefront URLs;",
        "- Process subscriptions;",
        "- Provide customer support;",
        "- Prevent fraud and abuse;",
        "- Maintain security;",
        "- Diagnose technical problems;",
        "- Improve performance and usability;",
        "- Analyze platform usage;",
        "- Enforce our Terms;",
        "- Maintain transaction and audit records;",
        "- Meet legal obligations; and",
        "- Protect Loumilab, Merchants, Customers, and others.",
      ],
    },
    {
      title: "6. Communications",
      blocks: [
        "We may use contact information to send transactional or service-related communications, including:",
        "- Account verification;",
        "- Welcome messages;",
        "- Store creation confirmations;",
        "- Store publishing notifications;",
        "- Store URLs;",
        "- Order confirmations and updates;",
        "- Merchant order notifications;",
        "- Payment information;",
        "- Payout information;",
        "- Subscription notices;",
        "- Security notifications;",
        "- Customer-support communications; and",
        "- Important policy changes.",
        "Where permitted, we may separately send marketing communications.",
        "Users may opt out of eligible marketing communications. Transactional or security communications necessary to operate an account may continue.",
      ],
    },
    {
      title: "7. How We Disclose Information",
      blocks: [
        "We may disclose personal information when reasonably necessary to operate Loumilab Orders.",
        "Merchants",
        "Customer information may be provided to the Merchant involved in a transaction so that the Merchant can prepare, fulfill, deliver, provide, or otherwise manage the Customer's order.",
        "Merchants may only use Customer information for legitimate purposes consistent with applicable law, their responsibilities as a Merchant, and applicable Loumilab requirements.",
        "Service Providers",
        "We may use vendors that assist with services such as:",
        "- Payment processing;",
        "- Cloud hosting;",
        "- Database infrastructure;",
        "- Email delivery;",
        "- Authentication;",
        "- Analytics;",
        "- Security;",
        "- Fraud prevention;",
        "- Customer support; and",
        "- Infrastructure monitoring.",
        "Service providers receive information reasonably necessary to perform their services.",
        "Legal and Safety Purposes",
        "We may disclose information when we reasonably believe disclosure is necessary to:",
        "- Comply with law or legal process;",
        "- Respond to lawful governmental requests;",
        "- Protect rights or property;",
        "- Investigate fraud;",
        "- Address security incidents;",
        "- Protect individuals from harm; or",
        "- Enforce agreements.",
        "Business Transactions",
        "Information may be transferred in connection with a merger, acquisition, financing, restructuring, sale of assets, or similar business transaction, subject to applicable law.",
      ],
    },
    {
      title: "8. We Do Not Sell Payment Credentials",
      blocks: [
        "Loumilab does not sell payment-card numbers or Merchant banking credentials.",
        "Any broader treatment of personal information for targeted advertising, “sale,” or “sharing” under applicable U.S. state privacy laws will be disclosed and managed as required by applicable law.",
      ],
    },
    {
      title: "9. Merchant Responsibilities for Customer Data",
      blocks: [
        "Merchants may receive Customer information through Loumilab Orders.",
        "Merchants are responsible for protecting information available to them and complying with applicable privacy, consumer-protection, security, and recordkeeping requirements.",
        "Merchants should not use Customer information obtained through Loumilab Orders for unrelated purposes without an appropriate legal basis or permission.",
      ],
    },
    {
      title: "10. Cookies and Similar Technologies",
      blocks: [
        "Loumilab may use cookies and similar technologies for purposes including:",
        "- Authentication;",
        "- Security;",
        "- Remembering preferences;",
        "- Maintaining sessions;",
        "- Measuring performance;",
        "- Understanding usage; and",
        "- Improving the Services.",
        "Where legally required, Users will be provided appropriate choices regarding non-essential technologies.",
      ],
    },
    {
      title: "11. Data Retention",
      blocks: [
        "We retain information for as long as reasonably necessary for the purposes described in this Policy, including:",
        "- Maintaining accounts;",
        "- Providing Services;",
        "- Processing transactions;",
        "- Resolving disputes;",
        "- Preventing fraud;",
        "- Maintaining security;",
        "- Maintaining financial and audit records; and",
        "- Meeting legal obligations.",
        "Different categories of information may have different retention periods.",
        "Information may remain in secure backups for a limited period after deletion from active systems.",
      ],
    },
    {
      title: "12. Data Security",
      blocks: [
        "Loumilab uses reasonable administrative, technical, and organizational safeguards designed to protect information against unauthorized access, loss, misuse, alteration, or disclosure.",
        "These measures may include access controls, authentication, encryption where appropriate, logging, monitoring, secure infrastructure practices, and restrictions on access to personal information.",
        "No system can guarantee absolute security.",
      ],
    },
    {
      title: "13. Account Security",
      blocks: [
        "Users are responsible for maintaining the confidentiality of their account credentials.",
        "If you suspect unauthorized access to your Loumilab Orders account, contact Loumilab promptly and change affected credentials where appropriate.",
      ],
    },
    {
      title: "14. Children's Privacy",
      blocks: [
        "Loumilab Orders is not intended to knowingly collect personal information directly from children in violation of applicable law.",
        "If Loumilab learns that personal information from a child has been collected in circumstances requiring parental consent and such consent was not obtained, we will take appropriate steps consistent with applicable law.",
      ],
    },
    {
      title: "15. Privacy Rights",
      blocks: [
        "Depending on where you live, you may have rights concerning your personal information.",
        "These may include rights to:",
        "- Request access;",
        "- Request correction;",
        "- Request deletion;",
        "- Obtain a copy of certain information;",
        "- Opt out of certain processing;",
        "- Withdraw consent where processing depends on consent; and",
        "- Appeal certain privacy-request decisions.",
        "These rights are subject to applicable law and exceptions.",
        "We may need to verify your identity before completing a request.",
        "Loumilab will not unlawfully discriminate against individuals for exercising applicable privacy rights.",
      ],
    },
    {
      title: "16. U.S. State Privacy Rights",
      blocks: [
        "Residents of certain U.S. states may receive additional rights under state privacy laws.",
        "Where such laws apply to Loumilab's processing activities, Loumilab will honor applicable rights and provide additional disclosures or mechanisms as required.",
      ],
    },
    {
      title: "17. International Users",
      blocks: [
        "Loumilab Orders may be accessed from jurisdictions outside the United States.",
        "Information may be processed or stored in the United States or other countries in which Loumilab or its service providers operate.",
        "Where required, appropriate mechanisms will be used for international transfers of personal information.",
        "Availability of Loumilab Orders in a location does not necessarily mean all Merchant, payment, or ordering functionality is supported there.",
      ],
    },
    {
      title: "18. Third-Party Websites and Services",
      blocks: [
        "Loumilab Orders may contain links to or integrations with third-party services.",
        "Loumilab does not control the privacy practices of independent third parties.",
        "Users should review the privacy policies of third-party services they choose to use.",
      ],
    },
    {
      title: "19. Changes to This Privacy Policy",
      blocks: [
        "We may update this Privacy Policy as Loumilab Orders evolves or as legal requirements change.",
        "The current version will display its effective or last-updated date.",
        "If changes materially affect how personal information is handled, we will provide additional notice where appropriate or legally required.",
      ],
    },
    {
      title: "20. Contact Loumilab",
      blocks: [
        "Questions, concerns, or privacy requests may be submitted using the contact information available through Loumilab.",
      ],
    },
  ],
};

import type { ResourceFormRow, ResourceFormSchema } from "../resource-types";

export type PlaygroundFormDefinition = {
  id: string;
  title: string;
  description: string;
  schema: ResourceFormSchema;
  defaultValues?: Record<string, unknown>;
};

const contactSchema: ResourceFormSchema = {
  entity: "demo_contact",
  steps: {
    personal_information: [
      {
        key: "first_name",
        label: "First name",
        type: "text",
        required: true,
        autocomplete: "given-name",
      },
      {
        key: "last_name",
        label: "Last name",
        type: "text",
        required: true,
        autocomplete: "family-name",
      },
      {
        key: "email_address",
        label: "Email address",
        type: "text",
        required: true,
        autocomplete: "email",
      },
      {
        key: "contact_number",
        label: "Primary phone",
        type: "tel",
      },
      {
        key: "home_country",
        label: "Country",
        type: "country",
      },
    ],
    contact_preferences: [
      {
        key: "preferred_channel",
        label: "Preferred contact channel",
        type: "card_select",
        options: [
          {
            title: "Email only",
            value: "email",
            description: "Send all updates via email.",
            badge: "quiet",
          },
          {
            title: "Phone & email",
            value: "phone_email",
            description: "Send urgent notices by phone.",
            footer: "Preferred for support requests.",
          },
          {
            title: "SMS & updates",
            value: "sms",
            description: "Short updates over SMS.",
          },
        ],
      },
      {
        key: "notes",
        label: "Additional notes",
        type: "text_area",
        max_length: 280,
      },
    ],
    review_confirmation: [
      {
        key: "final_note",
        label: "Anything we should know?",
        type: "text_area",
      },
    ],
  },
  step_order: [
    "personal_information",
    "contact_preferences",
    "review_confirmation",
  ],
};

const kycSchema: ResourceFormSchema = {
  entity: "demo_kyc",
  steps: {
    identity: [
      {
        key: "legal_name",
        label: "Legal name",
        type: "text",
        required: true,
      },
      {
        key: "date_of_birth",
        label: "Date of birth",
        type: "dob",
        required: true,
      },
      {
        key: "mother_maiden_name",
        label: "Mother's maiden name",
        type: "text",
      },
      {
        key: "nationality",
        label: "Nationality",
        type: "country",
      },
    ],
    verification: [
      {
        key: "id_document",
        label: "Upload ID",
        type: "file_upload",
        required: true,
        document_type: "id_document",
      },
      {
        key: "proof_of_residence",
        label: "Proof of residence",
        type: "file_upload",
        document_type: "proof_of_address",
      },
    ],
    review_confirmation: [
      {
        key: "compliance_note",
        label: "Compliance note",
        type: "text_area",
      },
    ],
  },
  step_order: ["identity", "verification", "review_confirmation"],
};

const checkoutSchema: ResourceFormSchema = {
  entity: "demo_checkout",
  steps: {
    plan_selection: [
      {
        key: "plan_choice",
        label: "Choose your plan",
        type: "plan_select",
        required: true,
        options: [
          {
            title: "Starter",
            value: "starter",
            price: "$27",
            cadence: "month",
            features: ["Unlimited projects", "Email support"],
            badge: "entry",
            footer: "Great for individuals",
          },
          {
            title: "Growth",
            value: "growth",
            price: "$97",
            cadence: "month",
            features: ["Team seats", "Priority support"],
            footer: "Includes onboarding call",
          },
          {
            title: "Enterprise",
            value: "enterprise",
            price: "$297",
            cadence: "month",
            features: ["Dedicated CS", "Advanced analytics"],
          },
        ],
      },
    ],
    billing: [
      {
        key: "card_nickname",
        label: "Nickname this card",
        type: "text",
      },
      {
        key: "card_choice",
        label: "Saved card",
        type: "card_select",
        options: [
          {
            title: "Visa ending in 4242",
            value: "visa_4242",
            description: "Expires 11/27",
          },
          {
            title: "New card",
            value: "new_card",
            description: "Add a new payment method",
          },
        ],
      },
      {
        key: "pay",
        label: "Pay with Stripe",
        type: "pay_stripe",
        required: true,
      },
    ],
    review_confirmation: [
      {
        key: "billing_comment",
        label: "Billing comment",
        type: "text_area",
      },
    ],
  },
  step_order: ["plan_selection", "billing", "review_confirmation"],
  show_submit_button: true,
};

export const playgroundFormDefinitions: PlaygroundFormDefinition[] = [
  {
    id: "contact",
    title: "Contact intake form",
    description:
      "Multi-step personal profile with contact preferences and a review note.",
    schema: contactSchema,
    defaultValues: {
      first_name: "Alex",
      last_name: "Rivera",
      email_address: "alex@example.com",
      contact_number: "+1 555 0100",
      home_country: "US",
      preferred_channel: "phone_email",
      notes: "Share product updates, but please avoid SMS on weekends.",
    },
  },
  {
    id: "kyc",
    title: "Simplified KYC",
    description:
      "Identity + document upload flow that ends with a compliance review step.",
    schema: kycSchema,
    defaultValues: {
      legal_name: "SuitsBooks LLC",
      date_of_birth: "1990-01-01",
      nationality: "CA",
      compliance_note: "Approved for standard risk tier.",
    },
  },
  {
    id: "checkout",
    title: "Checkout + payment",
    description:
      "Plan selection, payment capture, and review step for quick purchases.",
    schema: checkoutSchema,
    defaultValues: {
      plan_choice: "growth",
      card_choice: "visa_4242",
      card_nickname: "Team card",
      billing_comment: "Schedule billing on the 10th of the month.",
    },
  },
];

export const playgroundResourceFormRows: ResourceFormRow[] =
  playgroundFormDefinitions.map((definition, index) => ({
    resource_form_id: `resource-form-${definition.id}`,
    slug: definition.id,
    title: definition.title,
    description: definition.description,
    entity: definition.schema.entity,
    schema: definition.schema as unknown as Record<string, unknown>,
    source_schema: definition.schema as unknown as Record<string, unknown>,
    source_schema_provider: "resource-framework-demo",
    default_values:
      (definition.defaultValues as Record<string, unknown> | undefined) ?? null,
    is_active: true,
    sort_order: index,
  }));

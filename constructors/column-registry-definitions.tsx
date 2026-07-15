"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type React from "react";
import { AssigneesCell } from "../components/cells/AssigneesCell";
import type { ColumnRegistry } from "../resource-types";
import { prettyString } from "@/lib/format/string";
import {
  buildBooleanYesNoColumn,
  buildBreakAllTextColumn,
  buildCountryCodeColumn,
  buildCurrencyColumn,
  buildDayColumn,
  buildDurationMsColumn,
  buildGenericColumn,
  buildJsonStringColumn,
  buildMonthColumn,
  buildPercentageColumn,
  buildSecondsColumn,
  buildStatusColumn,
  buildTimeColumn,
  buildUppercaseColumn,
  renderHeader,
} from "./column-builders";

export const globalColumnRegistry: ColumnRegistry<Record<string, unknown>> = {
  assignees: {
    build: function buildAssigneesColumn(opts: {
      key: string;
      header?: string;
    }) {
      const { key, header } = opts;
      return {
        header: () => renderHeader(header ?? prettyString(String(key))),
        accessorKey: key as string,
        cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
          const value =
            (row.original as Record<string, unknown>)[key as string];
          const list = Array.isArray(value) ? value : [];
          return (
            <AssigneesCell
              assignees={list as Array<
                {
                  email?: string;
                  avatar?: string;
                  user_id?: string;
                  username?: string;
                  display_name?: string;
                  first_name?: string;
                  last_name?: string;
                }
              >}
            />
          );
        },
        enableSorting: false,
        size: 160,
        meta: {
          datatype: "json" as const,
          filterable: false,
        },
        column_name: key as string,
      } as ColumnDef<Record<string, unknown>>;
    },
    order: 1,
    filterable: false,
    datatype: "json",
  },
  status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  month: {
    build: buildMonthColumn,
    datatype: "string",
    filterable: true,
  },
  view_status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  closed: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  booking_status: {
    build: buildStatusColumn,
    order: 2,
    filterable: true,
    datatype: "string",
  },
  transaction_status: {
    build: buildStatusColumn,
    order: 3,
    filterable: true,
    datatype: "string",
  },
  name: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  invoice_description: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  display_name: {
    build: buildBreakAllTextColumn,
    order: 1,
    filterable: true,
    datatype: "string",
  },
  invoice_total: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  balance_current: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  balance_available: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  total_excluding_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
    order: 1,
    filterable: true,
  },
  country_code: {
    build: buildCountryCodeColumn,
    datatype: "string",
    filterable: true,
  },
  home_address_country_code: {
    build: buildCountryCodeColumn,
    datatype: "string",
    filterable: true,
  },
  explanatations: {
    build: buildJsonStringColumn,
    datatype: "json",
    filterable: true,
  },
  amount_value: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  _1a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _1a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _2a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  discount_amount: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  fulfillment_status: {
    build: buildStatusColumn,
    datatype: "string",
    order: 2,
  },
  financial_status: {
    build: buildStatusColumn,
    datatype: "string",
    order: 3,
  },
  _2a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  fulfilled_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  lineitem_compare_at_price: {
    build: buildCurrencyColumn,
  },
  taxes: {
    build: buildCurrencyColumn,
  },
  refunded_amount: {
    build: buildCurrencyColumn,
  },
  risk_level: {
    build: buildStatusColumn,
  },
  shipping_country: {
    build: buildCountryCodeColumn,
  },
  shipping: {
    build: buildCurrencyColumn,
  },
  outstanding_balance: {
    build: buildCurrencyColumn,
  },
  lineitem_price: {
    build: buildCurrencyColumn,
  },
  lineitem_requires_shipping: {
    build: buildStatusColumn,
  },
  lineitem_taxable: {
    build: buildStatusColumn,
  },
  lineitem_discount: {
    build: buildCurrencyColumn,
  },
  lineitem_fulfillment_status: {
    build: buildStatusColumn,
  },
  _1b_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1b_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1c_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1c_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1d_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _1d_vat: { build: buildCurrencyColumn, datatype: "number" },
  _1e_turnover: { build: buildCurrencyColumn, datatype: "number" },
  _3a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _3b_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _3c_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4a_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4b_turnover: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _4b_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5a_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5b_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  _5g_vat: {
    build: buildCurrencyColumn,
    datatype: "number",
  },
  invoice_total_incl_vat: {
    build: buildCurrencyColumn,
    order: 2,
    filterable: true,
    datatype: "number",
  },
  total_including_vat: { build: buildCurrencyColumn, datatype: "number" },
  total: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  amount: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  credited: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  balance: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  money_out: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  subtotal: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  tax_amount: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  amount_due: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  price: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  total_paid: {
    build: buildCurrencyColumn,
    filterable: true,
    datatype: "number",
  },
  money_in: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  closing_balance: {
    build: buildCurrencyColumn,

    filterable: true,
    datatype: "number",
  },
  debited: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  fee: {
    build: buildCurrencyColumn,
    order: 1,
    filterable: true,
    datatype: "number",
  },
  currency: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  primary_iban: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  reference_type: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  auth_expires_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  closed_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  last_synced_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  uploaded_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  updated_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  invoice_date: { build: buildTimeColumn, filterable: true, datatype: "date" },
  invoice_due_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  last_reminded_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  accounting_start_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  time: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  created_at: {
    build: buildTimeColumn,
  },
  issue_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  paid_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  added_at: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  billing_country: {
    build: buildCountryCodeColumn,
  },
  started_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  contract_start_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  completed_date: {
    build: buildTimeColumn,
    filterable: true,
    datatype: "date",
  },
  due_date: {
    build: buildDayColumn,
    filterable: true,
    datatype: "date",
  },
  test_mode: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  awaiting_deletion: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  accepts_marketing: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  dpa_signed: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  consent_marketing_communications: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  onboarding_approved: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_oss: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ioss: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_article23: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_pep_sanction: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_identity_card: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_ultimate_beneficial_owner_statement: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_business_registry_extract: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_power_of_attorney: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_source_of_wealth: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_store_status: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_source_of_funds: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_errored: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_processed: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  aurora_should_process: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  verified: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_loan: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ar: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_ap: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_revenue: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  owns_more_than_25_percent: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_member_of_governing_board: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_expense: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_vat_payable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_vat_receivable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  authorize_for_automatic_acting: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_active: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_duplicate_hash: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  normalized: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  booked: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  has_given_authorization_for_auto_charging: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_postable: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  http: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  duration_ms: {
    build: buildDurationMsColumn,
    filterable: true,
    datatype: "number",
  },
  expires_in: {
    build: buildSecondsColumn,
    filterable: true,
    datatype: "number",
  },
  event_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  stargate_ponto_token_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  ponto_account_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  ponto_consent_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  invoice_nr: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  customer: {
    build: buildGenericColumn,
    filterable: true,
    datatype: "string",
    order: 3,
  },
  self_booking: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  accountant_is_partner_backoffice: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  is_overdue: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  subject_to_vat: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  allow_self_accounting: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  signed_gdpr_document: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  subject_to_reverse_vat_charge: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  closing_enabled: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  enable_search: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  reconciled: {
    build: buildBooleanYesNoColumn,
    filterable: true,
    datatype: "boolean",
  },
  legal_form: {
    build: buildUppercaseColumn,
    filterable: true,
    datatype: "string",
  },
  country: {
    build: buildCountryCodeColumn,
    filterable: true,
    datatype: "string",
  },
  creditor_address_country_code: {
    build: buildCountryCodeColumn,
    filterable: true,
    datatype: "string",
  },
  transaction_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  reconciliation_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },

  document_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  booking_id: {
    build: buildBreakAllTextColumn,
    filterable: true,
    datatype: "string",
  },
  settings: {
    build: buildJsonStringColumn,
  },
  sandbox: {
    build: buildBooleanYesNoColumn,
    order: 2,
    datatype: "boolean",
    filterable: true,
  },
  reverse_charged: {
    build: buildBooleanYesNoColumn,
    datatype: "boolean",
    filterable: true,
  },
  stake_percentage: {
    build: buildPercentageColumn,
    datatype: "number",
    filterable: true,
  },
  active: {
    build: buildBooleanYesNoColumn,
    order: 1,
    datatype: "boolean",
    filterable: true,
  },
  pushed_at: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  head_commit_timestamp: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  enabled: {
    build: buildBooleanYesNoColumn,
    datatype: "boolean",
    filterable: true,
  },
  signed_date: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
  amount_paid: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  amount_remaining: {
    build: buildCurrencyColumn,
    datatype: "number",
    filterable: true,
  },
  paid: {
    build: buildTimeColumn,
    datatype: "date",
    filterable: true,
  },
};


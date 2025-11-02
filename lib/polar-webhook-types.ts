/** @format */

/**
 * Type definitions for Polar webhook payloads
 */

export interface PolarBillingAddress {
    line1: string | null;
    line2: string | null;
    postal_code: string | null;
    city: string | null;
    state: string | null;
    country: string;
}

export interface PolarCustomer {
    id: string;
    created_at: string;
    modified_at: string | null;
    metadata: Record<string, unknown>;
    external_id: string | null;
    email: string;
    email_verified: boolean;
    name: string;
    billing_address: PolarBillingAddress;
    tax_id: string | null;
    organization_id: string;
    deleted_at: string | null;
    avatar_url: string;
}

export interface PolarUser {
    id: string;
    email: string;
    public_name: string;
    avatar_url: string | null;
    github_username: string | null;
}

export interface PolarPrice {
    created_at: string;
    modified_at: string | null;
    id: string;
    amount_type: string;
    is_archived: boolean;
    product_id: string;
    type: string;
    recurring_interval: string;
    price_currency: string;
    price_amount: number;
}

export interface PolarCustomField {
    created_at: string;
    modified_at: string | null;
    id: string;
    metadata: Record<string, unknown>;
    type: string;
    slug: string;
    name: string;
    organization_id: string;
    properties: {
        form_label: string;
        min_length: number;
        max_length: number;
    };
}

export interface PolarAttachedCustomField {
    custom_field_id: string;
    custom_field: PolarCustomField;
    order: number;
    required: boolean;
}

export interface PolarProduct {
    id: string;
    created_at: string;
    modified_at: string | null;
    trial_interval: string;
    trial_interval_count: number;
    name: string;
    description: string | null;
    recurring_interval: string;
    recurring_interval_count: number;
    is_recurring: boolean;
    is_archived: boolean;
    organization_id: string;
    metadata: Record<string, unknown>;
    prices: PolarPrice[];
    benefits: unknown[];
    medias: unknown[];
    attached_custom_fields: PolarAttachedCustomField[];
}

export interface PolarSubscriptionData {
    created_at: string;
    modified_at: string | null;
    id: string;
    amount: number;
    currency: string;
    recurring_interval: string;
    recurring_interval_count: number;
    status: string;
    current_period_start: string;
    current_period_end: string;
    trial_start: string;
    trial_end: string;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    started_at: string;
    ends_at: string | null;
    ended_at: string | null;
    customer_id: string;
    product_id: string;
    discount_id: string | null;
    checkout_id: string;
    seats: unknown | null;
    customer_cancellation_reason: string | null;
    customer_cancellation_comment: string | null;
    price_id: string;
    metadata: Record<string, unknown>;
    custom_field_data: Record<string, string>;
    customer: PolarCustomer;
    user_id: string;
    user: PolarUser;
    product: PolarProduct;
    discount: unknown | null;
    price: PolarPrice;
    prices: PolarPrice[];
    meters: unknown[];
}

export interface PolarSubscriptionUpdatedPayload {
    type: "subscription.updated";
    timestamp: string;
    data: PolarSubscriptionData;
}

// Union type for all possible webhook event types
export type PolarWebhookPayload = PolarSubscriptionUpdatedPayload;


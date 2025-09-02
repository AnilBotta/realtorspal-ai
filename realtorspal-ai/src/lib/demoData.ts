// realtorspal-ai/src/lib/demoData.ts
import type { DashboardMetrics, Lead } from "@/lib/api";

export const DEMO_METRICS: DashboardMetrics = {
  totalLeads: 128,
  activeConversations: 6,
  appointmentsScheduled: 11,
  conversionRate: 0.23,
  revenueGenerated: 18450,
  responseTime: 3,
};

export const DEMO_LEADS: Lead[] = [
  {
    id: "D1",
    name: "John Carter",
    email: "john@example.com",
    phone: "555-0101",
    property_interest: "3BR Condo - Downtown",
    budget_range: "$400K - $500K",
    location: "Downtown",
    source: "Website",
    priority: "high",
    stage: "new",
    notes: "Wants parking",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "D2",
    name: "Mia Nguyen",
    email: "mia@example.com",
    phone: "555-0102",
    property_interest: "Townhouse - Suburbs",
    budget_range: "$700K - $900K",
    location: "Suburbs",
    source: "Referral",
    priority: "medium",
    stage: "contacted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];


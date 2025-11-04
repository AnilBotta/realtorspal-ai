"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  const plans = [
    {
      name: "Starter",
      description: "for solo agents testing the waters",
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        "1 seat",
        "2,000 contacts",
        "LeadGen Integration: Add-on",
        "AI Agents: Add-on",
        "Email support",
        "Basic analytics",
        "14-day free trial",
      ],
      cta: "Choose Starter",
      popular: false,
    },
    {
      name: "Standard",
      description: "for growing teams",
      monthlyPrice: 299,
      annualPrice: 2990,
      features: [
        "3 seats",
        "20,000 contacts",
        "LeadGen Integration: Included",
        "AI Agents: Add-on (+$)",
        "Priority chat support",
        "Advanced analytics",
        "Custom integrations",
        "14-day free trial",
      ],
      cta: "Choose Standard",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "for brokerages/multi-office",
      monthlyPrice: null,
      annualPrice: null,
      features: [
        "Custom seats",
        "100,000+ contacts",
        "LeadGen Integration: Included",
        "AI Agents: Included",
        "Dedicated success manager",
        "SLA & white-glove onboarding",
        "Custom data migration",
        "Advanced security & compliance",
      ],
      cta: "Talk to Sales",
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your business</p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="ml-2 text-green-600 font-semibold">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular
                  ? "border-primary border-2 shadow-xl scale-105"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.monthlyPrice ? (
                    <>
                      <span className="text-4xl font-bold">
                        ${billingPeriod === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                      </span>
                      <span className="text-gray-600">/month</span>
                      {billingPeriod === "annual" && (
                        <div className="text-sm text-gray-500 mt-1">
                          ${plan.annualPrice} billed annually
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-4xl font-bold">Custom</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <Link href={plan.name === "Enterprise" ? "#contact" : "/signup"}>
                    {plan.cta}
                    {plan.name !== "Enterprise" && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Need custom onboarding or data migration?{" "}
            <Link href="#contact" className="text-primary font-semibold hover:underline">
              Talk to Sales
            </Link>
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Standard</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Seats</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">1</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">3</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Custom</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Contacts</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">2,000</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">20,000</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">100,000+</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">LeadGen Integration</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Add-on</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">✓</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">AI Agents</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Add-on</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Add-on</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Support</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Email</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Priority Chat</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">Dedicated Manager</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">SLA</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">—</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">—</td>
                  <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

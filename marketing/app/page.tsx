"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, CheckCircle, Zap, Calendar, MessageSquare, Phone, BarChart, Bot, Users, Clock, Target, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-indigo-50 via-white to-white pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Turn Real-Estate Leads into{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Booked Appointments
                </span>
                —Automatically
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                RealtorsPal engages new leads in seconds, answers questions, qualifies, and books showings—24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" asChild>
                  <Link href="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="#features">See How It Works</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-gray-500">
                ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
              </p>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/images/crm_dashboard.jpeg"
                  alt="RealtorsPal CRM Dashboard"
                  width={1200}
                  height={800}
                  className="w-full"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live Activity</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust Badge */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 mb-4">Trusted by agents & brokerages across North America</p>
          </div>
        </div>
      </section>

      {/* Outcome Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Instant Lead Response</CardTitle>
                <CardDescription>
                  Auto call/SMS within seconds of lead submission
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Booking Automation</CardTitle>
                <CardDescription>
                  Calendars synced with no-show buffers & reminders
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Objection Handling</CardTitle>
                <CardDescription>
                  Trained on your scripts & policy for consistent responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Phone className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Live Transfer</CardTitle>
                <CardDescription>
                  Hot leads routed directly to your phone or team
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in minutes—no code required</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Lead Source</h3>
                <p className="text-gray-600">
                  Zillow, Facebook Lead Ads, website forms, CSV, or your existing CRM
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Plug Calendar & Scripts</h3>
                <p className="text-gray-600">
                  Google/Outlook calendar, FAQs, objections, fees, and showing rules
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Start the Engine</h3>
                <p className="text-gray-600">
                  AI qualifies, nurtures, and books showings automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to manage and convert leads</p>
          </div>

          <div className="space-y-24">
            {/* Feature 1: Dashboard */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">Live Dashboard Metrics</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Monitor your pipeline in real-time with comprehensive metrics and insights.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Total leads, active conversations, and appointments scheduled</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Conversion rate tracking and revenue generation analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Lightning-fast response time monitoring</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/images/crm_dashboard.jpeg"
                  alt="Dashboard with live metrics"
                  width={800}
                  height={600}
                  className="w-full"
                />
              </div>
            </div>

            {/* Feature 2: AI Agents */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/images/crm_ai_agents.jpeg"
                  alt="AI Agents Control Center"
                  width={800}
                  height={600}
                  className="w-full"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-3xl font-bold mb-4">AI Agents Control Center</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Deploy specialized AI agents for every stage of your sales process.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Bot className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span><strong>Lead Generator AI:</strong> Automatically source qualified leads</span>
                  </li>
                  <li className="flex items-start">
                    <Bot className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span><strong>Lead Nurturing AI:</strong> Follow up and warm cold leads</span>
                  </li>
                  <li className="flex items-start">
                    <Bot className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span><strong>Customer Service AI:</strong> Answer questions 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <Bot className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span><strong>Call Log Analyst AI:</strong> Extract insights from conversations</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Analytics */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">Analytics & Conversion Funnel</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Track every stage of your sales funnel and optimize for maximum conversions.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <BarChart className="h-6 w-6 text-accent mr-3 flex-shrink-0 mt-0.5" />
                    <span>Website visitors → Leads → Contacted → Booked → Closed</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="h-6 w-6 text-accent mr-3 flex-shrink-0 mt-0.5" />
                    <span>Stage performance insights and conversion bottleneck detection</span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-6 w-6 text-accent mr-3 flex-shrink-0 mt-0.5" />
                    <span>Lead quality scoring and best converting sources</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <Image
                  src="/images/crm_analytics.jpeg"
                  alt="Analytics and conversion funnel"
                  width={800}
                  height={600}
                  className="w-full"
                />
              </div>
            </div>

            {/* Feature 4: Pipeline Management */}
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">Lead Pipeline Kanban</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                Drag-and-drop pipeline with smart next-action hints across 5 stages: Prospecting → Engagement → Active → Closing → Closed
              </p>
              <div className="grid md:grid-cols-5 gap-4 text-left">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Prospecting</CardTitle>
                    <CardDescription className="text-xs">New leads incoming</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Engagement</CardTitle>
                    <CardDescription className="text-xs">Making contact</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active</CardTitle>
                    <CardDescription className="text-xs">Warm & ready</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Closing</CardTitle>
                    <CardDescription className="text-xs">Signed agreements</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Closed</CardTitle>
                    <CardDescription className="text-xs">Deals won</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Knowledge */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Teach It Once. It Improves Over Time.</h2>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            Uses listing data, FAQs, neighborhood intel, fees/commission policy, and showing rules to answer consistently and convert more leads.
          </p>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Integrations</h2>
            <p className="text-xl text-gray-600">Fits your stack—keeps your CRM clean and up-to-date</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {["Zillow", "REALTOR.ca", "HubSpot", "Google Calendar", "Facebook", "Zapier", "Zoho", "Follow Up Boss", "Outlook", "WordPress", "Webflow", "Make"].map((integration) => (
              <div key={integration} className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary transition-colors">
                <span className="font-semibold text-gray-700">{integration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left">
                How fast do you contact new leads?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Within ~30 seconds of submission. Our AI agents engage leads via call or SMS immediately to maximize conversion rates.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left">
                Do you support both inbound and outbound?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes—handles inbound calls, web form leads, and can make outbound calls to warm up your lead list.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left">
                Do I need to know code?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                No, our guided setup wizard walks you through connecting your lead sources, calendar, and scripts without any coding required.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left">
                Which CRMs and calendars are supported?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Popular CRMs via native integration or Zapier/Make. Google Calendar and Outlook are fully supported for booking automation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left">
                Is there a free trial?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes! 14-day free trial with full access to all features. No credit card required to start.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white px-6 rounded-lg border">
              <AccordionTrigger className="text-left">
                Can I cancel anytime?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes, you can cancel anytime via your account settings or Stripe Customer Portal. No long-term contracts.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Never miss a real-estate lead again.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of agents and brokerages automating their lead engagement
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild>
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline">
              <Link href="#features">Book a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

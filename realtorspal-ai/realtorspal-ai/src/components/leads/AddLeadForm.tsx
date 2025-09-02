"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Lead } from "@/lib/api"
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  Tag,
  X,
  Save,
  Plus
} from "lucide-react"

interface AddLeadFormProps {
  isOpen: boolean
  onClose: () => void
  onAddLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void
}

export function AddLeadForm({ isOpen, onClose, onAddLead }: AddLeadFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property_interest: "",
    budget_range: "",
    location: "",
    priority: "medium" as "high" | "medium" | "low",
    notes: ""
  })

  const propertyTypes = [
    "1BR Apartment",
    "2BR Apartment",
    "3BR Apartment",
    "2BR Condo",
    "3BR Condo",
    "4BR Condo",
    "2BR Townhouse",
    "3BR Townhouse",
    "4BR Townhouse",
    "3BR House",
    "4BR House",
    "5BR House",
    "Luxury Penthouse",
    "Commercial Property",
    "Land/Lot",
    "Other"
  ]

  const budgetRanges = [
    "Under $200K",
    "$200K - $300K",
    "$300K - $400K",
    "$400K - $500K",
    "$500K - $650K",
    "$650K - $800K",
    "$800K - $1M",
    "$1M - $1.5M",
    "$1.5M - $2M",
    "$2M+",
    "Custom Range"
  ]

  const locations = [
    "Downtown",
    "Midtown",
    "Uptown",
    "Suburbs",
    "Waterfront",
    "Historic District",
    "Business District",
    "Residential Area",
    "Luxury District",
    "Other"
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the lead's name",
        variant: "destructive"
      })
      return false
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the lead's email",
        variant: "destructive"
      })
      return false
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return false
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the lead's phone number",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newLead: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        property_interest: formData.property_interest || "Property Interest",
        budget_range: formData.budget_range || "Budget TBD",
        location: formData.location || "Location TBD",
        source: "Manual Entry",
        priority: formData.priority,
        notes: formData.notes.trim(),
        stage: "new"
      }

      onAddLead(newLead)

      toast({
        title: "Lead Added Successfully",
        description: `${formData.name} has been added to your lead pipeline`,
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        property_interest: "",
        budget_range: "",
        location: "",
        priority: "medium",
        notes: ""
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error Adding Lead",
        description: "There was a problem adding the lead. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm border-slate-200/50 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Lead
              </CardTitle>
              <CardDescription>
                Enter the lead's information to add them to your pipeline
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., John Doe"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john.doe@email.com"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Property Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="w-5 h-5" />
                Property Requirements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_interest">Property Type</Label>
                  <Select value={formData.property_interest} onValueChange={(value) => handleInputChange("property_interest", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_range">Budget Range</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Select value={formData.budget_range} onValueChange={(value) => handleInputChange("budget_range", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range} value={range}>{range}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Preferred Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select preferred location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Additional Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional information about this lead..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    Manual Entry
                  </Badge>
                  <span className="text-sm text-blue-700">This lead will be tagged as manually added</span>
                </div>
              </div>
            </div>
          </CardContent>

          <div className="flex justify-end gap-3 p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Adding Lead..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

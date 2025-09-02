"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  Download,
  FileText,
  Database,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Settings,
  Eye,
  RefreshCw,
  X,
  ArrowRight,
  Calendar,
  Users,
  Target
} from "lucide-react"

interface ImportJob {
  id: string
  fileName: string
  totalRecords: number
  processedRecords: number
  successCount: number
  errorCount: number
  status: "pending" | "processing" | "completed" | "failed"
  createdAt: string
  mapping?: Record<string, string>
}

interface ExportJob {
  id: string
  name: string
  format: string
  filters: Record<string, string | number | boolean>
  totalRecords: number
  status: "pending" | "processing" | "completed" | "failed"
  createdAt: string
  downloadUrl?: string
}

interface CRMIntegration {
  id: string
  name: string
  connected: boolean
  lastSync: string
  totalRecords: number
  syncStatus: "idle" | "syncing" | "error"
}

export function ImportExportSystem() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importJobs, setImportJobs] = useState<ImportJob[]>([
    {
      id: "1",
      fileName: "leads_batch_1.csv",
      totalRecords: 1250,
      processedRecords: 1250,
      successCount: 1187,
      errorCount: 63,
      status: "completed",
      createdAt: "2024-01-15 14:30:22"
    },
    {
      id: "2",
      fileName: "facebook_leads.xlsx",
      totalRecords: 834,
      processedRecords: 425,
      successCount: 398,
      errorCount: 27,
      status: "processing",
      createdAt: "2024-01-15 16:45:11"
    }
  ])

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: "1",
      name: "All Leads - January",
      format: "CSV",
      filters: { dateRange: "January 2024", status: "all" },
      totalRecords: 1247,
      status: "completed",
      createdAt: "2024-01-15 09:22:15",
      downloadUrl: "/exports/all-leads-january.csv"
    },
    {
      id: "2",
      name: "Hot Leads Report",
      format: "Excel",
      filters: { priority: "high", stage: "appointment" },
      totalRecords: 89,
      status: "processing",
      createdAt: "2024-01-15 11:15:33"
    }
  ])

  const [crmIntegrations, setCrmIntegrations] = useState<CRMIntegration[]>([
    {
      id: "salesforce",
      name: "Salesforce",
      connected: true,
      lastSync: "2024-01-15 08:00:00",
      totalRecords: 2340,
      syncStatus: "idle"
    },
    {
      id: "hubspot",
      name: "HubSpot",
      connected: false,
      lastSync: "Never",
      totalRecords: 0,
      syncStatus: "idle"
    },
    {
      id: "pipedrive",
      name: "Pipedrive",
      connected: true,
      lastSync: "2024-01-14 18:30:00",
      totalRecords: 1876,
      syncStatus: "error"
    }
  ])

  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    "First Name": "firstName",
    "Last Name": "lastName",
    "Email Address": "email",
    "Phone Number": "phone",
    "Property Interest": "property",
    "Budget Range": "budget",
    "Location": "location",
    "Lead Source": "source"
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      toast({
        title: "File Selected",
        description: `${file.name} ready for import (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      })
    }
  }

  const startImport = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive"
      })
      return
    }

    const newJob: ImportJob = {
      id: Date.now().toString(),
      fileName: selectedFile.name,
      totalRecords: Math.floor(Math.random() * 1000) + 100,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      status: "pending",
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      mapping: fieldMapping
    }

    setImportJobs(prev => [newJob, ...prev])

    toast({
      title: "Import Started",
      description: `Processing ${selectedFile.name}...`,
    })

    // Simulate import progress
    setTimeout(() => {
      setImportJobs(prev => prev.map(job =>
        job.id === newJob.id ? { ...job, status: "processing" } : job
      ))
    }, 1000)
  }

  const createExport = (name: string, format: string, filters: Record<string, string | number | boolean>) => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name,
      format,
      filters,
      totalRecords: Math.floor(Math.random() * 1000) + 100,
      status: "pending",
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    }

    setExportJobs(prev => [newJob, ...prev])

    toast({
      title: "Export Started",
      description: `Creating ${format} export: ${name}`,
    })
  }

  const toggleCRMConnection = (crmId: string) => {
    setCrmIntegrations(prev => prev.map(crm =>
      crm.id === crmId ? { ...crm, connected: !crm.connected } : crm
    ))
  }

  const syncCRM = (crmId: string) => {
    setCrmIntegrations(prev => prev.map(crm =>
      crm.id === crmId ? { ...crm, syncStatus: "syncing" } : crm
    ))

    toast({
      title: "Sync Started",
      description: `Syncing with ${crmIntegrations.find(c => c.id === crmId)?.name}...`,
    })

    // Simulate sync
    setTimeout(() => {
      setCrmIntegrations(prev => prev.map(crm =>
        crm.id === crmId ? {
          ...crm,
          syncStatus: "idle",
          lastSync: new Date().toISOString().replace('T', ' ').slice(0, 19)
        } : crm
      ))
      toast({
        title: "Sync Completed",
        description: "CRM data synchronized successfully",
      })
    }, 3000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />
      case "processing": return <Clock className="w-4 h-4 text-blue-600" />
      case "failed": return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700 border-green-200"
      case "processing": return "bg-blue-100 text-blue-700 border-blue-200"
      case "failed": return "bg-red-100 text-red-700 border-red-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Import & Export</h1>
            <p className="text-slate-600">Manage data import, export, and CRM integrations</p>
          </div>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="integrations">CRM Integrations</TabsTrigger>
            <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* Upload Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload Lead Data
                    </CardTitle>
                    <CardDescription>
                      Import leads from CSV, Excel, or other data files
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-600 mb-1">
                        {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports CSV, Excel (.xlsx), and TSV files up to 50MB
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.tsv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <Badge variant="secondary">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={startImport} disabled={!selectedFile} className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Start Import
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Import History */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Import History</CardTitle>
                    <CardDescription>
                      Track and monitor your data import jobs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {importJobs.map((job) => (
                        <div key={job.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(job.status)}
                              <div>
                                <span className="font-medium">{job.fileName}</span>
                                <p className="text-xs text-slate-600">{job.createdAt}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>

                          {job.status === "processing" && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{job.processedRecords} / {job.totalRecords}</span>
                              </div>
                              <Progress value={(job.processedRecords / job.totalRecords) * 100} className="h-2" />
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600">Total Records</span>
                              <div className="font-semibold">{job.totalRecords}</div>
                            </div>
                            <div>
                              <span className="text-slate-600">Successful</span>
                              <div className="font-semibold text-green-600">{job.successCount}</div>
                            </div>
                            <div>
                              <span className="text-slate-600">Errors</span>
                              <div className="font-semibold text-red-600">{job.errorCount}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Import Settings Sidebar */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Import Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Data Source</Label>
                      <Select defaultValue="manual">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Upload</SelectItem>
                          <SelectItem value="facebook">Facebook Leads</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Skip Duplicates</Label>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Auto-assign Agent</Label>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Send Welcome Email</Label>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label>Default Lead Stage</Label>
                      <Select defaultValue="new">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New Leads</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Imports</span>
                      <span className="font-semibold">47</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Records Imported</span>
                      <span className="font-semibold">12,847</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-semibold text-green-600">94.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Import</span>
                      <span className="font-semibold">2 hours ago</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* Quick Export */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Quick Export
                    </CardTitle>
                    <CardDescription>
                      Export your lead data with custom filters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Export Name</Label>
                        <Input placeholder="e.g., Hot Leads January" />
                      </div>
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select defaultValue="csv">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Select defaultValue="30d">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Lead Stage</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All stages</SelectItem>
                            <SelectItem value="new">New leads</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="appointment">Appointments</SelectItem>
                            <SelectItem value="closed">Closed deals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={() => createExport("Custom Export", "CSV", { dateRange: "30d", stage: "all" })}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Create Export
                    </Button>
                  </CardContent>
                </Card>

                {/* Export History */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Export History</CardTitle>
                    <CardDescription>
                      Download or manage your export files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exportJobs.map((job) => (
                        <div key={job.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(job.status)}
                              <div>
                                <span className="font-medium">{job.name}</span>
                                <p className="text-xs text-slate-600">{job.createdAt}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(job.status)}>
                                {job.status}
                              </Badge>
                              {job.status === "completed" && job.downloadUrl && (
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600">Format</span>
                              <div className="font-semibold">{job.format}</div>
                            </div>
                            <div>
                              <span className="text-slate-600">Records</span>
                              <div className="font-semibold">{job.totalRecords}</div>
                            </div>
                            <div>
                              <span className="text-slate-600">Size</span>
                              <div className="font-semibold">{(job.totalRecords * 0.5).toFixed(1)} KB</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Templates */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Export Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      All Leads
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Hot Leads Only
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Appointments
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Closed Deals
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Scheduled Exports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center text-slate-600 text-sm">
                      No scheduled exports
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Export
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* CRM Integrations Tab */}
          <TabsContent value="integrations">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {crmIntegrations.map((crm) => (
                <Card key={crm.id} className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Database className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{crm.name}</CardTitle>
                          <CardDescription>
                            {crm.connected ? "Connected" : "Not connected"}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={crm.connected}
                        onCheckedChange={() => toggleCRMConnection(crm.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Last Sync</span>
                        <div className="font-semibold">
                          {crm.lastSync === "Never" ? "Never" : new Date(crm.lastSync).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-600">Records</span>
                        <div className="font-semibold">{crm.totalRecords.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={crm.syncStatus === "idle" ? "default" :
                                crm.syncStatus === "syncing" ? "secondary" : "destructive"}
                      >
                        {crm.syncStatus === "syncing" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                        {crm.syncStatus}
                      </Badge>
                      {crm.syncStatus === "error" && (
                        <span className="text-xs text-red-600">Sync failed</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => syncCRM(crm.id)}
                        disabled={!crm.connected || crm.syncStatus === "syncing"}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Field Mapping Tab */}
          <TabsContent value="mapping">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Field Mapping Configuration
                </CardTitle>
                <CardDescription>
                  Map external data fields to your RealtorsPal AI fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-600 mb-4">
                    <div>Source Field</div>
                    <div>Mapping</div>
                    <div>RealtorsPal Field</div>
                  </div>

                  {Object.entries(fieldMapping).map(([sourceField, targetField]) => (
                    <div key={sourceField} className="grid grid-cols-3 gap-4 items-center p-3 border border-slate-200 rounded-lg">
                      <div className="font-medium">{sourceField}</div>
                      <div className="flex justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <Select value={targetField} onValueChange={(value) =>
                          setFieldMapping(prev => ({ ...prev, [sourceField]: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="firstName">First Name</SelectItem>
                            <SelectItem value="lastName">Last Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="property">Property Interest</SelectItem>
                            <SelectItem value="budget">Budget Range</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                            <SelectItem value="source">Lead Source</SelectItem>
                            <SelectItem value="notes">Notes</SelectItem>
                            <SelectItem value="skip">Skip Field</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button>
                    Save Mapping Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

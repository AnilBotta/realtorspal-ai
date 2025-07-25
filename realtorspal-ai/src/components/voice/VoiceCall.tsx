"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  X
} from "lucide-react"

interface VoiceCallProps {
  leadName: string
  leadPhone: string
  leadId: string
  onClose: () => void
}

type CallStatus = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed'

export function VoiceCall({ leadName, leadPhone, leadId, onClose }: VoiceCallProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const { toast } = useToast()

  // Simulate call timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const initiateCall = async () => {
    setCallStatus('connecting')

    // Simulate Twilio Voice API call initiation
    toast({
      title: "Initiating Call",
      description: `Connecting to ${leadName} at ${leadPhone}...`,
    })

    try {
      // In a real implementation, this would use Twilio Voice SDK
      // const device = new Device(token, { debug: true })
      // const call = await device.connect({ params: { To: leadPhone } })

      // Simulate connection process
      setTimeout(() => {
        setCallStatus('ringing')

        // Simulate answer after 3-6 seconds
        setTimeout(() => {
          setCallStatus('connected')
          setCallDuration(0)
          toast({
            title: "Call Connected",
            description: `Now speaking with ${leadName}`,
          })
        }, Math.random() * 3000 + 3000)
      }, 1000)

    } catch (error) {
      setCallStatus('failed')
      toast({
        title: "Call Failed",
        description: "Unable to connect. Please check your Twilio configuration.",
        variant: "destructive"
      })
    }
  }

  const endCall = () => {
    setCallStatus('ended')
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatDuration(callDuration)}`,
    })

    // Log call in CRM (simulate)
    setTimeout(() => {
      toast({
        title: "Call Logged",
        description: "Call details have been added to the lead's activity log",
      })
      onClose()
    }, 2000)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    toast({
      title: isMuted ? "Microphone On" : "Microphone Muted",
      description: isMuted ? "You can now speak" : "Your microphone is muted",
    })
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    toast({
      title: isSpeakerOn ? "Speaker Off" : "Speaker On",
      description: isSpeakerOn ? "Switched to earpiece" : "Switched to speaker",
    })
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'ringing': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'connected': return 'bg-green-100 text-green-700 border-green-200'
      case 'ended': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'failed': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'idle': return 'Ready to call'
      case 'connecting': return 'Connecting...'
      case 'ringing': return 'Ringing...'
      case 'connected': return `Connected • ${formatDuration(callDuration)}`
      case 'ended': return 'Call ended'
      case 'failed': return 'Call failed'
      default: return 'Unknown status'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-slate-200/50">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>

          <CardTitle className="text-xl">{leadName}</CardTitle>
          <CardDescription className="text-lg font-mono">{leadPhone}</CardDescription>

          <Badge className={`mt-2 ${getStatusColor()}`}>
            {callStatus === 'connected' && <Clock className="w-3 h-3 mr-1" />}
            {getStatusText()}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Call Action Button */}
          <div className="flex justify-center">
            {callStatus === 'idle' && (
              <Button
                onClick={initiateCall}
                size="lg"
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-6 h-6" />
              </Button>
            )}

            {(callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'connected') && (
              <Button
                onClick={endCall}
                size="lg"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            )}

            {(callStatus === 'ended' || callStatus === 'failed') && (
              <Button
                onClick={onClose}
                size="lg"
                variant="outline"
                className="w-16 h-16 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* Call Controls */}
          {callStatus === 'connected' && (
            <div className="flex justify-center space-x-4">
              <Button
                variant={isMuted ? "default" : "outline"}
                size="lg"
                onClick={toggleMute}
                className="w-12 h-12 rounded-full"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                variant={isSpeakerOn ? "default" : "outline"}
                size="lg"
                onClick={toggleSpeaker}
                className="w-12 h-12 rounded-full"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            </div>
          )}

          {/* Call Notes */}
          {callStatus === 'connected' && (
            <div className="text-center text-sm text-slate-600">
              <p>Call is being recorded for quality assurance</p>
              <p className="mt-1">Notes will be automatically added to lead profile</p>
            </div>
          )}

          {/* Connection Info */}
          {callStatus === 'connecting' && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-slate-600">
                <PhoneCall className="w-4 h-4 animate-pulse" />
                <span>Establishing secure connection via Twilio...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

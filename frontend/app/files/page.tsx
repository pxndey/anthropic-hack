"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Music,
  Download,
  ArrowLeft,
  Clock,
  FileAudio,
  Play,
  Pause,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"

type FileData = {
  type: 'text' | 'audio'
  fileName?: string
  fileSize?: number
  fileType?: string
  audioBlob?: Blob
  audioFile?: File
  audioBlobUrl?: string
  transcript?: string
  textContent?: string
  timestamp: string
}

export default function FilesPage() {
  const router = useRouter()
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Retrieve file data from sessionStorage
    const storedData = sessionStorage.getItem('uploadedFile')
    
    if (storedData) {
      const data = JSON.parse(storedData) as FileData
      setFileData(data)
      
      // If there's an audio blob URL, set it
      if (data.audioBlobUrl) {
        setAudioUrl(data.audioBlobUrl)
      }

      // If there's text content, set it
      if (data.textContent) {
        setTextContent(data.textContent)
      }
    }
  }, [])

  const handleDownloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `recording-${new Date().getTime()}.webm`
      a.click()
    }
  }

  const handleDownloadTranscript = () => {
    if (fileData?.transcript) {
      const blob = new Blob([fileData.transcript], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transcript-${new Date().getTime()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleDownloadTextContent = () => {
    if (textContent) {
      const blob = new Blob([textContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileData?.fileName || `document-${new Date().getTime()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const togglePlayPause = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause()
      } else {
        audioRef.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  if (!fileData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">No files uploaded</h1>
            <Button onClick={() => router.push('/upload')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/upload')}
            className="mb-3 -ml-2"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Your Files
          </h1>
          <p className="text-sm text-muted-foreground">
            Uploaded {new Date(fileData.timestamp).toLocaleString()}
          </p>
        </div>

        {/* File Cards */}
        <div className="space-y-4">
          {/* Text File Card with Content */}
          {fileData.type === 'text' && fileData.fileName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-coral-400/10 to-coral-400/5">
                  <FileText className="h-5 w-5 text-coral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-0.5 truncate">
                    {fileData.fileName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{fileData.fileType}</span>
                    {fileData.fileSize && (
                      <span>{(fileData.fileSize / 1024).toFixed(1)} KB</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(fileData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Content Display */}
              {textContent && (
                <>
                  <div className="rounded-lg bg-muted/30 p-3 mb-3 max-h-64 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {textContent}
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadTextContent}
                    variant="outline"
                    size="sm"
                    className="w-full border-coral-200 text-coral-600 hover:bg-coral-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* Transcript Card - Main Focus for Audio */}
          {fileData.type === 'audio' && fileData.transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-0.5">
                      Transcript
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Real-time transcription • {new Date(fileData.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {/* Audio Download Button - Top Right Corner */}
                {audioUrl && (
                  <Button
                    onClick={handleDownloadAudio}
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 shrink-0"
                  >
                    <FileAudio className="mr-2 h-4 w-4" />
                    Download Audio
                  </Button>
                )}
              </div>

              {/* Transcript Content */}
              <div className="rounded-lg bg-muted/30 p-3 mb-3 max-h-64 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {fileData.transcript}
                </p>
              </div>

              {/* Download Transcript Button */}
              <Button
                onClick={handleDownloadTranscript}
                variant="outline"
                size="sm"
                className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Transcript
              </Button>
            </motion.div>
          )}
        </div>

        {/* Action Buttons - Compact */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-gradient-to-r from-coral-400 to-rose-600 text-card hover:from-coral-500 hover:to-rose-700"
            size="sm"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/upload')}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Upload Another
          </Button>
        </div>
      </main>
    </div>
  )
}
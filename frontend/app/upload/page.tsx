"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Mic,
  Upload,
  Check,
  Heart,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useScribe } from "@elevenlabs/react"
import { Navbar } from "@/components/navbar"
import { HeartConfetti } from "@/components/heart-confetti"
import { Button } from "@/components/ui/button"

type ProcessingStep = {
  label: string
  done: boolean
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [textFile, setTextFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [dragOverText, setDragOverText] = useState(false)
  const [transcribedText, setTranscribedText] = useState("")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)

  // ElevenLabs Scribe setup
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      setLiveTranscript(data.text)
    },
    onCommittedTranscript: (data) => {
      setTranscribedText((prev) => prev + " " + data.text)
    },
  })

  const handleTextDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOverText(false)
    const file = e.dataTransfer.files[0]
    if (file) setTextFile(file)
  }, [])

  const simulateProcessing = useCallback(async (transcript?: string) => {
    setProcessing(true)
    const steps = [
      "Transcribing audio...",
      "Parsing order details...",
      "Calculating costs...",
      "Generating quote...",
    ]
    const stepsState = steps.map((label) => ({ label, done: false }))
    setProcessingSteps(stepsState)

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
      setProcessingSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, done: true } : s))
      )
    }
    await new Promise((r) => setTimeout(r, 500))
    setProcessing(false)
    setShowSuccess(true)

    // Here you would normally send the transcript to your backend
    if (transcript) {
      console.log("Processing transcript:", transcript)
    }
  }, [])

  const handleRecordToggle = async () => {
    if (!isRecording) {
      // Start recording
      try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert("Your browser doesn't support audio recording. Please use Chrome, Edge, or Safari on localhost.")
          return
        }

        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        // Create MediaRecorder to save the audio
        const recorder = new MediaRecorder(stream)
        const chunks: Blob[] = []
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          setRecordedAudioBlob(blob)
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop())
        }
        
        recorder.start()
        setMediaRecorder(recorder)
        setAudioChunks(chunks)

        // Fetch token from your server for transcription
        const response = await fetch("/api/scribe-token")
        const { token } = await response.json()

        // Connect to ElevenLabs with microphone for real-time transcription
        await scribe.connect({
          token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        })

        setIsRecording(true)
        setLiveTranscript("")
      } catch (error) {
        console.error("Failed to start recording:", error)
        alert("Failed to start recording. Please ensure:\n1. You're using localhost (not an IP address)\n2. Microphone permissions are granted\n3. You're using a modern browser (Chrome/Edge/Safari)")
      }
    } else {
      // Stop recording - save the current live transcript to transcribedText
      if (liveTranscript) {
        const finalTranscript = transcribedText + " " + liveTranscript
        setTranscribedText(finalTranscript.trim())
      }
      
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
      scribe.disconnect()
      setIsRecording(false)
      setLiveTranscript("") // Clear live transcript after saving
    }
  }

  const handleProcessRecording = async () => {
    // Prepare the data to send to the files page
    const fileData = {
      type: 'audio' as const,
      transcript: transcribedText.trim(),
      audioBlobUrl: recordedAudioBlob ? URL.createObjectURL(recordedAudioBlob) : null,
      timestamp: new Date().toISOString()
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('uploadedFile', JSON.stringify(fileData))
    
    // Navigate to files page
    router.push('/files')
  }

  const handleProcessText = async () => {
    if (!textFile) return
    
    // Read the text file content
    const fileContent = await textFile.text()
    
    // Prepare text file data
    const fileData = {
      type: 'text',
      fileName: textFile.name,
      fileSize: textFile.size,
      fileType: textFile.type,
      textContent: fileContent,
      timestamp: new Date().toISOString()
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('uploadedFile', JSON.stringify(fileData))
    
    // Navigate to files page
    router.push('/files')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeartConfetti show={showSuccess} />

      {/* Processing Overlay */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <Heart className="h-12 w-12 text-coral-400 fill-coral-400" />
                </motion.div>
              </div>
              <h3 className="mb-6 text-center text-lg font-semibold text-foreground">
                Processing your order...
              </h3>
              <div className="space-y-3">
                {processingSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    {step.done ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </motion.div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="h-4 w-4 rounded-full border-2 border-coral-400 border-t-transparent"
                        />
                      </div>
                    )}
                    <span
                      className={`text-sm ${step.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="mx-4 w-full max-w-sm rounded-2xl bg-card p-8 shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-coral-400 to-rose-600"
              >
                <Check className="h-8 w-8 text-card" />
              </motion.div>
              <h3 className="mb-1 text-xl font-bold text-foreground">
                Order Created!
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                {"Order #ORD-2140214 • $12,450.00"}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 bg-gradient-to-r from-coral-400 to-rose-600 text-card hover:from-coral-500 hover:to-rose-700 border-0"
                >
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccess(false)
                    setTextFile(null)
                    setTranscribedText("")
                    setLiveTranscript("")
                    setRecordedAudioBlob(null)
                  }}
                  className="flex-1 border-coral-200 text-coral-400 hover:bg-coral-50 hover:text-coral-500"
                >
                  Upload Another
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="mb-4 inline-block"
          >
            <Heart className="h-10 w-10 text-coral-400 fill-coral-400" />
          </motion.div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground text-balance md:text-5xl">
            Fall in Love with Automated Orders
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
            Turn messy texts and voice messages into perfect ERP entries in
            seconds
          </p>
        </motion.div>

        {/* Upload Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Text Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl border bg-card p-1"
            style={{
              borderImage: "linear-gradient(135deg, #FF6B6B, #FFE5E5) 1",
            }}
          >
            <div className="rounded-xl bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coral-400/10 to-coral-400/5">
                  <FileText className="h-6 w-6 text-coral-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Text Orders
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    .txt, .pdf, .docx, .csv
                  </p>
                </div>
                <Sparkles className="ml-auto h-5 w-5 text-coral-300" />
              </div>

              <div
                onDrop={handleTextDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverText(true)
                }}
                onDragLeave={() => setDragOverText(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-all ${
                  dragOverText
                    ? "border-coral-400 bg-coral-400/5"
                    : "border-border hover:border-coral-300 hover:bg-muted/50"
                }`}
                role="button"
                tabIndex={0}
                aria-label="Drop or click to upload text file"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.csv"
                  className="hidden"
                  onChange={(e) =>
                    setTextFile(e.target.files?.[0] || null)
                  }
                />
                <AnimatePresence mode="wait">
                  {textFile ? (
                    <motion.div
                      key="file"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100"
                      >
                        <Check className="h-6 w-6 text-emerald-600" />
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">
                        {textFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(textFile.size / 1024).toFixed(1)} KB
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Drop your order files here
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        or click to browse
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleProcessText}
                disabled={!textFile || processing}
                className="w-full bg-gradient-to-r from-coral-400 to-coral-500 text-card hover:from-coral-500 hover:to-coral-600 border-0 shadow-lg shadow-coral-400/25 transition-all hover:shadow-xl hover:shadow-coral-400/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                Process Order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Audio Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl border bg-card p-1"
            style={{
              borderImage:
                "linear-gradient(135deg, #FFE5E5, #C73866) 1",
            }}
          >
            <div className="rounded-xl bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600/10 to-rose-600/5">
                  <Mic className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Voice Orders
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Record your order
                  </p>
                </div>
                <Sparkles className="ml-auto h-5 w-5 text-rose-300" />
              </div>

              {/* Live transcription display */}
              {(isRecording || transcribedText) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {isRecording && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                        </span>
                      )}
                      <span className="text-xs font-medium text-rose-600">
                        {isRecording ? "Listening..." : "Transcribed"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    {transcribedText}
                    {liveTranscript && (
                      <span className="text-muted-foreground italic">
                        {" "}{liveTranscript}
                      </span>
                    )}
                  </p>
                </motion.div>
              )}

              {/* Record button */}
              <button
                onClick={handleRecordToggle}
                disabled={scribe.isConnected && !isRecording}
                className={`mb-4 flex w-full items-center justify-center gap-3 rounded-xl border-2 py-4 transition-all ${
                  isRecording
                    ? "border-red-300 bg-red-50"
                    : "border-border hover:border-rose-300"
                }`}
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span
                    className={`absolute h-4 w-4 rounded-full ${isRecording ? "bg-red-500 animate-pulse-ring" : "bg-red-400"}`}
                  />
                  <span
                    className={`relative h-3 w-3 rounded-full ${isRecording ? "bg-red-600" : "bg-red-400"}`}
                  />
                </span>
                <span
                  className={`text-sm font-medium ${isRecording ? "text-red-600" : "text-foreground"}`}
                >
                  {isRecording ? "Stop Recording..." : "Record Now"}
                </span>
              </button>

              {/* Clear transcript button */}
              {transcribedText && !isRecording && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Button
                    onClick={() => {
                      setTranscribedText("")
                      setLiveTranscript("")
                      setRecordedAudioBlob(null)
                    }}
                    variant="outline"
                    className="w-full mb-4 border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    Clear & Record Again
                  </Button>
                </motion.div>
              )}

              <Button
                onClick={handleProcessRecording}
                disabled={!transcribedText || processing || isRecording}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-card hover:from-rose-600 hover:to-rose-700 border-0 shadow-lg shadow-rose-600/25 transition-all hover:shadow-xl hover:shadow-rose-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                Process Recording
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Made with{" "}
          <Heart className="h-3 w-3 text-coral-400 fill-coral-400" /> in
          SF
        </p>
      </footer>
    </div>
  )
}
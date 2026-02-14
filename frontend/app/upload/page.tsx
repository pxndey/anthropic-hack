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
  const audioInputRef = useRef<HTMLInputElement>(null)

  const [textFile, setTextFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [dragOverText, setDragOverText] = useState(false)
  const [dragOverAudio, setDragOverAudio] = useState(false)

  const handleTextDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOverText(false)
    const file = e.dataTransfer.files[0]
    if (file) setTextFile(file)
  }, [])

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOverAudio(false)
    const file = e.dataTransfer.files[0]
    if (file) setAudioFile(file)
  }, [])

  const simulateProcessing = useCallback(async () => {
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
  }, [])

  const handleRecordToggle = () => {
    setIsRecording((prev) => !prev)
    if (isRecording) {
      setAudioFile(new File([], "recording.wav", { type: "audio/wav" }))
    }
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
                {"Order #ORD-2140214 \u2022 $12,450.00"}
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
                    setAudioFile(null)
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
                onClick={simulateProcessing}
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
                    .mp3, .wav, .m4a
                  </p>
                </div>
                <Sparkles className="ml-auto h-5 w-5 text-rose-300" />
              </div>

              {/* Audio upload zone */}
              <div
                onDrop={handleAudioDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverAudio(true)
                }}
                onDragLeave={() => setDragOverAudio(false)}
                onClick={() => audioInputRef.current?.click()}
                className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-all ${
                  dragOverAudio
                    ? "border-rose-600 bg-rose-600/5"
                    : "border-border hover:border-rose-300 hover:bg-muted/50"
                }`}
                role="button"
                tabIndex={0}
                aria-label="Drop or click to upload audio file"
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a"
                  className="hidden"
                  onChange={(e) =>
                    setAudioFile(e.target.files?.[0] || null)
                  }
                />
                <AnimatePresence mode="wait">
                  {audioFile ? (
                    <motion.div
                      key="file"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100"
                      >
                        <Check className="h-5 w-5 text-emerald-600" />
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">
                        {audioFile.name}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Upload Audio File
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Record button */}
              <button
                onClick={handleRecordToggle}
                className={`mb-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 py-4 transition-all ${
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

              <Button
                onClick={simulateProcessing}
                disabled={!audioFile || processing}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-card hover:from-rose-600 hover:to-rose-700 border-0 shadow-lg shadow-rose-600/25 transition-all hover:shadow-xl hover:shadow-rose-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                Transcribe & Process
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

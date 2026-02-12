import { useRef, useState, useEffect } from 'react'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'

export default function VideoPlayer({ src, isVisible }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  // Autoplay/pause based on visibility
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVisible) {
      video.play().catch(() => {})
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [isVisible])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    setMuted(!muted)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setProgress((video.currentTime / video.duration) * 100)
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    video.currentTime = pct * video.duration
  }

  return (
    <div className="relative w-full bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        className="w-full max-h-[70vh] object-contain"
      />

      {/* Play/Pause overlay */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
            <Play size={32} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); handleSeek(e) }}
      >
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

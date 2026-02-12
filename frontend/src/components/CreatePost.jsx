import { useState, useRef } from 'react'
import { X, ImagePlus, Video, Loader2, Calendar, FileText, Send, Clock } from 'lucide-react'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'

export default function CreatePost({ onPostCreated, onClose, editDraft = null }) {
  const { user } = useAuth()
  const [content, setContent] = useState(editDraft?.content || '')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState(
    editDraft?.images?.map((img) => ({ url: img.image, existing: true })) || []
  )
  const [video, setVideo] = useState(null)
  const [videoPreview, setVideoPreview] = useState(editDraft?.video || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const imageRef = useRef()
  const videoRef = useRef()

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    if (video || videoPreview) {
      setError('Impossible de mixer vidéo et images')
      return
    }
    if (images.length + files.length > 10) {
      setError('Maximum 10 images')
      return
    }
    setError('')
    setImages([...images, ...files])
    setPreviews([...previews, ...files.map((f) => ({ url: URL.createObjectURL(f), existing: false }))])
  }

  const handleVideo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (images.length > 0 || previews.length > 0) {
      setError('Impossible de mixer vidéo et images')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('Vidéo trop lourde (max 100 Mo)')
      return
    }
    setError('')
    setVideo(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const removeImage = (index) => {
    if (!previews[index].existing) {
      URL.revokeObjectURL(previews[index].url)
    }
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    if (videoPreview && !editDraft?.video) URL.revokeObjectURL(videoPreview)
    setVideo(null)
    setVideoPreview(null)
  }

  const submitPost = async (status) => {
    if (!content.trim() && images.length === 0 && !video && !videoPreview) {
      setError('Ajoutez du texte, des images ou une vidéo')
      return
    }
    if (status === 'scheduled' && !scheduledAt) {
      setError('Choisissez une date de publication')
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('content', content.trim())
      formData.append('status', status)
      if (status === 'scheduled') {
        formData.append('scheduled_at', new Date(scheduledAt).toISOString())
      }
      if (video) formData.append('video', video)
      images.forEach((img) => formData.append('images', img))

      if (editDraft) {
        await socialService.updatePost(editDraft.id, formData)
      } else {
        await socialService.createPost(formData)
      }

      // Cleanup
      setContent('')
      setImages([])
      previews.forEach((p) => { if (!p.existing) URL.revokeObjectURL(p.url) })
      setPreviews([])
      removeVideo()

      if (onPostCreated) onPostCreated()
      if (onClose) onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">
          {editDraft ? 'Modifier le brouillon' : 'Nouvelle publication'}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
              {user.username?.[0]?.toUpperCase()}
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            rows={4}
            maxLength={2000}
            className="flex-1 resize-none border-0 focus:ring-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Image previews */}
        {previews.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {previews.map((preview, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={preview.url} alt="" className="w-24 h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Video preview */}
        {videoPreview && (
          <div className="relative mt-3 rounded-lg overflow-hidden bg-black">
            <video src={videoPreview} className="w-full max-h-48 object-contain" controls />
            <button
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Schedule date picker */}
        {showSchedule && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              Programmer la publication
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Footer - Media buttons + Actions */}
      <div className="px-4 pb-4 space-y-3">
        {/* Media buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ImagePlus size={20} />
            <span className="hidden sm:inline">Photos</span>
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <Video size={20} />
            <span className="hidden sm:inline">Vidéo</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSchedule(!showSchedule)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              showSchedule ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
            }`}
          >
            <Calendar size={20} />
            <span className="hidden sm:inline">Programmer</span>
          </button>

          <input ref={imageRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
          <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => submitPost('draft')}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <FileText size={16} />
            Brouillon
          </button>

          {showSchedule && scheduledAt ? (
            <button
              type="button"
              onClick={() => submitPost('scheduled')}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
              Programmer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submitPost('published')}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Publier
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

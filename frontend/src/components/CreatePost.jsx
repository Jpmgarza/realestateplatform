import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      setError('Maximum 5 images par publication')
      return
    }
    setError('')
    const newImages = [...images, ...files]
    setImages(newImages)

    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setPreviews([...previews, ...newPreviews])
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index])
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && images.length === 0) return

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('content', content.trim())
      images.forEach((img) => formData.append('images', img))

      await socialService.createPost(formData)
      setContent('')
      setImages([])
      previews.forEach((p) => URL.revokeObjectURL(p))
      setPreviews([])
      if (onPostCreated) onPostCreated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-600 font-semibold">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez quelque chose..."
            rows={3}
            maxLength={2000}
            className="flex-1 resize-none border-0 focus:ring-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Image previews */}
        {previews.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {previews.map((preview, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img
                  src={preview}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg"
                />
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

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ImagePlus size={20} />
            <span>Photo</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="hidden"
          />
          <button
            type="submit"
            disabled={loading || (!content.trim() && images.length === 0)}
            className="bg-primary-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Publier
          </button>
        </div>
      </form>
    </div>
  )
}

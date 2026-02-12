import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

export default function ImageCarousel({ images }) {
  if (!images || images.length === 0) return null

  if (images.length === 1) {
    return (
      <img
        src={images[0].image}
        alt=""
        className="w-full max-h-[70vh] object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <Swiper
      modules={[Pagination]}
      pagination={{ clickable: true }}
      spaceBetween={0}
      slidesPerView={1}
      className="w-full max-h-[70vh] feed-carousel"
    >
      {images.map((img) => (
        <SwiperSlide key={img.id}>
          <img
            src={img.image}
            alt=""
            className="w-full max-h-[70vh] object-cover"
            loading="lazy"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

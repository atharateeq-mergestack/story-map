'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type ImageCarouselProps = {
  images: string[];
  title?: string;
};

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full bg-muted aspect-video flex items-center justify-center rounded-lg">
        <p className="text-muted-foreground text-sm">No image available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="w-full space-y-3">
      {/* Main Image */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <Image
          src={images[currentIndex] || '/placeholder.svg'}
          width={1000}
          height={1000}
          alt={`${title || 'Destination'} - Image ${currentIndex + 1}`}
          className="w-full h-64 object-cover"
        />

        {images.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
              {currentIndex + 1}
              {' '}
              /
              {images.length}
            </div>
          </>
        )}
      </div>

      {/* {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-1 h-12 rounded overflow-hidden border-2 transition-all ${index === currentIndex ? 'border-foreground' : 'border-transparent opacity-60'
              }`}
              aria-label={`Go to image ${index + 1}`}
            >
              <img
                src={image || '/placeholder.svg'}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )} */}
    </div>
  );
}

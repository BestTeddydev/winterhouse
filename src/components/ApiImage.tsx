'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ApiImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  fallback?: string
}

export default function ApiImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  quality = 75,
  sizes,
  fallback = '/placeholder-image.jpg',
  ...props
}: ApiImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        
        // Extract filename from GCS URL
        const urlParts = src.split('/')
        const filename = urlParts[urlParts.length - 1]
        
        if (!filename) {
          setHasError(true)
          return
        }
        
        // Get signed URL from our API
        const response = await fetch(`/api/images/${filename}/signed-url`)
        
        if (!response.ok) {
          throw new Error('Failed to get signed URL')
        }
        
        const data = await response.json()
        setImageUrl(data.url)
      } catch (error) {
        console.error('Error fetching signed URL:', error)
        setHasError(true)
        setImageUrl(fallback)
      } finally {
        setIsLoading(false)
      }
    }

    if (src) {
      fetchSignedUrl()
    }
  }, [src, fallback])

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    )
  }

  if (hasError) {
    return (
      <Image
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        className={className}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        {...props}
      />
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fill={fill}
      priority={priority}
      quality={quality}
      sizes={sizes}
      onError={() => {
        setHasError(true)
        setImageUrl(fallback)
      }}
      {...props}
    />
  )
}
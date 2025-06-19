import React, { useState, useEffect, useCallback, useRef } from 'react'
import { RotateCcw, Scissors } from 'react-feather'
import formatTime from '../../utils/formatTime'

interface Clip {
  id: string
  name: string
  src: string
  duration: number
}

type TransformationType = 'clip' | 'trim' | 'cut'

export interface ClipTransformation {
  id: string
  clipId: string
  type: TransformationType
  startTime: number
  endTime: number
  originalStartTime: number
  originalEndTime: number
  timestamp: string
}

export interface TransformationSchema {
  version: string
  transformations: ClipTransformation[]
  metadata: {
    totalClips: number
    totalDuration: number
    createdAt: string
    updatedAt: string
  }
}

interface PlayerProps {
  clipList: Clip[]
  exportSettings: {
    format: string
    quality: string
    resolution: string
  }
}

const Player: React.FC<PlayerProps> = ({ clipList, exportSettings }) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const currentClip = clipList[currentClipIndex]
  const videoRef = useRef<HTMLVideoElement>(null)

  // Transformation state
  const [transformations, setTransformations] = useState<ClipTransformation[]>([])
  const initialTimestamp = new Date().toISOString()
  const [transformationSchema, setTransformationSchema] = useState<TransformationSchema>({
    version: '1.0',
    transformations: [],
    metadata: {
      totalClips: clipList.length,
      totalDuration: 0,
      createdAt: initialTimestamp,
      updatedAt: initialTimestamp,
    },
  })

  // Helpers
  const getCurrentTransformation = useCallback(() => {
    return transformations.find(t => t.clipId === currentClip?.id)
  }, [transformations, currentClip])

  const getEffectiveClipBounds = useCallback(() => {
    if (!currentClip) return { startTime: 0, endTime: 0, duration: 0 }
    const t = getCurrentTransformation()
    if (t) {
      return { startTime: t.startTime, endTime: t.endTime, duration: t.endTime - t.startTime }
    }
    return { startTime: 0, endTime: currentClip.duration, duration: currentClip.duration }
  }, [currentClip, getCurrentTransformation])

  const removeClipTransformation = useCallback((clipId: string) => {
    setTransformations(prev => prev.filter(t => t.clipId !== clipId))
  }, [])

  // Sync schema metadata on transformations change
  useEffect(() => {
    let total = 0
    clipList.forEach(clip => {
      const t = transformations.find(tr => tr.clipId === clip.id)
      total += t ? t.endTime - t.startTime : clip.duration
    })
    setTransformationSchema(prev => ({
      ...prev,
      transformations,
      metadata: {
        totalClips: clipList.length,
        totalDuration: total,
        createdAt: prev.metadata.createdAt,
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [transformations, clipList])

  // Clipping UI state
  const [clipStart, setClipStart] = useState(0)
  const [clipEnd, setClipEnd] = useState(0)
  const [isClipping, setIsClipping] = useState(false)

  const startClipping = () => {
    setIsClipping(true)
    const t = getCurrentTransformation()
    if (t) {
      setClipStart(t.startTime)
      setClipEnd(t.endTime)
    } else {
      const { startTime, endTime } = getEffectiveClipBounds()
      setClipStart(startTime)
      setClipEnd(endTime)
    }
  }

  const applyClip = () => {
    if (!currentClip) return
    const newT: ClipTransformation = {
      id: `transform-${currentClip.id}-${Date.now()}`,
      clipId: currentClip.id,
      type: 'clip',
      startTime: clipStart,
      endTime: clipEnd,
      originalStartTime: 0,
      originalEndTime: currentClip.duration,
      timestamp: new Date().toISOString(),
    }
    setTransformations(prev => [
      ...prev.filter(t => t.clipId !== currentClip.id),
      newT,
    ])
    setIsClipping(false)
  }

  // Video playback bounds enforcement
  const onVideoLoaded = () => {
    const { startTime } = getEffectiveClipBounds()
    if (videoRef.current) videoRef.current.currentTime = startTime
  }

  const onTimeUpdate = () => {
    if (!videoRef.current) return
    const { startTime, endTime } = getEffectiveClipBounds()
    const current = videoRef.current.currentTime
    if (current > endTime) {
      videoRef.current.pause()
      videoRef.current.currentTime = startTime
    }
    if (current < startTime) {
      videoRef.current.currentTime = startTime
    }
  }

  // Preview & Export
  const stitchAndPreview = () => {
    console.log('Previewing with transformations:', transformationSchema)
    // existing preview logic...
  }

  const exportVideo = async () => {
    const exportData = {
      clips: clipList,
      transformationSchema,
      exportSettings,
    }
    console.log('Exporting with data', exportData)
    try {
      const res = await fetch('/api/video/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      })
      if (!res.ok) throw new Error(res.statusText)
      const result = await res.json()
      console.log('Export success', result)
    } catch (err) {
      console.error('Export failed, simulating...', err)
      // fallback simulation
    }
  }

  // Timeline data
  const timelineMap = clipList.map(clip => {
    const t = transformations.find(tr => tr.clipId === clip.id)
    const effDur = t ? t.endTime - t.startTime : clip.duration
    return { ...clip, effectiveDuration: effDur, hasTransformation: !!t }
  })

  return (
    <div>
      {/* Transformation Status Panel */}
      {transformations.length > 0 && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-800 flex space-x-2">
          {transformations.map(t => {
            const clip = clipList.find(c => c.id === t.clipId)
            return (
              <span key={t.id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded">
                <Scissors className="mr-1" size={14} />
                {clip?.name}: {formatTime(t.startTime)} - {formatTime(t.endTime)}
                <button onClick={() => removeClipTransformation(t.clipId)} className="ml-2">×</button>
              </span>
            )
          })}
        </div>
      )}

      {/* Video Player */}
      <video
        ref={videoRef}
        src={currentClip?.src}
        onLoadedMetadata={onVideoLoaded}
        onTimeUpdate={onTimeUpdate}
        controls
        className="w-full"
      />

      {/* Controls */}
      <div className="mt-2 flex items-center space-x-4">
        <button onClick={startClipping} className="px-3 py-1 bg-gray-200 rounded">
          {getCurrentTransformation() ? 'Edit Clip' : 'Clip'}
        </button>
        {isClipping && (
          <div className="flex items-center space-x-2">
            <label>
              Start:
              <input
                type="number"
                value={clipStart}
                onChange={e => setClipStart(Number(e.target.value))}
                className="ml-1 w-20"
              />
            </label>
            <label>
              End:
              <input
                type="number"
                value={clipEnd}
                onChange={e => setClipEnd(Number(e.target.value))}
                className="ml-1 w-20"
              />
            </label>
            <button onClick={applyClip} className="px-2 py-1 bg-green-200 rounded">Apply</button>
          </div>
        )}
        <span>
          Duration: {formatTime(getEffectiveClipBounds().duration)}
          {getCurrentTransformation() && (
            <span className="text-purple-600 ml-2">
              ({formatTime(getEffectiveClipBounds().startTime)} - {formatTime(getEffectiveClipBounds().endTime)})
            </span>
          )}
        </span>
        <button onClick={stitchAndPreview} className="px-3 py-1 bg-blue-200 rounded">Preview</button>
        <button onClick={exportVideo} className="px-3 py-1 bg-blue-400 text-white rounded">Export</button>
      </div>

      {/* Timeline Visualization */}
      <div className="mt-4 flex h-4">
        {timelineMap.map(clip => (
          <div
            key={clip.id}
            className={`relative border mx-1 ${clip.hasTransformation ? 'bg-purple-600 border-purple-700' : 'bg-blue-600 border-blue-700'}`}
            style={{ width: `${(clip.effectiveDuration / transformationSchema.metadata.totalDuration) * 100}%` }}
            onClick={() => {
              const t = transformations.find(tr => tr.clipId === clip.id)
              const time = t ? t.startTime : 0
              if (videoRef.current) videoRef.current.currentTime = time
              setCurrentClipIndex(clipList.findIndex(c => c.id === clip.id))
            }}
          >
            {clip.hasTransformation && (
              <>
                <span className="absolute -top-2 right-0 text-purple-600">✂️</span>
                <button
                  onClick={e => { e.stopPropagation(); removeClipTransformation(clip.id) }}
                  className="absolute top-0 left-0 p-1 text-white"
                >
                  <RotateCcw size={12} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Player
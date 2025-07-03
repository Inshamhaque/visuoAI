import {
  AbsoluteFill,
  OffthreadVideo,
  Audio,
  Img,
  Sequence,
} from "remotion";
import { MediaFile, TextElement } from "@/app/types/types";

const REMOTION_SAFE_FRAME = 0;

interface SequenceItemOptions {
  handleTextChange?: (id: string, text: string) => void;
  fps: number;
  editableTextId?: string | null;
  currentTime?: number;
}

const toCssUnit = (
  value?: number | string,
  fallback: string = "auto"
): string => {
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string" && /^\d+$/.test(value)) return `${value}px`;
  return value || fallback;
};

const calculateFrames = (
  display: { from: number; to: number },
  fps: number
) => {
  const from = display.from * fps;
  const to = display.to * fps;
  const durationInFrames = Math.max(1, to - from);
  return { from, durationInFrames };
};

export const SequenceItem: Record<
  string,
  (item: any, options: SequenceItemOptions) => JSX.Element
> = {
  video: (item: MediaFile, options: SequenceItemOptions) => {
    const { fps } = options;

    const playbackRate = item.playbackSpeed || 1;
    const { from, durationInFrames } = calculateFrames(
      {
        from: item.positionStart,
        to: item.positionEnd,
      },
      fps
    );

    const trim = {
      from: item.startTime / playbackRate,
      to: item.endTime / playbackRate,
    };

    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
        style={{ pointerEvents: "none" }}
      >
        <AbsoluteFill
          data-track-item="transition-element"
          className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
          style={{
            pointerEvents: "auto",
            top: toCssUnit(item.y, "0px"),
            left: toCssUnit(item.x, "0px"),
            width: toCssUnit(item.width, "100%"),
            height: toCssUnit(item.height, "auto"),
            transform: "none",
            zIndex: item.zIndex ?? 0,
            opacity:
              item?.opacity !== undefined ? item.opacity / 100 : 1,
            borderRadius: `10px`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: toCssUnit(item.width, "100%"),
              height: toCssUnit(item.height, "auto"),
              position: "relative",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <OffthreadVideo
              startFrom={trim.from * fps}
              endAt={trim.to * fps + REMOTION_SAFE_FRAME}
              playbackRate={playbackRate}
              src={item.src || ""}
              volume={typeof item.volume === "number" ? item.volume / 100 : 1}
              style={{
                pointerEvents: "none",
                top: 0,
                left: 0,
                width: toCssUnit(item.width, "100%"),
                height: toCssUnit(item.height, "auto"),
                position: "absolute",
              }}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    );
  },

  text: (item: TextElement, options: SequenceItemOptions) => {
    const { handleTextChange, fps, editableTextId } = options;

    const { from, durationInFrames } = calculateFrames(
      {
        from: item.positionStart,
        to: item.positionEnd,
      },
      fps
    );

    return (
      <Sequence
        className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-text pointer-events-none`}
        key={item.id}
        from={from}
        durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
        data-track-item="transition-element"
        style={{
          position: "absolute",
          width: toCssUnit(item.width, "100%"),
          height: toCssUnit(item.height, "auto"),
          fontSize: toCssUnit(item.fontSize, "16px"),
          top: toCssUnit(item.y, "0px"),
          left: toCssUnit(item.x, "0px"),
          color: item.color || "#000000",
          opacity: item.opacity !== undefined ? item.opacity / 100 : 1,
          fontFamily: item.font || "Arial",
        }}
      >
        <div
          data-text-id={item.id}
          style={{
            height: "100%",
            boxShadow: "none",
            outline: "none",
            whiteSpace: "normal",
            backgroundColor: item.backgroundColor || "transparent",
            zIndex: item.zIndex ?? 0,
            position: "relative",
            width: "100%",
          }}
          dangerouslySetInnerHTML={{ __html: item.text }}
          className="designcombo_textLayer"
        />
      </Sequence>
    );
  },

  image: (item: MediaFile, options: SequenceItemOptions) => {
    const { fps } = options;

    const { from, durationInFrames } = calculateFrames(
      {
        from: item.positionStart,
        to: item.positionEnd,
      },
      fps
    );

    const crop = item.crop || {
      x: 0,
      y: 0,
      width: item.width,
      height: item.height,
    };

    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
        style={{ pointerEvents: "none" }}
      >
        <AbsoluteFill
          data-track-item="transition-element"
          className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
          style={{
            pointerEvents: "auto",
            top: toCssUnit(item.y, "0px"),
            left: toCssUnit(item.x, "0px"),
            width: toCssUnit(crop.width, "100%"),
            height: toCssUnit(crop.height, "auto"),
            opacity:
              item?.opacity !== undefined ? item.opacity / 100 : 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: toCssUnit(item.width, "100%"),
              height: toCssUnit(item.height, "auto"),
              position: "relative",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <Img
              style={{
                pointerEvents: "none",
                top: toCssUnit(-crop.y, "0px"),
                left: toCssUnit(-crop.x, "0px"),
                width: toCssUnit(item.width, "100%"),
                height: toCssUnit(item.height, "auto"),
                position: "absolute",
                zIndex: item.zIndex ?? 0,
              }}
              data-id={item.id}
              src={item.src || ""}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    );
  },

  audio: (item: MediaFile, options: SequenceItemOptions) => {
    const { fps } = options;
    const playbackRate = item.playbackSpeed || 1;

    const { from, durationInFrames } = calculateFrames(
      {
        from: item.positionStart / playbackRate,
        to: item.positionEnd / playbackRate,
      },
      fps
    );

    const trim = {
      from: item.startTime / playbackRate,
      to: item.endTime / playbackRate,
    };

    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
        style={{
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <AbsoluteFill>
          <Audio
            startFrom={trim.from * fps}
            endAt={trim.to * fps + REMOTION_SAFE_FRAME}
            playbackRate={playbackRate}
            src={item.src || ""}
            volume={typeof item.volume === "number" ? item.volume / 100 : 1}
          />
        </AbsoluteFill>
      </Sequence>
    );
  },
};

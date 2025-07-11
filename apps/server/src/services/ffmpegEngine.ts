import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

// Updated type definitions for new payload structure
interface MediaFile {
  id: string;
  fileName: string;
  fileId: string;
  type: string;
  startTime: number;
  src: string; // URL for video download
  endTime: number;
  positionStart: number; // Timeline position start
  positionEnd: number;   // Timeline position end
  includeInMerge: boolean;
  playbackSpeed: number;
  volume: number;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TextElement {
  id: string;
  text: string;
  positionStart: number;
  positionEnd: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface ExportSettings {
  resolution: string;
  quality: string;
  speed: string;
  fps: number;
  format: string;
  includeSubtitles: boolean;
}

interface Resolution {
  width: number;
  height: number;
}

interface InnerPayload {
  id: string;
  projectName: string;
  createdAt: string;
  lastModified: string;
  mediaFiles: MediaFile[];
  textElements: TextElement[];
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  duration: number;
  activeSection: string;
  activeElement: string;
  activeElementIndex: number;
  filesID: string[];
  zoomLevel: number;
  timelineZoom: number;
  enableMarkerTracking: boolean;
  resolution: Resolution;
  fps: number;
  aspectRatio: string;
  history: any[];
  future: any[];
  exportSettings: ExportSettings;
}

interface RootPayload {
  payload: InnerPayload;
}

interface TrimmedVideo {
  path: string;
  positionStart: number;
  fileName: string;
  playbackSpeed: number;
  volume: number;
}

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

export class VideoProcessor {
  private tempDir: string;
  private outputDir: string;

  constructor() {
    this.tempDir = './temp';
    this.outputDir = './output';
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * DOWNLOAD VIDEO FROM URL
   * Download video from S3 URL to local temp directory
   */
  async downloadVideo(url: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const file = fs.createWriteStream(outputPath);
      
      console.log(`📥 Downloading: ${url}`);
      
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${outputPath}`);
          resolve(outputPath);
        });
        
        file.on('error', (err) => {
          fs.unlink(outputPath, () => {}); // Delete partial file
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * 1. TRIMMING VIDEOS
   * Extract specific portions of videos based on startTime and endTime
   */
  async trimVideo(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Trimmed video saved: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err: any) => {
          console.error('❌ Trimming error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * 2. PREPARING VIDEOS FOR STITCHING
   * Download and trim all videos based on payload data
   */
  async prepareVideosForStitching(payload: InnerPayload): Promise<TrimmedVideo[]> {
    const trimmedVideos: TrimmedVideo[] = [];
    
    // Filter media files that should be included in merge and sort by positionStart
    const mediaFilesToProcess = payload.mediaFiles
      .filter(mediaFile => mediaFile.includeInMerge)
      .sort((a, b) => a.positionStart - b.positionStart);
    
    for (const mediaFile of mediaFilesToProcess) {
      try {
        // Download video from S3 URL
        const downloadedPath = `${this.tempDir}/downloaded_${mediaFile.fileName}`;
        await this.downloadVideo(mediaFile.src, downloadedPath);
        
        // Trim the downloaded video
        const outputPath = `${this.tempDir}/trimmed_${mediaFile.fileName}`;
        await this.trimVideo(downloadedPath, outputPath, mediaFile.startTime, mediaFile.endTime);
        
        trimmedVideos.push({
          path: outputPath,
          positionStart: mediaFile.positionStart,
          fileName: mediaFile.fileName,
          playbackSpeed: mediaFile.playbackSpeed,
          volume: mediaFile.volume
        });
        
      } catch (error: any) {
        console.error(`Failed to process ${mediaFile.fileName}:`, error.message);
        // Continue with other videos even if one fails
      }
    }
    
    if (trimmedVideos.length === 0) {
      throw new Error('No videos were successfully processed. Please check your video URLs and network connection.');
    }
    
    // Sort by positionStart to maintain sequence
    return trimmedVideos.sort((a, b) => a.positionStart - b.positionStart);
  }

  /**
   * 3. STITCHING VIDEOS - UPDATED FOR NEW PAYLOAD
   * Concatenate multiple videos into one
   */
  async stitchVideos(videoList: TrimmedVideo[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (videoList.length === 0) {
        reject(new Error('No videos to stitch'));
        return;
      }
      
      if (videoList.length === 1) {
        // If only one video, just copy it
        fs.copyFileSync(videoList[0].path, outputPath);
        console.log(`✅ Single video copied: ${outputPath}`);
        resolve(outputPath);
        return;
      }
      
      // Method 1: Using concat demuxer (recommended for same format videos)
      this.stitchVideosUsingConcat(videoList, outputPath)
        .then(resolve)
        .catch(() => {
          // Fallback to filter complex method
          console.log('🔄 Concat demuxer failed, trying filter complex method...');
          this.stitchVideosUsingFilterComplex(videoList, outputPath)
            .then(resolve)
            .catch(reject);
        });
    });
  }

  /**
   * Method 1: Using concat demuxer (faster, but requires same format)
   */
  private async stitchVideosUsingConcat(videoList: TrimmedVideo[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a temporary file list for concat demuxer
      const fileListPath = `${this.tempDir}/filelist.txt`;
      const fileListContent = videoList.map(video => `file '${path.resolve(video.path)}'`).join('\n');
      
      fs.writeFileSync(fileListPath, fileListContent);
      
      console.log(`🔗 Stitching ${videoList.length} videos using concat demuxer...`);
      
      ffmpeg()
        .input(fileListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Videos stitched successfully: ${outputPath}`);
          // Clean up file list
          fs.unlinkSync(fileListPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Concat demuxer error:', err);
          // Clean up file list
          try { fs.unlinkSync(fileListPath); } catch (e) {}
          reject(err);
        })
        .run();
    });
  }

  /**
   * Method 2: Using filter complex (slower, but works with different formats)
   */
  private async stitchVideosUsingFilterComplex(videoList: TrimmedVideo[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // Add all input videos
      videoList.forEach(video => {
        command.addInput(video.path);
      });
      
      // Create filter complex for concatenation
      const filterComplex = videoList.map((_, index) => `[${index}:v][${index}:a]`).join('') + 
                           `concat=n=${videoList.length}:v=1:a=1[outv][outa]`;
      
      console.log(`🔗 Stitching ${videoList.length} videos using filter complex...`);
      console.log('Filter complex:', filterComplex);
      
      command
        .complexFilter(filterComplex)
        .outputOptions(['-map', '[outv]', '-map', '[outa]'])
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Videos stitched successfully: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Filter complex error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Check if video has audio stream
   */
  private async hasAudioStream(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.log(`Warning: Could not probe ${filePath}, assuming no audio`);
          resolve(false);
          return;
        }
        
        const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
        resolve(audioStreams.length > 0);
      });
    });
  }

  /**
   * 4. TEXT OVERLAY
   * Add text overlays to video based on text elements
   */
  async addTextOverlay(inputPath: string, outputPath: string, textElements: TextElement[], videoResolution: Resolution): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!textElements || textElements.length === 0) {
        // No text overlay needed, just copy the file
        fs.copyFileSync(inputPath, outputPath);
        console.log(`✅ No text overlay needed, video copied: ${outputPath}`);
        resolve(outputPath);
        return;
      }
      
      // Check if input video has audio
      const hasAudio = await this.hasAudioStream(inputPath);
      console.log(`🔊 Audio stream detected: ${hasAudio}`);
      
      let command = ffmpeg(inputPath);
      
      // Build filter complex for text overlays
      let filterComplex = '';
      let currentInput = '[0:v]';
      
      textElements.forEach((textElement, index) => {
        const {
          text,
          positionStart,
          positionEnd,
          x,
          y,
          fontSize = 24,
          color = 'white',
          fontFamily = 'Arial'
        } = textElement;
        
        const outputLabel = index === textElements.length - 1 ? '[outv]' : `[v${index + 1}]`;
        
        // Escape text for FFmpeg
        const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        
        // Build drawtext filter
        filterComplex += `${currentInput}drawtext=text='${escapedText}':` +
                        `fontsize=${fontSize}:` +
                        `fontcolor=${color}:` +
                        `x=${x}:y=${y}:` +
                        `enable='between(t,${positionStart},${positionEnd})'${outputLabel};`;
        
        currentInput = `[v${index + 1}]`;
      });
      
      // Remove the last semicolon
      filterComplex = filterComplex.slice(0, -1);
      
      console.log('🎨 Applying text overlay with filter:', filterComplex);
      
      command.complexFilter(filterComplex);
      
      // Map video output
      command.outputOptions(['-map', '[outv]']);
      
      // Map audio if it exists
      if (hasAudio) {
        command.outputOptions(['-map', '0:a']);
      }
      
      command
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Text overlay added: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Text overlay error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * 5. COMPLETE PROCESSING PIPELINE
   * Process the entire payload: download -> trim -> stitch -> add text overlays
   */
  async processVideo(rootPayload: RootPayload): Promise<string> {
    try {
      const payload = rootPayload.payload; // Extract inner payload
      
      console.log('🎬 Starting video processing...');
      console.log(`📊 Processing ${payload.mediaFiles.length} video(s)...`);
      console.log(`📋 Project: ${payload.projectName}`);
      
      // Step 1: Download and trim videos
      console.log('📥 Step 1: Downloading and trimming videos...');
      const trimmedVideos = await this.prepareVideosForStitching(payload);
      console.log(`✅ Successfully prepared ${trimmedVideos.length} video(s)`);
      
      // Step 2: Stitch videos
      console.log('🔗 Step 2: Stitching videos...');
      const stitchedPath = `${this.tempDir}/stitched_${payload.projectName}.mp4`;
      await this.stitchVideos(trimmedVideos, stitchedPath);
      
      // Step 3: Add text overlays
      console.log('📝 Step 3: Adding text overlays...');
      const finalOutputPath = `${this.outputDir}/final_${payload.projectName}.mp4`;
      await this.addTextOverlay(stitchedPath, finalOutputPath, payload.textElements, payload.resolution);
      
      console.log('✅ Video processing completed successfully!');
      console.log(`📁 Final output: ${finalOutputPath}`);
      
      // Cleanup temp files
      this.cleanup();
      
      return finalOutputPath;
      
    } catch (error: any) {
      console.error('❌ Video processing failed:', error.message);
      throw error;
    }
  }

  /**
   * 6. ADDITIONAL UTILITIES
   */
  
  // Get video information
  async getVideoInfo(filePath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration ?? 0,
            width: metadata.streams[0].width ?? 0,
            height: metadata.streams[0].height ?? 0,
            fps: eval(metadata.streams[0].r_frame_rate ?? "30"),
            hasAudio: metadata.streams.some(stream => stream.codec_type === 'audio')
          });
        }
      });
    });
  }

  // Resize video to match export settings
  async resizeVideo(inputPath: string, outputPath: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size(`${width}x${height}`)
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ Video resized: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Resize error:', err);
          reject(err);
        })
        .run();
    });
  }

  // Extract audio from video
  async extractAudio(inputPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .on('end', () => {
          console.log(`✅ Audio extracted: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Audio extraction error:', err);
          reject(err);
        })
        .run();
    });
  }

  // Cleanup temporary files
  private cleanup(): void {
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.tempDir, file));
      });
      console.log('🧹 Temporary files cleaned up');
    } catch (error) {
      console.error('Warning: Could not clean up temp files:', error);
    }
  }
}

// Example usage:
const processor = new VideoProcessor();

// Your payload structure
const yourPayload = {
  "payload": {
    "id": "88ba483d-2532-4de4-baaa-8f412d4b6aac",
    "projectName": "88ba483d-2532-4de4-baaa-8f412d4b6aac",
    "createdAt": "2025-07-11T19:03:39.113Z",
    "lastModified": "2025-07-11T19:03:39.113Z",
    "mediaFiles": [
      {
        "id": "88ba483d-2532-4de4-baaa-8f412d4b6aac_MergeSortScene",
        "fileName": "MergeSortScene.mp4",
        "fileId": "Anibot/88ba483d-2532-4de4-baaa-8f412d4b6aac/MergeSortScene.mp4",
        "type": "video",
        "startTime": 0,
        "src": "https://decentralized-web2-quickpay.s3.ap-south-1.amazonaws.com/Anibot/88ba483d-2532-4de4-baaa-8f412d4b6aac/MergeSortScene.mp4",
        "endTime": 5,
        "positionStart": -1,
        "positionEnd": 4,
        "includeInMerge": true,
        "playbackSpeed": 1,
        "volume": 100,
        "zIndex": 0,
        "x": 0,
        "y": 0,
        "width": 1920,
        "height": 1080,
        "rotation": 0,
        "opacity": 100,
        "crop": {
          "x": 0,
          "y": 0,
          "width": 960,
          "height": 540
        }
      }
      // ... other media files
    ],
    "textElements": [],
    "resolution": {
      "width": 1920,
      "height": 1080
    },
    "fps": 30,
    "exportSettings": {
      "resolution": "1080p",
      "quality": "high",
      "speed": "fastest",
      "fps": 30,
      "format": "mp4",
      "includeSubtitles": false
    }
  }
};

// Process the video
// processor.processVideo(yourPayload)
//   .then(outputPath => {
//     console.log('Video processing completed:', outputPath);
//   })
//   .catch(error => {
//     console.error('Processing failed:', error);
//   });
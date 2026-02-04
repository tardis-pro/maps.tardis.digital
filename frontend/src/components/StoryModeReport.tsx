/**
 * Story Mode Reports
 *
 * Generates guided tours of map insights, exportable as PDF or video.
 *
 * Features:
 * - Keyframe-based camera path definition
 * - Camera interpolation using flyTo sequences
 * - Screenshot capture for each keyframe
 * - PDF compilation with branding
 * - Video export support (planned)
 */

import React, { useState, useCallback, useRef } from 'react';
import { useMap } from '../context/MapContext';
import maplibregl, { Map } from 'maplibre-gl';

export interface StoryKeyframe {
  /** Unique identifier for the keyframe */
  id: string;
  /** Display title for this keyframe */
  title: string;
  /** Description/narrative for this keyframe */
  description: string;
  /** Camera position */
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  pitch?: number;
  bearing?: number;
  /** Duration for transition to this keyframe (ms) */
  duration: number;
  /** Highlighted features/annotations */
  annotations?: KeyframeAnnotation[];
  /** Thumbnail (auto-captured) */
  thumbnail?: string;
}

export interface KeyframeAnnotation {
  /** Annotation type */
  type: 'marker' | 'polygon' | 'circle' | 'popup';
  /** Position or coordinates */
  coordinates: [number, number];
  /** Label text */
  label?: string;
  /** Style options */
  style?: Record<string, unknown>;
}

export interface StoryConfig {
  /** Story title */
  title: string;
  /** Story author */
  author?: string;
  /** Company/brand name */
  brand?: string;
  /** Brand logo URL */
  logoUrl?: string;
  /** Theme color */
  themeColor?: string;
  /** Include timestamp */
  includeTimestamp?: boolean;
  /** Include legend */
  includeLegend?: boolean;
}

export interface ExportOptions {
  /** Export format */
  format: 'pdf' | 'png' | 'jpg';
  /** Image quality (1-100 for JPG) */
  quality?: number;
  /** Page size for PDF */
  pageSize?: 'A4' | 'Letter' | 'Auto';
  /** Orientation for PDF */
  orientation?: 'portrait' | 'landscape';
  /** Include map screenshots */
  includeScreenshots?: boolean;
  /** Include narrative text */
  includeNarrative?: boolean;
}

interface StoryReportProps {
  /** Story keyframes */
  keyframes: StoryKeyframe[];
  /** Story configuration */
  config?: Partial<StoryConfig>;
  /** Export options */
  exportOptions?: Partial<ExportOptions>;
  /** Called when story is exported */
  onExport?: (blob: Blob, filename: string) => void;
}

/**
 * Story Mode Report Generator
 */
export class StoryReportGenerator {
  private map: Map | null = null;
  private keyframes: StoryKeyframe[];
  private config: StoryConfig;
  private canvas: HTMLCanvasElement | null = null;

  constructor(
    map: Map | null,
    keyframes: StoryKeyframe[],
    config: Partial<StoryConfig> = {}
  ) {
    this.map = map;
    this.keyframes = keyframes;
    this.config = {
      title: 'Map Story Report',
      themeColor: '#3b82f6',
      includeTimestamp: true,
      includeLegend: true,
      ...config,
    };
  }

  /**
   * Navigate to a specific keyframe
   */
  async navigateToKeyframe(keyframeId: string): Promise<void> {
    const keyframe = this.keyframes.find((k) => k.id === keyframeId);
    if (!keyframe || !this.map) return;

    return new Promise((resolve) => {
      this.map?.flyTo({
        center: keyframe.center,
        zoom: keyframe.zoom,
        pitch: keyframe.pitch ?? 0,
        bearing: keyframe.bearing ?? 0,
        duration: keyframe.duration,
        essential: true,
      });
      resolve();
    });
  }

  /**
   * Capture screenshot at current view
   */
  async captureScreenshot(options: Partial<ExportOptions> = {}): Promise<string> {
    if (!this.map) return '';

    return new Promise((resolve) => {
      this.map.once('idle', () => {
        this.map?.getCanvas().toDataURL('image/png', 1.0, (err, dataUrl) => {
          resolve(err ? '' : dataUrl);
        });
      });
    });
  }

  /**
   * Generate PDF report
   */
  async generatePDF(options: Partial<ExportOptions> = {}): Promise<Blob> {
    const exportOptions: ExportOptions = {
      format: 'pdf',
      quality: 90,
      pageSize: 'A4',
      orientation: 'landscape',
      includeScreenshots: true,
      includeNarrative: true,
      ...options,
    };

    // Import jspdf dynamically (would be installed as dependency)
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: exportOptions.orientation,
      unit: 'mm',
      format: exportOptions.pageSize?.toLowerCase() as 'a4' | 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Title page
    doc.setFontSize(28);
    doc.setTextColor(59, 130, 246); // Theme color
    doc.text(this.config.title, pageWidth / 2, 60, { align: 'center' });

    if (this.config.author) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`By ${this.config.author}`, pageWidth / 2, 75, { align: 'center' });
    }

    if (this.config.includeTimestamp) {
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 90, {
        align: 'center',
      });
    }

    // Story pages
    for (let i = 0; i < this.keyframes.length; i++) {
      const keyframe = this.keyframes[i];
      doc.addPage();

      // Capture screenshot if enabled
      if (exportOptions.includeScreenshots) {
        await this.navigateToKeyframe(keyframe.id);
        const screenshot = await this.captureScreenshot();
        if (screenshot) {
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (imgWidth * 9) / 16; // 16:9 aspect ratio
          doc.addImage(screenshot, 'PNG', margin, margin, imgWidth, imgHeight);
        }
      }

      // Narrative text
      if (exportOptions.includeNarrative) {
        const textY = exportOptions.includeScreenshots ? margin + 100 : margin;

        // Keyframe title
        doc.setFontSize(18);
        doc.setTextColor(59, 130, 246);
        doc.text(keyframe.title, margin, textY);

        // Description
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(keyframe.description, pageWidth - margin * 2);
        doc.text(lines, margin, textY + 10);

        // Metadata
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        const metadata = `Zoom: ${keyframe.zoom}${
          keyframe.pitch ? ` | Pitch: ${keyframe.pitch}°` : ''
        }${keyframe.bearing ? ` | Bearing: ${keyframe.bearing}°` : ''}`;
        doc.text(metadata, margin, textY + 20 + lines.length * 6);
      }
    }

    // Footer with branding
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `${this.config.brand || 'Maps Platform'} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  }

  /**
   * Generate image strip (all keyframes as single image)
   */
  async generateImageStrip(
    options: Partial<ExportOptions> = {}
  ): Promise<string> {
    const exportOptions: ExportOptions = {
      format: 'png',
      includeScreenshots: true,
      includeNarrative: false,
      ...options,
    };

    const screenshots: string[] = [];

    for (const keyframe of this.keyframes) {
      await this.navigateToKeyframe(keyframe.id);
      const screenshot = await this.captureScreenshot();
      if (screenshot) {
        screenshots.push(screenshot);
      }
    }

    // Combine into vertical strip
    if (screenshots.length === 0) return '';

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const stripCanvas = document.createElement('canvas');
        stripCanvas.width = img.width;
        stripCanvas.height = img.height * screenshots.length;

        const ctx = stripCanvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        let yOffset = 0;
        screenshots.forEach((src) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            ctx.drawImage(tempImg, 0, yOffset);
            yOffset += tempImg.height;
          };
          tempImg.src = src;
        });

        setTimeout(() => {
          resolve(stripCanvas.toDataURL('image/png'));
        }, 100);
      };
      img.src = screenshots[0];
    });
  }
}

/**
 * Story Mode Editor Component
 */
export const StoryModeEditor: React.FC<{
  keyframes: StoryKeyframe[];
  onChange: (keyframes: StoryKeyframe[]) => void;
}> = ({ keyframes, onChange }) => {
  const { map } = useMap();
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const addKeyframe = useCallback(() => {
    if (!map) return;

    const center = map.getCenter();
    const newKeyframe: StoryKeyframe = {
      id: `keyframe-${Date.now()}`,
      title: `Keyframe ${keyframes.length + 1}`,
      description: '',
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      duration: 2000,
    };

    onChange([...keyframes, newKeyframe]);
    setSelectedKeyframe(newKeyframe.id);
  }, [map, keyframes, onChange]);

  const updateKeyframe = useCallback(
    (id: string, updates: Partial<StoryKeyframe>) => {
      onChange(
        keyframes.map((k) => (k.id === id ? { ...k, ...updates } : k))
      );
    },
    [keyframes, onChange]
  );

  const removeKeyframe = useCallback(
    (id: string) => {
      onChange(keyframes.filter((k) => k.id !== id));
      if (selectedKeyframe === id) {
        setSelectedKeyframe(null);
      }
    },
    [keyframes, onChange, selectedKeyframe]
  );

  const navigateTo = useCallback(
    async (id: string) => {
      if (!map) return;
      const keyframe = keyframes.find((k) => k.id === id);
      if (!keyframe) return;

      await map.flyTo({
        center: keyframe.center,
        zoom: keyframe.zoom,
        pitch: keyframe.pitch ?? 0,
        bearing: keyframe.bearing ?? 0,
        duration: keyframe.duration,
        essential: true,
      });
    },
    [map, keyframes]
  );

  return (
    <div className="story-mode-editor">
      <div className="editor-toolbar">
        <button onClick={addKeyframe} className="btn btn-primary">
          Add Keyframe
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="btn btn-secondary"
        >
          {isPlaying ? 'Stop Preview' : 'Preview Story'}
        </button>
      </div>

      <div className="keyframe-list">
        {keyframes.map((keyframe, index) => (
          <div
            key={keyframe.id}
            className={`keyframe-item ${
              selectedKeyframe === keyframe.id ? 'selected' : ''
            }`}
            onClick={() => {
              setSelectedKeyframe(keyframe.id);
              navigateTo(keyframe.id);
            }}
          >
            <div className="keyframe-number">{index + 1}</div>
            <div className="keyframe-info">
              <input
                type="text"
                value={keyframe.title}
                onChange={(e) =>
                  updateKeyframe(keyframe.id, { title: e.target.value })
                }
                className="keyframe-title-input"
                placeholder="Keyframe Title"
              />
              <div className="keyframe-meta">
                <span>Zoom: {keyframe.zoom}</span>
                {keyframe.pitch && <span>Pitch: {keyframe.pitch}°</span>}
                {keyframe.bearing && <span>Bearing: {keyframe.bearing}°</span>}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeKeyframe(keyframe.id);
              }}
              className="btn btn-danger btn-sm"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {selectedKeyframe && (
        <div className="keyframe-editor">
          <h3>Edit Keyframe</h3>
          <label>
            Title
            <input
              type="text"
              value={keyframes.find((k) => k.id === selectedKeyframe)?.title ?? ''}
              onChange={(e) =>
                updateKeyframe(selectedKeyframe, { title: e.target.value })
              }
            />
          </label>
          <label>
            Description
            <textarea
              value={
                keyframes.find((k) => k.id === selectedKeyframe)?.description ?? ''
              }
              onChange={(e) =>
                updateKeyframe(selectedKeyframe, { description: e.target.value })
              }
              rows={4}
            />
          </label>
          <div className="editor-row">
            <label>
              Duration (ms)
              <input
                type="number"
                value={
                  keyframes.find((k) => k.id === selectedKeyframe)?.duration ?? 2000
                }
                onChange={(e) =>
                  updateKeyframe(selectedKeyframe, {
                    duration: parseInt(e.target.value) || 2000,
                  })
                }
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Story Mode Report Viewer Component
 */
export const StoryModeViewer: React.FC<{
  keyframes: StoryKeyframe[];
  config?: Partial<StoryConfig>;
  onExport?: (format: ExportOptions['format']) => void;
}> = ({ keyframes, config, onExport }) => {
  const { map } = useMap();
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentKeyframe = keyframes[currentKeyframeIndex];

  const goToNext = useCallback(() => {
    setCurrentKeyframeIndex((i) => Math.min(i + 1, keyframes.length - 1));
  }, [keyframes.length]);

  const goToPrev = useCallback(() => {
    setCurrentKeyframeIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToKeyframe = useCallback((index: number) => {
    setCurrentKeyframeIndex(index);
  }, []);

  return (
    <div className={`story-mode-viewer ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="viewer-map">
        {/* Map renders here via MapContext */}
      </div>

      <div className="viewer-overlay">
        <div className="viewer-header">
          <h2>{currentKeyframe?.title}</h2>
          <p>{currentKeyframe?.description}</p>
        </div>

        <div className="viewer-progress">
          {keyframes.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${
                index === currentKeyframeIndex ? 'active' : ''
              }`}
              onClick={() => goToKeyframe(index)}
            />
          ))}
        </div>

        <div className="viewer-controls">
          <button onClick={goToPrev} disabled={currentKeyframeIndex === 0}>
            Previous
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-secondary"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            onClick={() => onExport?.('pdf')}
            className="btn-primary"
          >
            Export PDF
          </button>
          <button onClick={goToNext} disabled={currentKeyframeIndex === keyframes.length - 1}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryModeEditor;

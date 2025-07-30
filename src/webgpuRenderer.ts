import shaderCode from "./shaders.wgsl?raw";

export interface WebGPURendererOptions {
  canvas: HTMLCanvasElement;
  baseImage: HTMLImageElement;
  maskImage: HTMLImageElement | null;
}

export class WebGPURenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private adapter: GPUAdapter | null = null;

  constructor() {}

  /**
   * Check if WebGPU is supported in the current browser
   */
  static isSupported(): boolean {
    return "gpu" in navigator;
  }

  /**
   * Initialize WebGPU with the given canvas and images
   */
  async initialize(options: WebGPURendererOptions): Promise<void> {
    const { canvas, baseImage, maskImage } = options;

    // Get WebGPU adapter and device
    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      throw new Error("No appropriate GPUAdapter found");
    }

    this.device = await this.adapter.requestDevice();
    this.context = canvas.getContext("webgpu");
    if (!this.context) {
      throw new Error("Failed to get WebGPU context");
    }

    // Configure the canvas
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: canvasFormat,
    });

    // Render the images
    await this.render(baseImage, maskImage, canvasFormat);
  }

  /**
   * Render the base image with mask overlay
   */
  private async render(
    baseImage: HTMLImageElement,
    maskImage: HTMLImageElement | null,
    canvasFormat: GPUTextureFormat
  ): Promise<void> {
    if (!this.device || !this.context) {
      throw new Error("WebGPU not initialized");
    }

    // Create sampler
    const sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    // Create base texture
    const baseTexture = this.createTextureFromImage(this.device, baseImage);

    // Create mask texture (or empty texture if no mask)
    const maskTexture = maskImage
      ? this.createTextureFromImage(this.device, maskImage)
      : this.createEmptyTexture(this.device, baseImage.width, baseImage.height);

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ],
    });

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: baseTexture.createView(),
        },
        {
          binding: 2,
          resource: maskTexture.createView(),
        },
      ],
    });

    // Create render pipeline
    const renderPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: canvasFormat,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    // Render
    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6); // 6 vertices for 2 triangles (full-screen quad)
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Create a GPU texture from an HTML image element
   */
  private createTextureFromImage(
    device: GPUDevice,
    image: HTMLImageElement
  ): GPUTexture {
    const texture = device.createTexture({
      size: [image.width, image.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // Create a canvas to extract image data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    device.queue.writeTexture(
      { texture },
      imageData.data,
      {
        bytesPerRow: image.width * 4,
        rowsPerImage: image.height,
      },
      { width: image.width, height: image.height, depthOrArrayLayers: 1 }
    );

    return texture;
  }

  /**
   * Create an empty texture filled with zeros
   */
  private createEmptyTexture(
    device: GPUDevice,
    width: number,
    height: number
  ): GPUTexture {
    const texture = device.createTexture({
      size: [width, height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // Fill with empty data (all zeros)
    const emptyData = new Uint8Array(width * height * 4);
    device.queue.writeTexture(
      { texture },
      emptyData,
      {
        bytesPerRow: width * 4,
        rowsPerImage: height,
      },
      { width, height, depthOrArrayLayers: 1 }
    );

    return texture;
  }

  /**
   * Clean up WebGPU resources
   */
  destroy(): void {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.context = null;
    this.adapter = null;
  }
}

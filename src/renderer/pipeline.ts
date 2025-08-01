/**
 * WebGPU Pipeline - handles GPU operations for image segmentation rendering
 */

export class WebGPURenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private pipeline!: GPURenderPipeline;
  private baseTexture!: GPUTexture;
  private maskTexture!: GPUTexture;
  private sampler!: GPUSampler;
  private uniformBuffer!: GPUBuffer;
  private bindGroup!: GPUBindGroup;

  static isSupported(): boolean {
    return !!navigator.gpu;
  }

  async initialize({
    canvas,
    baseImage,
    maskImage,
  }: {
    canvas: HTMLCanvasElement;
    baseImage: HTMLImageElement;
    maskImage: HTMLImageElement | null;
  }): Promise<void> {
    // Get GPU adapter and device
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("Failed to get GPU adapter");
    }

    this.device = await adapter.requestDevice();

    // Configure canvas
    this.context = canvas.getContext("webgpu") as GPUCanvasContext;
    if (!this.context) {
      throw new Error("Failed to get WebGPU context");
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    // Create shaders
    const shaderModule = this.device.createShaderModule({
      label: "Segmentation Shader",
      code: await this.getShaderCode(),
    });

    // Create pipeline
    this.pipeline = this.device.createRenderPipeline({
      label: "Segmentation Pipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: presentationFormat,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-strip",
      },
    });

    // Create textures and resources
    await this.createTextures(baseImage, maskImage);
    this.createSampler();
    this.createUniformBuffer();
    this.createBindGroup();

    // Render
    this.render();
  }

  private async getShaderCode(): Promise<string> {
    return `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
  );
  
  var texCoord = array<vec2<f32>, 4>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0)
  );
  
  var output: VertexOutput;
  output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
  output.texCoord = texCoord[vertexIndex];
  return output;
}

@group(0) @binding(0) var baseSampler: sampler;
@group(0) @binding(1) var baseTexture: texture_2d<f32>;
@group(0) @binding(2) var maskTexture: texture_2d<f32>;

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let baseColor = textureSample(baseTexture, baseSampler, input.texCoord);
  let maskColor = textureSample(maskTexture, baseSampler, input.texCoord);
  
  if (maskColor.r < 0.01) {
    return baseColor;
  }
  
  // Directly use the RGB color values encoded in the mask
  // Canvas now encodes the actual RGB values directly into the mask
  let segmentColor = maskColor.rgb;
  
  return vec4<f32>(mix(baseColor.rgb, segmentColor, 0.4), 1.0);
}
`;
  }

  private async createTextures(
    baseImage: HTMLImageElement,
    maskImage: HTMLImageElement | null
  ): Promise<void> {
    // Create base image texture
    this.baseTexture = this.device.createTexture({
      label: "Base Image Texture",
      size: { width: baseImage.width, height: baseImage.height },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // Copy base image data
    const canvas2d = document.createElement("canvas");
    canvas2d.width = baseImage.width;
    canvas2d.height = baseImage.height;
    const ctx = canvas2d.getContext("2d")!;
    ctx.drawImage(baseImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, baseImage.width, baseImage.height);

    this.device.queue.writeTexture(
      { texture: this.baseTexture },
      imageData.data,
      { bytesPerRow: baseImage.width * 4 },
      { width: baseImage.width, height: baseImage.height }
    );

    // Create mask texture
    if (maskImage) {
      this.maskTexture = this.device.createTexture({
        label: "Mask Texture",
        size: { width: maskImage.width, height: maskImage.height },
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });

      // Copy mask image data
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = maskImage.width;
      maskCanvas.height = maskImage.height;
      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.drawImage(maskImage, 0, 0);
      const maskData = maskCtx.getImageData(
        0,
        0,
        maskImage.width,
        maskImage.height
      );

      this.device.queue.writeTexture(
        { texture: this.maskTexture },
        maskData.data,
        { bytesPerRow: maskImage.width * 4 },
        { width: maskImage.width, height: maskImage.height }
      );
    } else {
      // Create empty mask texture
      this.maskTexture = this.device.createTexture({
        label: "Empty Mask Texture",
        size: { width: 1, height: 1 },
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });

      this.device.queue.writeTexture(
        { texture: this.maskTexture },
        new Uint8Array([0, 0, 0, 0]),
        { bytesPerRow: 4 },
        { width: 1, height: 1 }
      );
    }
  }

  private createSampler(): void {
    this.sampler = this.device.createSampler({
      label: "Texture Sampler",
      magFilter: "linear",
      minFilter: "linear",
    });
  }

  private createUniformBuffer(): void {
    this.uniformBuffer = this.device.createBuffer({
      label: "Uniform Buffer",
      size: 16, // 4 floats
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private createBindGroup(): void {
    this.bindGroup = this.device.createBindGroup({
      label: "Texture Bind Group",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: this.baseTexture.createView(),
        },
        {
          binding: 2,
          resource: this.maskTexture.createView(),
        },
      ],
    });
  }

  private render(): void {
    const commandEncoder = this.device.createCommandEncoder({
      label: "Render Command Encoder",
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
      label: "Render Pass",
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.draw(4);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  async updateMask(maskImage: HTMLImageElement | null): Promise<void> {
    if (!this.device || !maskImage) return;

    // Destroy old mask texture
    if (this.maskTexture) {
      this.maskTexture.destroy();
    }

    // Create new mask texture
    this.maskTexture = this.device.createTexture({
      label: "Updated Mask Texture",
      size: { width: maskImage.width, height: maskImage.height },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // Copy mask image data
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = maskImage.width;
    maskCanvas.height = maskImage.height;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.drawImage(maskImage, 0, 0);
    const maskData = maskCtx.getImageData(
      0,
      0,
      maskImage.width,
      maskImage.height
    );

    this.device.queue.writeTexture(
      { texture: this.maskTexture },
      maskData.data,
      { bytesPerRow: maskImage.width * 4 },
      { width: maskImage.width, height: maskImage.height }
    );

    // Update bind group with new mask texture
    this.bindGroup = this.device.createBindGroup({
      label: "Updated Texture Bind Group",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: this.baseTexture.createView(),
        },
        {
          binding: 2,
          resource: this.maskTexture.createView(),
        },
      ],
    });

    // Re-render with updated mask
    this.render();
  }

  destroy(): void {
    if (this.baseTexture) {
      this.baseTexture.destroy();
    }
    if (this.maskTexture) {
      this.maskTexture.destroy();
    }
    if (this.uniformBuffer) {
      this.uniformBuffer.destroy();
    }
  }
}

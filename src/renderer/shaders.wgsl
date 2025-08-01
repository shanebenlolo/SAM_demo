// WebGPU Shader for Image Segmentation Rendering

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
  let maskValue = textureSample(maskTexture, baseSampler, input.texCoord).r;
  
  if (maskValue < 0.01) {
    return baseColor;
  }
  
  // Color palette for segments
  let colors = array<vec3<f32>, 12>(
    vec3<f32>(1.0, 0.2, 0.2),  // Red
    vec3<f32>(0.2, 1.0, 0.2),  // Green
    vec3<f32>(0.2, 0.4, 1.0),  // Blue
    vec3<f32>(1.0, 1.0, 0.2),  // Yellow
    vec3<f32>(1.0, 0.2, 1.0),  // Magenta
    vec3<f32>(0.2, 1.0, 1.0),  // Cyan
    vec3<f32>(1.0, 0.6, 0.2),  // Orange
    vec3<f32>(0.6, 0.2, 1.0),  // Purple
    vec3<f32>(0.2, 1.0, 0.6),  // Spring Green
    vec3<f32>(1.0, 0.8, 0.2),  // Gold
    vec3<f32>(0.8, 0.2, 0.6),  // Pink
    vec3<f32>(0.4, 0.8, 1.0)   // Light Blue
  );
  
  let segmentIndex = u32((maskValue * 255.0 / 255.0) * 12.0);
  let segmentColor = colors[segmentIndex % 12];
  
  return vec4<f32>(mix(baseColor.rgb, segmentColor, 0.4), 1.0);
}

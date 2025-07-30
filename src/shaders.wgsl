// Vertex shader
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Full-screen quad vertices
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), // bottom-left
        vec2<f32>( 1.0, -1.0), // bottom-right
        vec2<f32>(-1.0,  1.0), // top-left
        vec2<f32>( 1.0, -1.0), // bottom-right
        vec2<f32>( 1.0,  1.0), // top-right
        vec2<f32>(-1.0,  1.0)  // top-left
    );
    
    var uv = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 1.0), // bottom-left
        vec2<f32>(1.0, 1.0), // bottom-right
        vec2<f32>(0.0, 0.0), // top-left
        vec2<f32>(1.0, 1.0), // bottom-right
        vec2<f32>(1.0, 0.0), // top-right
        vec2<f32>(0.0, 0.0)  // top-left
    );

    var output: VertexOutput;
    output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    output.uv = uv[vertexIndex];
    return output;
}

// Fragment shader
@group(0) @binding(0) var baseSampler: sampler;
@group(0) @binding(1) var baseTexture: texture_2d<f32>;
@group(0) @binding(2) var maskTexture: texture_2d<f32>;

// Color palette for different segments
fn getSegmentColor(segmentValue: f32) -> vec3<f32> {
    // Convert grayscale value to segment index (0-11 for 12 segments)
    let segmentIndex = i32(segmentValue * 12.0);
    
    // Color palette - each segment gets a distinct color
    if (segmentIndex == 0) { return vec3<f32>(1.0, 0.2, 0.2); }      // Red
    else if (segmentIndex == 1) { return vec3<f32>(0.2, 1.0, 0.2); } // Green
    else if (segmentIndex == 2) { return vec3<f32>(0.2, 0.4, 1.0); } // Blue
    else if (segmentIndex == 3) { return vec3<f32>(1.0, 1.0, 0.2); } // Yellow
    else if (segmentIndex == 4) { return vec3<f32>(1.0, 0.2, 1.0); } // Magenta
    else if (segmentIndex == 5) { return vec3<f32>(0.2, 1.0, 1.0); } // Cyan
    else if (segmentIndex == 6) { return vec3<f32>(1.0, 0.6, 0.2); } // Orange
    else if (segmentIndex == 7) { return vec3<f32>(0.6, 0.2, 1.0); } // Purple
    else if (segmentIndex == 8) { return vec3<f32>(0.2, 1.0, 0.6); } // Spring Green
    else if (segmentIndex == 9) { return vec3<f32>(1.0, 0.8, 0.2); } // Gold
    else if (segmentIndex == 10) { return vec3<f32>(0.8, 0.2, 0.6); } // Pink
    else { return vec3<f32>(0.4, 0.8, 1.0); }                        // Light Blue
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    // Sample the base image
    let baseColor = textureSample(baseTexture, baseSampler, input.uv);
    
    // Sample the mask (use red channel for segment values)
    let maskValue = textureSample(maskTexture, baseSampler, input.uv).r;
    
    // Check if there's a segment at this pixel
    if (maskValue > 0.05) {
        // Get the color for this segment
        let segmentColor = getSegmentColor(maskValue);
        let maskAlpha = 0.6; // Semi-transparent overlay
        
        // Alpha blend the segment color over the base image
        let finalColor = mix(baseColor.rgb, segmentColor, maskAlpha);
        return vec4<f32>(finalColor, baseColor.a);
    } else {
        // No segment, return original image
        return baseColor;
    }
}

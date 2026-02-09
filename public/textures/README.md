# Planet Textures

This directory should contain high-resolution planet textures.

## Recommended Sources

1. **Solar System Scope**: https://www.solarsystemscope.com/textures/
   - Free for personal use (CC BY 4.0)
   - High-quality 2K and 8K textures

2. **NASA Visible Earth**: https://visibleearth.nasa.gov/
   - Public domain
   - Official NASA imagery

3. **Planet Pixel Emporium**: http://planetpixelemporium.com/planets.html
   - Free textures available

## Required Textures

### Main Textures (Required)
- `sun.jpg` - Sun surface texture
- `mercury.jpg` - Mercury surface
- `venus.jpg` - Venus surface (usually shows cloud layer)
- `earth.jpg` - Earth surface
- `mars.jpg` - Mars surface
- `jupiter.jpg` - Jupiter cloud bands
- `saturn.jpg` - Saturn cloud bands
- `uranus.jpg` - Uranus surface
- `neptune.jpg` - Neptune surface

### Optional Textures
- `earth_bump.jpg` - Earth elevation/height map
- `earth_specular.jpg` - Earth water reflection map
- `earth_clouds.jpg` - Earth cloud layer

### Moon Textures (Optional - place in `moons/` subfolder)
- `moon.jpg` - Earth's Moon
- `io.jpg` - Jupiter's Io
- `europa.jpg` - Jupiter's Europa
- `ganymede.jpg` - Jupiter's Ganymede
- `callisto.jpg` - Jupiter's Callisto
- `titan.jpg` - Saturn's Titan
- (etc.)

## Texture Specifications

- **Format**: JPEG or PNG
- **Projection**: Equirectangular (standard)
- **Resolution**: 2K (2048x1024) recommended, can go higher for planets you want more detail on
- **Color Space**: sRGB

## Quick Download Script

You can download free textures from Solar System Scope using these links:

```
Sun: https://www.solarsystemscope.com/textures/download/2k_sun.jpg
Mercury: https://www.solarsystemscope.com/textures/download/2k_mercury.jpg
Venus: https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg
Earth: https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg
Mars: https://www.solarsystemscope.com/textures/download/2k_mars.jpg
Jupiter: https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg
Saturn: https://www.solarsystemscope.com/textures/download/2k_saturn.jpg
Uranus: https://www.solarsystemscope.com/textures/download/2k_uranus.jpg
Neptune: https://www.solarsystemscope.com/textures/download/2k_neptune.jpg
Moon: https://www.solarsystemscope.com/textures/download/2k_moon.jpg
```

Rename downloaded files by removing the `2k_` prefix before use.

## Moon Textures (Optional)

For detailed moon textures, NASA's Photojournal is an excellent source:
- **NASA Photojournal**: https://photojournal.jpl.nasa.gov/

### Jupiter's Moons
- Io: https://www.solarsystemscope.com/textures/download/2k_makemake_fictional.jpg (use as base)
- Europa, Ganymede, Callisto: Search NASA Photojournal

### Saturn's Moons  
- Titan: Cassini imagery available at NASA Photojournal
- Enceladus, Mimas: NASA Cassini mission images

### Location
Place moon textures in `public/textures/` with these names:
- `io.jpg`, `europa.jpg`, `ganymede.jpg`, `callisto.jpg`
- `titan.jpg`, `enceladus.jpg`, `mimas.jpg`
- `triton.jpg`

If no texture is found, the simulation uses realistic fallback colors based on NASA imagery.

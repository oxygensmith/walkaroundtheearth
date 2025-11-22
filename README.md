# Walk Around the Earth

An idea prompted from when my kid was three, who frequently asked me how long it would take to get to the North Pole or other faraway locations from our city, as I would pull him around the city in his wagon.

Walk Around the Earth is intended to be an interactive web experience that lets you take a contemplative journey around planet Earth, experiencing the true scale of our world through slow, deliberate movement.

It's early days for this project, but the larger, loftier goal I have in mind is not just to measure time and space, but to make virtual circumnavigators fall in love with the Earth.

## Concept

Inspired by Josh Worth's [If the Moon Were Only 1 Pixel](https://joshworth.com/dev/pixelspace/pixelspace_solarsystem.html) and the film _Koyaanisqatsi_, this project aims to create a similar sense of awe and scale — focused on Earth itself, rather than the cosmos.

By forcing visitors to _feel_ distances rather than just read numbers, I hope users experience:

- How much of Earth is ocean
- How settlement clusters across continents
- The true vastness of biomes like the Pacific or Sahara
- The incredible diversity packed into even one 40,041 km circumference

## Current Status

Unless I've utterly broken it, the project is in its best form here:
[https://walkaroundtheearth.netlify.app](https://walkaroundtheearth.netlify.app)

**Known issues being debugged**

- [ ] Spacing of messages.
- [ ] Not all sim data gets wiped/restored when you click restart.
- [ ] Mobile 'version' is a trainwreck. Many interface improvements to come.
- [ ] Distance 'wraparound' for 'km from home' needs to exist. We're on a sphere!
- [ ] Continuous deployment on Netlify stopped working a short while ago. Investigating.

**Version 0.1** - Core scrolling mechanics implemented:

- ✅ Horizontal scroll interface with throttled velocity
- ✅ Distance tracking (10px = 1km scale)
- ✅ Visual markers every 100km and 1000km
- ✅ Antipodal point marking (20,020.72 km from origin)
- ✅ Smooth momentum-based movement
- ✅ Mouse drag and scroll wheel controls

## Planned Features

### Phase 1: Geographic Data

- ✅ Land/Ocean detection with Natural Earth Data
- [ ] Integration with OpenStreetMap APIs
- [ ] Display of places along the journey path
- [ ] Biome/terrain type identification
- [ ] Ocean names and depths when over water
- [ ] Country borders and nearest settlements

### Phase 2: Direction & Location

- [ ] Geolocation detection or manual lat/long entry
- [ ] Bearing/direction selector (0-360°)
- [ ] Great circle route calculation from starting point

### Phase 3: Rich Context

- [ ] Current weather conditions at waypoints
- [ ] Wikipedia links for significant locations
- [ ] Photography/imagery of places passed
- [ ] Population data for settlements
- [ ] "You are now X km from home" indicators

### Phase 4: Polish

- [ ] Sound design
- [ ] Day/night cycle based on actual sun position
- [ ] Mobile optimization
- [ ] Share your journey via URL
- ✅ Optional "auto-walk" mode

## Technical Stack

- **Vanilla JavaScript (ES6 modules)** - Clean, framework-free implementation
- **SCSS** - For maintainable styling
- **Parcel** - Zero-config bundler
- **OpenStreetMap APIs** - Geographic data (planned)
- **Natural Earth Data** - Biomes and terrain (planned)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## Design Philosophy

This project prioritizes **contemplative experience over speed**:

- Deliberately slow scrolling to make distances _felt_
- Minimal UI to keep focus on the journey
- Accurate geographic data over stylization
- Making the familiar strange through unfamiliar perspective

## Inspiration

- [If the Moon Were Only 1 Pixel](https://joshworth.com/dev/pixelspace/pixelspace_solarsystem.html) - Josh Worth's masterpiece on cosmic scale
- Childrens' books by [Oliver Jeffers](https://oliverjeffers.com/) and Randall Munroe's [XKCD](https://xkcd.com)
- [Neal.fun](https://neal.fun) - Playful, educational web experiences
- [_Koyaanisqatsi_](https://en.wikipedia.org/wiki/Koyaanisqatsi) (1982) - Godfrey Reggio's meditation on Earth and humanity

## License

ISC

## Contributing

This is an early-stage project. Ideas, feedback, and contributions welcome!

---

_"Not all those who wander are lost"_ — but in this case, you're definitely going in a straight line.

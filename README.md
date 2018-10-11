# react-image-crop-thing

> image crop component for react

[![NPM](https://img.shields.io/npm/v/react-image-crop-thing.svg)](https://www.npmjs.com/package/react-image-crop-thing) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-image-crop-thing
```

## Usage

```jsx
import React, { Component } from 'react'

import MyComponent from 'react-image-crop-thing'

class Example extends Component {
  constructor() {
    // note - you must hook state up to your UI. not shown here
    this.state = {
      src: '', // image from web, file input, etc
      zoom: 1, // minimum is 1. hook up to a slider or something
      cropAreaWidthRatio: 1920, // define shape of crop area 
      cropAreaHeightRatio: 1080,
      onCropChange: function(cropData) { 
      
      },
      showCircleMask: false, // bool
      maskOpacity: 0.3, // 0 to 1
      maskColor: 'white' // any css color, hex value, etc
    }
  }
  
  render () {
    return (
        <ReactImageCropThing
          src={this.state.src}
          zoom={this.state.zoom}
          cropAreaWidthRatio={this.state.cropAreaWidthRatio}
          cropAreaHeightRatio={this.state.cropAreaHeightRatio}
          onCropChange={(cropData) => this.onCropDataChange(cropData)}
          showCircleMask={this.state.showCircleMask}
          maskOpacity={this.state.maskOpacity}
          maskColor={this.state.maskColor} />
    )
  }
}
```

## License

MIT © [philwinkel](https://github.com/philwinkel)

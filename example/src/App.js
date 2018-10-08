import React, { Component } from 'react'
import styles from './App.css'
import ReactImageCropThing from 'react-image-crop-thing'

export default class App extends Component {
  constructor() {
    super()

    this.state = {
      src: 'http://placehold.it/1920x1080',
      zoom: 1,
      cropAreaWidthRatio: 200,
      cropAreaHeightRatio: 200,
      containerClassName: 'square',
      croppedImage: '',
      showCircleMask: true,
      maskOpacity: '0.3'
    }
  }

  maskOpacityChange(e) {
    this.setState({
      maskOpacity: e.target.value
    })
  }

  render () {
    return (
      <div>
        <ReactImageCropThing
          src={this.state.src}
          zoom={this.state.zoom}
          cropAreaWidthRatio={this.state.cropAreaWidthRatio}
          cropAreaHeightRatio={this.state.cropAreaHeightRatio}
          onCropChange={(cropData) => this.onCropDataChange(cropData)}
          showCircleMask={this.state.showCircleMask}
          maskOpacity={this.state.maskOpacity}
        />

        <div>
          <label htmlFor='zoom'>Zoom</label>
          <input type='range' id='zoom' min='1' max='10' step='0.01' value={this.state.zoom} onChange={(e) => this.setZoom(e)} />
        </div>
        <div>
          <span>Crop Size:</span>
          <button onClick={(e) => this.setCropSize(200, 250)}>Legacy Photo</button>
          <button onClick={(e) => this.setCropSize(200, 200)}>Square</button>
          <button onClick={(e) => this.setCropSize(314, 112)}>Logo</button>
        </div>
        <div>
          <span>Masking</span>
          <button onClick={(e) => this.toggleCircleMask()}>Toggle Circle Mask</button>
          <label>Mask Opacity</label>
          <input type='range' id='maskOpacity' min='0' max='1' step='0.01' value={this.state.maskOpacity} onChange={(e) => this.maskOpacityChange(e)} />
        </div>
        <div>
          <span>Load placeholder image:</span>
          <button onClick={(e) => this.loadImage(200, 250)}>Portrait</button>
          <button onClick={(e) => this.loadImage(200, 200)}>Square</button>
          <button onClick={(e) => this.loadImage(314, 112)}>Landscape</button>
        </div>
        <div>
          <label htmlFor='file'>Upload image:</label>
          <input type='file' id='file' onChange={(e) => this.onFileChange(e)} accept='image/*' />
        </div>
        <div style={{padding: '20px'}}>
          <h3>Cropped Image</h3>
          <img src={this.state.croppedImage} style={{maxWidth: '100%'}} />
        </div>
      </div>
    )
  }

  setZoom(e) {
    this.setState({zoom: e.target.value})
  }

  onFileChange(e) {
    let c = this

    if (FileReader && e.target.files && e.target.files.length) {
      let fr = new FileReader()
      fr.onload = function() {
        c.setState({
          src: fr.result
        })
      }
      fr.readAsDataURL(e.target.files[0])
    }
  }

  setCropSize(width, height) {
    this.setState({
      cropAreaWidthRatio: width,
      cropAreaHeightRatio: height
    })
  }

  loadImage(width, height) {
    this.setState({
      src: `http://placehold.it/${width}x${height}`
    })
  }

  onCropDataChange(cropData) {
    this.setState({
      croppedImage: cropData.src
    })
  }

  toggleCircleMask() {
    this.setState({
      showCircleMask: !this.state.showCircleMask
    })
  }
}

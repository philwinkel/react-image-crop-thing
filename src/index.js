import React, {Component} from 'react'
import PropTypes from 'prop-types'
import styles from './styles.css'
import { ResizeSensor } from 'css-element-queries'

export default class ReactImageCropThing extends Component {
  static propTypes = {
    src: PropTypes.string,
    zoom: PropTypes.string,
    cropAreaWidthRatio: PropTypes.number,
    cropAreaHeightRatio: PropTypes.number,
    onCropChange: PropTypes.func,
    showCircleMask: PropTypes.bool,
    maskOpacity: PropTypes.number,
    maskColor: PropTypes.string
  }

  constructor() {
    super()

    this.root = React.createRef()
    this.origImg = React.createRef()
    this.cropArea = React.createRef()
    this.canvas = React.createRef()

    this.state = {
      top: 0,
      left: 0,
      width: 0,
      height: 0,

      cropAreaClassName: '',
      cropAreaWidth: 0,
      cropAreaHeight: 0,

      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragPrevX: 0,
      dragPrevY: 0,

      src2: ''
    }
  }

  render() {
    let cropAreaBorderRadius = '0'
    if (this.props.showCircleMask) {
      cropAreaBorderRadius = '100%'
    }

    return (
      <div className={styles.reactImageCropThing}
        ref={this.root}
        onDragOver={(e) => this.onDragOver(e)}
        onMouseLeave={(e) => this.onMouseLeave(e)}
        onDrop={(e) => this.onDrop(e)}
        style={{
          background: this.props.maskColor
        }}>
        {/* original image (hidden) */}
        <img className={styles.displayNone}
          ref={this.origImg}
          src={this.props.src}
          onLoad={(e) => this.origImgOnLoad(e)}
          onLoadStart={(e) => this.origImgOnLoadStart(e)}
          onError={(e) => this.origImgOnError(e)}
          onProgress={(e) => this.origImgOnProgress(e)} />
        {/* canvas to render cropped image */ }
        <canvas className={styles.displayNone} ref={this.canvas} />
        {/* cropBox element */ }
        <div ref={this.cropArea} className={styles.cropArea} style={{
          width: this.state.cropAreaWidth,
          height: this.state.cropAreaHeight
        }}>
          <div className={styles.cropImageMasked} style={{
            width: this.state.cropAreaWidth,
            height: this.state.cropAreaHeight,
            borderRadius: cropAreaBorderRadius
          }}>
            <img src={this.state.src2}
              draggable='false'
              onMouseDown={(e) => this.onMouseDown(e)}
              onMouseMove={(e) => this.onMouseMove(e)}
              onMouseUp={(e) => this.onMouseUp(e)}
              onTouchStart={(e) => this.onTouchStart(e)}
              onTouchMove={(e) => this.onTouchMove(e)}
              onTouchEnd={(e) => this.onTouchEnd(e)}
              onTouchCancel={(e) => this.onTouchCancel(e)}
              className={styles.cropImg}
              style={{
                width: this.state.width,
                height: this.state.height,
                top: this.state.top,
                left: this.state.left
              }} />
          </div>
          <div className={styles.cropImageTransparent} style={{
            opacity: this.props.maskOpacity
          }}>
            <img src={this.state.src2}
              draggable='false'
              className={styles.cropImg}
              onMouseDown={(e) => this.onMouseDown(e)}
              onMouseMove={(e) => this.onMouseMove(e)}
              onMouseUp={(e) => this.onMouseUp(e)}
              onTouchStart={(e) => this.onTouchStart(e)}
              onTouchMove={(e) => this.onTouchMove(e)}
              onTouchEnd={(e) => this.onTouchEnd(e)}
              onTouchCancel={(e) => this.onTouchCancel(e)}
              style={{
                width: this.state.width,
                height: this.state.height,
                top: this.state.top,
                left: this.state.left
              }} />
          </div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize.bind(this))

    // resize sensor to detect resize of the component's root element, so it can scale the crop area fluidly
    new ResizeSensor(this.root.current, () => {
      this.scaleCropAreaToFit()
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize.bind(this))
  }

  componentDidUpdate(prevProps) {
    if (this.state.cropAreaWidth === 0 || this.state.cropAreaHeight === 0) {
      // do this once when it starts...
      this.scaleCropAreaToFit()
    }

    // when crop area dimensions change, reset the image
    if (this.props.cropAreaWidthRatio !== prevProps.cropAreaWidthRatio ||
      this.props.cropAreaHeightRatio !== prevProps.cropAreaHeightRatio) {
      this.scaleCropAreaToFit()
      this.scaleImageToFitCropArea()
      this.zoomChanged(1)
    }

    if (this.props.src !== prevProps.src) {
      console.log('src changed to ' + this.props.src)
      this.scaleImageToFitCropArea()
      this.zoomChanged(1)
    }

    if (this.props.zoom !== prevProps.zoom) {
      this.zoomChanged(prevProps.zoom)
    }
  }

  getElementWidthMinusPadding(element) {
    if (!getComputedStyle) {
      alert('getComputedStyle not supported')
    }
    var cs = getComputedStyle(element)
    let w = element.clientWidth
    w -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    return w
  }

  getElementHeightMinusPadding(element) {
    if (!getComputedStyle) {
      alert('getComputedStyle not supported')
    }
    var cs = getComputedStyle(element)
    let h = element.clientHeight
    h -= parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    return h
  }

  origImgOnError(e) {
    console.log('origImgOnError')
    alert('error loading image!')
  }

  origImgOnLoadStart(e) {
    console.log('origImgOnLoadStart')
  }

  origImgOnLoad(e) {
    this.setState({
      src2: this.origImg.current.src
    })
    this.scaleImageToFitCropArea()
  }

  scaleCropAreaToFit() {
    if (!this.root.current) {
      return
    }

    let widthAvailable = this.getElementWidthMinusPadding(this.root.current)
    let heightAvailable = this.getElementHeightMinusPadding(this.root.current)

    console.log(`root width ${this.root.current.clientWidth} , height ${this.root.current.clientHeight}`)
    console.log(`scaling cropArea to fit available width ${widthAvailable} , height ${heightAvailable}`)

    let cropAreaWidth = 0
    let cropAreaHeight = 0

    // square crop area
    if (this.props.cropAreaWidthRatio === this.props.cropAreaHeightRatio) {
      if (widthAvailable < heightAvailable) {
        cropAreaWidth = widthAvailable
        cropAreaHeight = widthAvailable
      } else {
        cropAreaWidth = heightAvailable
        cropAreaHeight = heightAvailable
      }
    }

    // landscape crop area
    if (this.props.cropAreaWidthRatio > this.props.cropAreaHeightRatio) {
      cropAreaWidth = widthAvailable
      cropAreaHeight = (this.props.cropAreaHeightRatio / this.props.cropAreaWidthRatio) * widthAvailable
    }

    // portrait crop area
    if (this.props.cropAreaHeightRatio > this.props.cropAreaWidthRatio) {
      cropAreaHeight = heightAvailable
      cropAreaWidth = (this.props.cropAreaWidthRatio / this.props.cropAreaHeightRatio) * heightAvailable
    }

    if (cropAreaWidth > widthAvailable) {
      let factor = widthAvailable / cropAreaWidth
      cropAreaWidth = widthAvailable
      cropAreaHeight *= factor
    }

    if (cropAreaHeight > heightAvailable) {
      let factor = heightAvailable / cropAreaHeight
      cropAreaHeight = heightAvailable
      cropAreaWidth *= factor
    }

    this.setState({
      cropAreaWidth: cropAreaWidth,
      cropAreaHeight: cropAreaHeight
    }, () => {
      this.scaleImageToFitCropArea()
    })
  }

  onResize(e) {
    this.scaleCropAreaToFit()
  }

  origImgOnProgress(e) {
    console.log('origImgOnProgress')
  }

  onMouseDown(e) {
    this.startMoveCropImage(e.clientX, e.clientY)
  }

  onMouseMove(e) {
    if (!this.state.dragging) {
      return
    }

    // this happens when the drag ends, clientX and clientY are 0... ignore that event, or the image jumps upon release
    if (e.clientX === 0 && e.clientY === 0) {
      return
    }

    let dX = e.clientX - this.state.dragPrevX
    let dY = e.clientY - this.state.dragPrevY

    this.moveCropImage(dX, dY)
  }

  startMoveCropImage(x, y) {
    this.setState({
      dragging: true,
      dragPrevX: x,
      dragPrevY: y
    })
  }

  moveCropImage(dX, dY) {
    console.log(`moveCropImage ${dX} ${dY}`)

    let left = this.state.left + dX
    if (left > 0) {
      left = 0
    }
    if (left < (this.state.cropAreaWidth - this.state.width)) {
      left = this.state.cropAreaWidth - this.state.width
    }

    let top = this.state.top + dY
    if (top > 0) {
      top = 0
    }
    if (top < (this.state.cropAreaHeight - this.state.height)) {
      top = this.state.cropAreaHeight - this.state.height
    }

    this.setState({
      left: left,
      top: top,
      dragPrevX: this.state.dragPrevX += dX,
      dragPrevY: this.state.dragPrevY += dY
    }, () => {
      this.updateCrop()
    })
  }

  onMouseUp(e) {
    this.setState({
      dragging: false
    })
  }

  onDragOver(e) {
    console.log('onDragOver')
    e.preventDefault()
  }

  onDrop(e) {
    console.log('onDrop')

    // default behavior of drop in some browsers is to navigate to data url upon drop... dont do that
    e.preventDefault()

    if (!FileReader) {
      console.log('FileReader not supported')
      return false
    }

    if (!e.dataTransfer || !e.dataTransfer.items) {
      console.log('html5 drop not supported?')
    }

    var file = e.dataTransfer.items[0].getAsFile()
    console.log('file.type ' + file.type)
    let c = this
    let fr = new FileReader()
    fr.onload = function() {
      // save in origImg - it's onload event will cause everything else to update.
      c.origImg.current.src = fr.result
    }
    fr.readAsDataURL(file)
  }

  onMouseLeave(e) {
    // this.setState({
    //   dragging: false
    // })
  }

  scaleImageToFitCropArea() {
    let imgWidth = this.origImg.current.width
    let imgHeight = this.origImg.current.height
    console.log(`origImgOnLoad width ${imgWidth} , height ${imgHeight}`)

    let width = 0
    let height = 0
    let top = 0
    let left = 0

    if (imgWidth === imgHeight) {
      // image is a square
      if (this.state.cropAreaWidth === this.state.cropAreaHeight) {
        // .. and crop area is square - fit image to crop area
        width = this.state.cropAreaWidth
        height = this.state.cropAreaHeight
      } else if (this.state.cropAreaWidth > this.state.cropAreaHeight) {
        // image is square, crop area is landscape - fit image to crop area width, center vertically
        width = this.state.cropAreaWidth
        height = imgHeight * (width / imgWidth)
        top = -(height - this.state.cropAreaHeight) / 2
      } else {
        // image is square, crop area is portrait - fit image to crop area height, center horizontally
        height = this.state.cropAreaHeight
        width = imgWidth * (height / imgHeight)
        left = -(width - this.state.cropAreaWidth) / 2
      }
    } else if (imgWidth > imgHeight) {
      // image is wider than tall
      if (this.state.cropAreaWidth === this.state.cropAreaHeight) {
        // .. and crop area is square - fit image height to crop area height. center horizontally
        height = this.state.cropAreaHeight
        width = imgWidth * (height / imgHeight)
        left = -(width - this.state.cropAreaWidth) / 2
      } else if (this.state.cropAreaWidth > this.state.cropAreaHeight) {
        // ... and crop area is landscape - fit image to crop area width, center horizontally and vertically
        width = this.state.cropAreaWidth
        height = imgHeight * (width / imgWidth)
        top = -(height - this.state.cropAreaHeight) / 2
        left = -(width - this.state.cropAreaWidth) / 2
      } else {
        // ... and crop area is portrait - fit image to crop area height, center horizontally
        height = this.state.cropAreaHeight
        width = imgWidth * (height / imgHeight)
        left = -(width - this.state.cropAreaWidth) / 2
      }
    } else {
      // image is taller than wide
      if (this.state.cropAreaWidth === this.state.cropAreaHeight) {
        // ... and crop area is square - fit image to width, center vertically
        width = this.state.cropAreaWidth
        height = imgHeight * (width / imgWidth)
        top = -(height - this.state.cropAreaHeight) / 2
      } else if (this.state.cropAreaWidth > this.state.cropAreaHeight) {
        // ... and crop area is landscape -
        width = this.state.cropAreaWidth
        height = imgHeight * (width / imgWidth)
        top = -(height - this.state.cropAreaHeight) / 2
      } else {
        height = this.state.cropAreaHeight
        width = imgWidth * (height / imgHeight)
        top = -(height - this.state.cropAreaHeight) / 2
        left = -(width - this.state.cropAreaWidth) / 2
      }
    }

    // check if image fills entire crop area
    if (width < this.state.cropAreaWidth) {
      // scale image up to fit width of crop area
      let factor = this.state.cropAreaWidth / width
      let oldWidth = width
      width *= factor
      height = height / oldWidth * width
      if (left > 0) {
        left = 0
      }
    }

    // check if image fills entire crop area height
    if (height < this.state.cropAreaHeight) {
      let factor = this.state.cropAreaHeight / height
      let oldHeight = height
      height *= factor
      width = width / oldHeight * height
      if (top > 0) {
        top = 0
      }
    }

    // apply zoom
    width *= this.props.zoom
    height *= this.props.zoom
    top *= this.props.zoom
    left *= this.props.zoom

    this.setState({
      width: width,
      height: height,
      top: top,
      left: left
    }, () => {
      this.updateCrop()
    })
  }

  zoomChanged(prevZoom) {
    console.log('zoomChanged from prevZoom to ' + this.props.zoom)

    let newWidth = this.state.width * (this.props.zoom / prevZoom)
    let newHeight = this.state.height * (this.props.zoom / prevZoom)
    // let newTop = this.state.top * (this.props.zoom / prevZoom)
    // let newLeft = this.state.left * (this.props.zoom / prevZoom)
    let newTop = this.state.top + ((this.state.height - newHeight) / 2)
    let newLeft = this.state.left + ((this.state.width - newWidth) / 2)

    // make sure image still fills the crop area. if not, adjust top/left so it does.
    let w = newWidth + newLeft
    if (w < this.state.cropAreaWidth) {
      newLeft += this.state.cropAreaWidth - w
    }
    let h = newHeight + newTop
    if (h < this.state.cropAreaHeight) {
      newTop += this.state.cropAreaHeight - h
    }
    if (newLeft > 0) {
      newLeft = 0
    }
    if (newTop > 0) {
      newTop = 0
    }

    this.setState({
      width: newWidth,
      height: newHeight,
      top: newTop,
      left: newLeft
    }, () => {
      this.updateCrop()
    })
  }

  updateCrop() {
    // determine factor needed to scale image back to original size
    let scaleFactor = this.origImg.current.width / this.state.width

    console.log('scaleFactor ' + scaleFactor)

    // multiply crop area by scale factor to find cropArea within original image
    let cropWidth = this.state.cropAreaWidth * scaleFactor
    let cropHeight = this.state.cropAreaHeight * scaleFactor
    let cropOffsetX = Math.abs(this.state.left) * scaleFactor
    let cropOffsetY = Math.abs(this.state.top) * scaleFactor

    console.log(`cropWidth ${cropWidth} , cropHeight ${cropHeight}`)
    console.log(`cropOffsetX ${cropOffsetX} , cropOffsetY ${cropOffsetY}`)

    // size canvas to crop area for original image
    this.canvas.current.width = cropWidth
    this.canvas.current.height = cropHeight

    let cropData = {
      cropOffsetX: cropOffsetX,
      cropOffsetY: cropOffsetY,
      cropWidth: cropWidth,
      cropHeight: cropHeight,
      cropImageBase64: () => {
        let ctx = this.canvas.current.getContext('2d')

        ctx.drawImage(this.origImg.current, cropOffsetX, cropOffsetY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

        let cropImg = ''
        try {
          cropImg = this.canvas.current.toDataURL('image/jpeg')
        } catch (err) {
          console.log(err)
        }

        return cropImg
      }
    }
    this.onCropChange(cropData)
  }

  onCropChange(cropData) {
    if (!this.props.onCropChange) {
      return
    }

    this.props.onCropChange(cropData)
  }

  onTouchStart(e) {
    e.preventDefault()

    console.log('onTouchStart')

    let touches = e.changedTouches
    for (let i = 0; i < touches.length; i++) {
      console.log(`onTouchStart touch ${i} ${touches[i].pageX} ${touches[i].pageY}`)
    }

    this.startMoveCropImage(touches[0].pageX, touches[0].pageY)
  }

  onTouchMove(e) {
    e.preventDefault()

    console.log('onTouchMove')

    let touches = e.changedTouches
    for (let i = 0; i < touches.length; i++) {
      console.log(`onTouchMove touch ${i} ${touches[i].pageX} ${touches[i].pageY}`)
    }

    let dX = touches[0].pageX - this.state.dragPrevX
    let dY = touches[0].pageY - this.state.dragPrevY

    this.moveCropImage(dX, dY)
  }

  onTouchEnd(e) {
    e.preventDefault()

    console.log('onTouchEnd')

    let touches = e.changedTouches

    let dX = touches[0].pageX - this.state.dragPrevX
    let dY = touches[0].pageY - this.state.dragPrevY

    this.moveCropImage(dX, dY)

    this.setState({dragging: false})
  }

  onTouchCancel(e) {
    console.log('onTouchCancel')

    this.setState({dragging: false})
  }
}

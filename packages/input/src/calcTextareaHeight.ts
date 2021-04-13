let hiddenTextarea
// 隐藏的样式
const HIDDEN_STYLE = `
  height:0 !important;
  visibility:hidden !important;
  overflow:hidden !important;
  position:absolute !important;
  z-index:-1000 !important;
  top:0 !important;
  right:0 !important;
`
//内容样式
const CONTEXT_STYLE = [
  'letter-spacing',
  'line-height',
  'padding-top',
  'padding-bottom',
  'font-family',
  'font-weight',
  'font-size',
  'text-rendering',
  'text-transform',
  'width',
  'text-indent',
  'padding-left',
  'padding-right',
  'border-width',
  'box-sizing',
]

type NodeStyle = {
  contextStyle: string
  boxSizing: string
  paddingSize: number
  borderSize: number
}

type TextAreaHeight = {
  height: string
  minHeight?: string
}

function calculateNodeStyling(targetElement): NodeStyle {
  const style = window.getComputedStyle(targetElement)

  const boxSizing = style.getPropertyValue('box-sizing')

  const paddingSize = (
    parseFloat(style.getPropertyValue('padding-bottom')) +
    parseFloat(style.getPropertyValue('padding-top'))
  )

  const borderSize = (
    parseFloat(style.getPropertyValue('border-bottom-width')) +
    parseFloat(style.getPropertyValue('border-top-width'))
  )

  const contextStyle = CONTEXT_STYLE
    .map(name => `${name}:${style.getPropertyValue(name)}`)
    .join(';')

  return { contextStyle, paddingSize, borderSize, boxSizing }
  // {
  //   "contextStyle": "letter-spacing:normal;line-height:21px;padding-top:5px;padding-bottom:5px;font-family:monospace;font-weight:400;font-size:14px;text-rendering:auto;text-transform:none;width:1227px;text-indent:0px;padding-left:15px;padding-right:15px;border-width:1px;box-sizing:border-box",
  //   "paddingSize": 10,
  //   "borderSize": 2,
  //   "boxSizing": "border-box"
  // }
}

export default function calcTextareaHeight(
  targetElement,
  minRows = 1,
  maxRows = null,
): TextAreaHeight {
  //hiddenTextarea不存在则创建 隐藏的textarea append到body中
  if (!hiddenTextarea) {
    hiddenTextarea = document.createElement('textarea')
    document.body.appendChild(hiddenTextarea)
  }

  const {
    paddingSize,
    borderSize,
    boxSizing,
    contextStyle,
  } = calculateNodeStyling(targetElement)

  //给创建的hiddenTextarea添加行内样式和隐藏样式，并赋值value或palceholder,无则''
  hiddenTextarea.setAttribute('style', `${contextStyle};${HIDDEN_STYLE}`)
  hiddenTextarea.value = targetElement.value || targetElement.placeholder || ''

  let height = hiddenTextarea.scrollHeight//hiddenTextarea 内容高度(含padding，不含border和margin)
  const result = {} as TextAreaHeight
  //真实高度计算
  // border-box 的 height = content+padding+border
  // content-box 的 height = content
  if (boxSizing === 'border-box') {
    height = height + borderSize
  } else if (boxSizing === 'content-box') {
    height = height - paddingSize
  }

  //清空内容 用于获取单行高度
  hiddenTextarea.value = ''
  //单行高度
  const singleRowHeight = hiddenTextarea.scrollHeight - paddingSize

  // 最小行存在 默认minRows = 1
  if (minRows !== null) {
    let minHeight = singleRowHeight * minRows
    if (boxSizing === 'border-box') {
      minHeight = minHeight + paddingSize + borderSize
    }
    height = Math.max(minHeight, height)
    result.minHeight = `${ minHeight }px`
  }
  //最大行存在 计算最大高度
  if (maxRows !== null) {
    let maxHeight = singleRowHeight * maxRows
    if (boxSizing === 'border-box') {
      maxHeight = maxHeight + paddingSize + borderSize
    }
    height = Math.min(maxHeight, height)
  }
  result.height = `${ height }px`
  // 移除hiddenTextarea
  hiddenTextarea.parentNode?.removeChild(hiddenTextarea)
  hiddenTextarea = null

  return result
  //{minHeight: "33px", height: "33px"}
}

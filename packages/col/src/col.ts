import { defineComponent, computed, inject, h } from 'vue'
import type { PropType } from 'vue'

type SizeObject = {
  span: number
  offset: number
}
const ElCol = defineComponent({
  name: 'ElCol',
  props: {
    tag: {
      type: String,
      default: 'div',
    },
    span: {
      type: Number,
      default: 24,
    },
    offset: {
      type: Number,
      default: 0,
    },
    pull: {
      type: Number,
      default: 0,
    },
    push: {
      type: Number,
      default: 0,
    },
    xs: {
      type: [Number, Object] as PropType<number | SizeObject>,
      default: () => ({} as SizeObject),
    },
    sm: {
      type: [Number, Object] as PropType<number | SizeObject>,
      default: () => ({} as SizeObject),
    },
    md: {
      type: [Number, Object] as PropType<number | SizeObject>,
      default: () => ({} as SizeObject),
    },
    lg: {
      type: [Number, Object] as PropType<number | SizeObject>,
      default: () => ({} as SizeObject),
    },
    xl: {
      type: [Number, Object] as PropType<number | SizeObject>,
      default: () => ({} as SizeObject),
    },
  },
  setup(props, { slots }) {
    const { gutter } = inject('ElRow', { gutter: { value: 0 } })//参数为 key，defaultValue

    //通过gutter 计算col左右的padding
    const style = computed(() => {
      if (gutter.value) {
        return {
          paddingLeft: gutter.value / 2 + 'px',
          paddingRight: gutter.value / 2 + 'px',
        }
      }
      return {}
    })
    const classList = computed(() => {
      const ret: string[] = []
      //处理布局相关
      const pos = ['span', 'offset', 'pull', 'push'] as const
      pos.forEach(prop => {
        const size = props[prop]
        if (typeof size === 'number') {
          if(prop === 'span') ret.push(`el-col-${props[prop]}`)
          else if(size > 0) ret.push(`el-col-${prop}-${props[prop]}`)
        }
      })
      //处理屏幕响应相关
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
      sizes.forEach(size => {
        if (typeof props[size] === 'number') {
          ret.push(`el-col-${size}-${props[size]}`)
        } else if (typeof props[size] === 'object') {
          const sizeProps = props[size]
          Object.keys(sizeProps).forEach(prop => {
            ret.push(
              prop !== 'span' ? `el-col-${size}-${prop}-${sizeProps[prop]}` : `el-col-${size}-${sizeProps[prop]}`,
            )
          })
        }
      })
      // span=0 或者响应式 'xs', 'sm', 'md', 'lg', 'xl' = 0 时 占位换行问题,此处代码好像并没有什么用。
      // 样式中 el-col-xs-0等 能解决这个问题。
      // this is for the fix
      if (gutter.value) {
        ret.push('is-guttered')
      }

      return ret
    })

    return () => h(
      props.tag,
      {
        class: ['el-col', classList.value],
        style: style.value,
      },
      slots.default?.(),
    )
  },
})

export default ElCol

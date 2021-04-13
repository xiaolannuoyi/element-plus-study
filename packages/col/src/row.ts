import { defineComponent, computed, h, provide } from 'vue'

export default defineComponent({
  name: 'ElRow',
  props: {
    tag: {
      type: String,
      default: 'div',
    },
    gutter: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: '',
    },
    justify: {
      type: String,
      default: 'start',
    },
    align: {
      type: String,
      default: 'top',
    },
  },
  setup(props, { slots }) {
    //可在 col 中拿到 gutter
    const gutter = computed(() => props.gutter)
    provide('ElRow', {
      gutter,
    })
    //row的左右margin，用于抵消col的padding，这里通过gutter计算出实际margin
    const style = computed(() => {
      const ret = {
        marginLeft: '',
        marginRight: '',
      }
      if (props.gutter) {
        ret.marginLeft = `-${props.gutter / 2}px`
        ret.marginRight = ret.marginLeft
      }
      return ret
    })

    return () =>
      h(
        props.tag,
        {
          class: [
            'el-row',
            props.justify !== 'start' ? `is-justify-${props.justify}` : '',
            props.align !== 'top' ? `is-align-${props.align}` : '',
            props.type === 'flex' ? 'el-row--flex' : '',
          ],
          style: style.value,
        },
        slots.default?.(),
      )
  },
})

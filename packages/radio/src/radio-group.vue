<template>
  <div
    ref="radioGroup"
    class="el-radio-group"
    role="radiogroup"
    @keydown="handleKeydown"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  computed,
  provide,
  onMounted,
  inject,
  ref,
  reactive,
  toRefs,
  watch,
} from 'vue'
import { EVENT_CODE } from '@element-plus/utils/aria'
import { UPDATE_MODEL_EVENT } from '@element-plus/utils/constants'
import { isValidComponentSize } from '@element-plus/utils/validators'
import { elFormItemKey } from '@element-plus/form'
import radioGroupKey from './token'

import type { PropType } from 'vue'
import type { ElFormItemContext } from '@element-plus/form'

export default defineComponent({
  name: 'ElRadioGroup',

  componentName: 'ElRadioGroup',

  props: {
    modelValue: {
      type: [String, Number, Boolean],
      default: '',
    },
    size: {
      type: String as PropType<ComponentSize>,
      validator: isValidComponentSize,
    },
    fill: {
      type: String,
      default: '',
    },
    textColor: {
      type: String,
      default: '',
    },
    disabled: Boolean,
  },

  emits: [UPDATE_MODEL_EVENT, 'change'],

  setup(props, ctx) {
    const radioGroup = ref(null)

    const elFormItem = inject(elFormItemKey, {} as ElFormItemContext)

    const radioGroupSize = computed<ComponentSize>(() => {
      return props.size || elFormItem.size
    })

    // methods
    const changeEvent = value => {
      // 此处nextTick作用，保证执行顺序。 先 ctx.emit(UPDATE_MODEL_EVENT, value)，后 ctx.emit('change', value)，保证`v-model`变化会优先于`change`执行。
      // 如果没有 nextTick，执行顺序相反，
      // 因为ctx.emit(UPDATE_MODEL_EVENT, value)，更新值的变化，会导致页面更新，所以会在`下次页面更新时执行`。而chang事件会在`当前执行`。
      ctx.emit(UPDATE_MODEL_EVENT, value)//update:modelValue
      nextTick(() => {
        ctx.emit('change', value)
      })
    }

    provide(radioGroupKey, reactive({
      name: 'ElRadioGroup',
      ...toRefs(props),
      radioGroupSize: radioGroupSize,
      changeEvent: changeEvent,
    }))

    watch(() => props.modelValue, val => {
      elFormItem.formItemMitt?.emit('el.form.change', [val])
    })

    const handleKeydown = e => { // 左右上下按键 可以在radio组内切换不同选项
      const target = e.target
      const className = target.nodeName === 'INPUT' ? '[type=radio]' : '[role=radio]'//radio||label
      const radios = radioGroup.value.querySelectorAll(className)
      const length = radios.length
      const index = Array.from(radios).indexOf(target)
      const roleRadios = radioGroup.value.querySelectorAll('[role=radio]')
      let nextIndex = null
      switch (e.code) {
        case EVENT_CODE.left:
        case EVENT_CODE.up:
          //⬅️⬆️ 选中前一个
          e.stopPropagation()//阻止冒泡
          e.preventDefault()//阻止默认行为
          nextIndex = index === 0 ? length - 1 : index - 1//如果当前选中的是第一个，则下一个选中的是最后一个，否则是前一个
          break
        case EVENT_CODE.right:
        case EVENT_CODE.down:
          //➡️⬇️ 选中后一个
          e.stopPropagation()
          e.preventDefault()
          nextIndex = (index === (length - 1)) ? 0 : index + 1//如果当前选中的是最后一个，则下一个选中的是第一个，否则是后一个
          break
        default:
          break
      }
      if (nextIndex === null) return
      roleRadios[nextIndex].click()
      roleRadios[nextIndex].focus()
    }

    onMounted(() => {
      const radios = radioGroup.value.querySelectorAll('[type=radio]')
      const firstLabel = radios[0]
      //radios 中没有选中的 且 firstLabel 存在，初始化 firstLabel的tabIndex
      //input标签中 tabIndex = 0
      if (!Array.from(radios).some((radio: HTMLInputElement) => radio.checked) && firstLabel) {
        firstLabel.tabIndex = 0
      }
    })
    return {
      handleKeydown,
      radioGroupSize,
      radioGroup,
    }
  },
})
</script>


<template>
  <label
    class="el-radio"
    :class="{
      [`el-radio--${radioSize || ''}`]: border && radioSize,
      'is-disabled': isDisabled,
      'is-focus': focus,
      'is-bordered': border,
      'is-checked': model === label
    }"
    role="radio"
    :aria-checked="model === label"
    :aria-disabled="isDisabled"
    :tabindex="tabIndex"
    @keydown.space.stop.prevent="model = isDisabled ? model : label"
  >
    <!-- :tabindex="tabIndex"
    @keydown.space.stop.prevent="model = isDisabled ? model : label"
    这个功能是为了用tab切换不同选项时，按空格可以快速选择目标项 -->

    <!-- 模拟圆形按钮 -->
    <span
      class="el-radio__input"
      :class="{
        'is-disabled': isDisabled,
        'is-checked': model === label
      }"
    >
      <!-- 圆形样式 -->
      <span class="el-radio__inner"></span>
      <!-- 真正的按钮 -->
      <!-- el-radio__original ⚠️注意这个样式 -->
      <input
        ref="radioRef"
        v-model="model"
        class="el-radio__original"
        :value="label"
        type="radio"
        aria-hidden="true"
        :name="name"
        :disabled="isDisabled"
        tabindex="-1"
        @focus="focus = true"
        @blur="focus = false"
        @change="handleChange"
      >
    </span>
    <!-- 文字部分 -->
    <!-- keydown.stop 阻止事件继续冒泡 -->
    <span class="el-radio__label" @keydown.stop>
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script lang='ts'>
import {
  defineComponent,
  computed, nextTick, ref,
} from 'vue'
import { UPDATE_MODEL_EVENT } from '@element-plus/utils/constants'
import { isValidComponentSize } from '@element-plus/utils/validators'
import { useRadio, useRadioAttrs } from './useRadio'

import type { PropType } from 'vue'

export default defineComponent({
  name: 'ElRadio',
  componentName: 'ElRadio',

  props: {
    modelValue: {
      type: [String, Number, Boolean],
      default: '',
    },
    label: {
      type: [String, Number, Boolean],
      default: '',
    },
    disabled: Boolean,
    name: {
      type: String,
      default: '',
    },
    border: Boolean,
    size: {
      type: String as PropType<ComponentSize>,
      validator: isValidComponentSize,
    },
  },

  emits: [UPDATE_MODEL_EVENT, 'change'],

  setup(props, ctx) {
    const {
      isGroup,
      radioGroup,
      elFormItemSize,
      ELEMENT,
      focus,
      elForm,
    } = useRadio()

    const radioRef = ref<HTMLInputElement>()
    const model = computed<string | number | boolean>({
      get() {
        return isGroup.value ? radioGroup.modelValue : props.modelValue
      },
      set(val) {
        if (isGroup.value) {
          radioGroup.changeEvent(val)//修改radioGroup的v-model值
        } else {
          ctx.emit(UPDATE_MODEL_EVENT, val)//update:modelValue 修改radio的v-model值
        }
        radioRef.value.checked = props.modelValue === props.label //dom 对象上的 checked 属性
      },
    })

    const {
      tabIndex,
      isDisabled,
    } = useRadioAttrs(props, {
      isGroup,
      radioGroup: radioGroup,
      elForm,
      model,
    })

    const radioSize = computed(() => {
      const temRadioSize = props.size || elFormItemSize.value || ELEMENT.size
      return isGroup.value
        ? radioGroup.radioGroupSize || temRadioSize
        : temRadioSize
    })

    function handleChange() {
      // 不使用nextTick时，
      // radio 触发顺序是 set->emit->父组件v-model值变化->get->此事件->父组件change
      // ❓所以这个位置为什么使用nextTick，使用了nextTick 解决了什么问题？
      // 暂时感觉并没有什么用处。
      nextTick(() => {
        ctx.emit('change', model.value)
      })
    }

    return {
      focus,
      isGroup,
      isDisabled,
      model,
      tabIndex,
      radioSize,
      handleChange,
      radioRef,
    }
  },
})
</script>



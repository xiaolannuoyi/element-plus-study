<template>
  <label
    :id="id"
    class="el-checkbox"
    :class="[
      border && checkboxSize ? 'el-checkbox--' + checkboxSize : '',
      { 'is-disabled': isDisabled },
      { 'is-bordered': border },
      { 'is-checked': isChecked }
    ]"
    :aria-controls="indeterminate ? controls : null"
  >
    <!-- 复选框 -->
    <span
      class="el-checkbox__input"
      :class="{
        'is-disabled': isDisabled,
        'is-checked': isChecked,
        'is-indeterminate': indeterminate,
        'is-focus': focus
      }"
      :tabindex="indeterminate ? 0 : false"
      :role="indeterminate ? 'checkbox' : false"
      :aria-checked="indeterminate ? 'mixed' : false"
    >
      <!-- aria-checked true 选中，false 未选中，mixed 不确定 -->
      <!-- 复选框样式 -->
      <span class="el-checkbox__inner"></span>
      <!-- 有trueLabel或falseLabel时展示 -->
      <input
        v-if="trueLabel || falseLabel"
        v-model="model"
        :checked="isChecked"
        class="el-checkbox__original"
        type="checkbox"
        :aria-hidden="indeterminate ? 'true' : 'false'"
        :name="name"
        :disabled="isDisabled"
        :true-value="trueLabel"
        :false-value="falseLabel"
        @change="handleChange"
        @focus="focus = true"
        @blur="focus = false"
      >
      <!-- 无trueLabel或falseLabel时展示 -->
      <input
        v-else
        v-model="model"
        class="el-checkbox__original"
        type="checkbox"
        :aria-hidden="indeterminate ? 'true' : 'false'"
        :disabled="isDisabled"
        :value="label"
        :name="name"
        @change="handleChange"
        @focus="focus = true"
        @blur="focus = false"
      >
    </span>
    <!-- slot -->
    <!-- 感觉radio中的写法更好些吧 -->

    <!-- <span class="el-checkbox__label">
      <slot>
        {{ label }}
      </slot>
    </span> -->

    <span v-if="$slots.default || label" class="el-checkbox__label">
      <slot></slot>
      <template v-if="!$slots.default">{{ label }}</template>
    </span>
  </label>
</template>
<script lang='ts'>
import {
  defineComponent,
  PropType,
} from 'vue'
import { UPDATE_MODEL_EVENT } from '@element-plus/utils/constants'
import { isValidComponentSize } from '@element-plus/utils/validators'
import { useCheckbox } from './useCheckbox'

export default defineComponent({
  name: 'ElCheckbox',
  props: {
    modelValue: {
      type: [Boolean, Number, String],
      default: () => undefined,
    },
    label: {
      type: [String, Boolean, Number],
    },
    indeterminate: Boolean,
    disabled: Boolean,
    checked: Boolean,
    name: {
      type: String,
      default: undefined,
    },
    trueLabel: {
      type: [String, Number],
      default: undefined,
    },
    falseLabel: {
      type: [String, Number],
      default: undefined,
    },
    id: {
      type: String,
      default: undefined,
    },
    controls: {
      type: String,
      default: undefined,
    },
    border: Boolean,
    size: {
      type: String as PropType<ComponentSize>,
      validator: isValidComponentSize,
    },
  },
  emits: [UPDATE_MODEL_EVENT, 'change'],
  setup(props) {
    return useCheckbox(props)
  },
})
</script>

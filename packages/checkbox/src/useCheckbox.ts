import {
  ref,
  computed,
  inject,
  getCurrentInstance,
  watch,
} from 'vue'
import { toTypeString } from '@vue/shared'
import { UPDATE_MODEL_EVENT } from '@element-plus/utils/constants'
import { useGlobalConfig } from '@element-plus/utils/util'
import { PartialReturnType } from '@element-plus/utils/types'
import { elFormKey, elFormItemKey } from '@element-plus/form'
import { ICheckboxGroupInstance, ICheckboxProps } from './checkbox.type'

import type { ElFormContext, ElFormItemContext } from '@element-plus/form'

export const useCheckboxGroup = () => {
  const ELEMENT = useGlobalConfig()
  const elForm = inject(elFormKey, {} as ElFormContext)
  const elFormItem = inject(elFormItemKey, {} as ElFormItemContext)
  const checkboxGroup = inject<ICheckboxGroupInstance>('CheckboxGroup', {})
  const isGroup = computed(() => checkboxGroup && checkboxGroup?.name === 'ElCheckboxGroup')
  const elFormItemSize = computed(() => {
    return elFormItem.size
  })
  return {
    isGroup,
    checkboxGroup,
    elForm,
    ELEMENT,
    elFormItemSize,
    elFormItem,
  }
}

const useModel = (props: ICheckboxProps) => {
  const selfModel = ref(false)
  const { emit } = getCurrentInstance()
  const { isGroup, checkboxGroup } = useCheckboxGroup()
  const isLimitExceeded = ref(false)//是否突破限制
  //checkbox-group组件实例的value或当前value
  const store = computed(() => checkboxGroup ? checkboxGroup.modelValue?.value : props.modelValue)
  const model = computed({
    get() {
      return isGroup.value
        ? store.value
        : props.modelValue ?? selfModel.value
        // 「双问号」?? 如果给定变量值为 null 或者 undefined，则使用双问号后的默认值，否则使用该变量值。
    },

    set(val: unknown) {
      if (isGroup.value && Array.isArray(val)) { // checkbox-group
        //是否突破限制 判断
        isLimitExceeded.value = false
        // min定义了 且 当前选中长度 < min
        if (checkboxGroup.min !== undefined && val.length < checkboxGroup.min.value) {
          isLimitExceeded.value = true
        }
        // max定义了 且 当前选中长度 > max
        if (checkboxGroup.max !== undefined && val.length > checkboxGroup.max.value) {
          isLimitExceeded.value = true
        }
        //未突破限制 修改checkboxGroup的value值
        // ?.链式调用。
        isLimitExceeded.value === false && checkboxGroup?.changeEvent?.(val)
      } else {
<<<<<<< HEAD
        emit(UPDATE_MODEL_EVENT, val)//update:modelValue 修改checkbox的value值
        selfModel = val as boolean
=======
        emit(UPDATE_MODEL_EVENT, val)
        selfModel.value = val as boolean
>>>>>>> dev
      }
    },
  })

  return {
    model,
    isLimitExceeded,
  }
}

const useCheckboxStatus = (props: ICheckboxProps, { model }: PartialReturnType<typeof useModel>) => {
  const { isGroup, checkboxGroup, elFormItemSize, ELEMENT } = useCheckboxGroup()
  const focus = ref(false)
  const size = computed<string | undefined>(() => checkboxGroup?.checkboxGroupSize?.value || elFormItemSize.value || ELEMENT.size)
  //是否被选中
  const isChecked = computed(() => {
    const value = model.value
    //toTypeString 源于vue
    //const objectToString = Object.prototype.toString;
    //const toTypeString = (value) => objectToString.call(value);
    //1.boolean 2.array 3.trueLabel 三种情况的判断
    if (toTypeString(value) === '[object Boolean]') {
      return value
    } else if (Array.isArray(value)) {
      return value.includes(props.label)
    } else if (value !== null && value !== undefined) {
      return value === props.trueLabel
    }
  })
  const checkboxSize = computed(() => {
    const temCheckboxSize = props.size || elFormItemSize.value || ELEMENT.size
    return isGroup.value
      ? checkboxGroup?.checkboxGroupSize?.value || temCheckboxSize
      : temCheckboxSize
  })

  return {
    isChecked,
    focus,
    size,
    checkboxSize,
  }
}

const useDisabled = (
  props: ICheckboxProps,
  { model, isChecked }: PartialReturnType<typeof useModel> & PartialReturnType<typeof useCheckboxStatus>,
) => {
  const { elForm, isGroup, checkboxGroup } = useCheckboxGroup()
  //是否是数量限制的禁用
  const isLimitDisabled = computed(() => {
    const max = checkboxGroup.max?.value
    const min = checkboxGroup.min?.value
    //在设置max或者min的情况下，
    // 选中的值>=max,当前复选框的状态如果是选中（true），那么不禁用（false）,反之，同理 未选中->禁用
    // 选中的值<=min,当前复选框的状态如果是未选中（false），那么不禁用（false）,反之，同理 选中->禁用
    return !!(max || min) && (model.value.length >= max && !isChecked.value) ||
      (model.value.length <= min && isChecked.value)
  })
  const isDisabled = computed(() => {
    const disabled = props.disabled || elForm.disabled
    return isGroup.value
      ? checkboxGroup.disabled?.value || disabled || isLimitDisabled.value
      : props.disabled || elForm.disabled
  })

  return {
    isDisabled,
    isLimitDisabled,
  }
}

const setStoreValue = (props: ICheckboxProps, { model }: PartialReturnType<typeof useModel>) => {
  function addToStore() {
    //如果是array,且当前model中未选中当前值时，将其选中
    if (
      Array.isArray(model.value) &&
      !model.value.includes(props.label)
    ) {
      model.value.push(props.label)
    } else {
      model.value = props.trueLabel || true
    }
  }
  //但props.checked 为true时，修改model的值 使props.checked与model值 一致
  props.checked && addToStore()
}

const useEvent = (props: ICheckboxProps, { isLimitExceeded }: PartialReturnType<typeof useModel>) => {
  const { elFormItem } = useCheckboxGroup()
  const { emit } = getCurrentInstance()
  function handleChange(e: InputEvent) {
    if (isLimitExceeded.value) return  //如果突破限制 就不能修改值
    const target = e.target as HTMLInputElement
    const value = target.checked
      ? props.trueLabel ?? true
      : props.falseLabel ?? false

    emit('change', value, e)
  }
  // 监听value变化，与表单验证有关
  watch(() => props.modelValue, val => {
    elFormItem.formItemMitt?.emit('el.form.change', [val])
  })

  return {
    handleChange,
  }
}

export const useCheckbox = (props: ICheckboxProps) => {
  const { model, isLimitExceeded } = useModel(props)
  const { focus, size, isChecked, checkboxSize } = useCheckboxStatus(props, { model })
  const { isDisabled } = useDisabled(props, { model, isChecked })
  const { handleChange } = useEvent(props, { isLimitExceeded })

  setStoreValue(props, { model })

  return {
    isChecked,
    isDisabled,
    checkboxSize,
    model,
    handleChange,
    focus,
    size,
  }
}
